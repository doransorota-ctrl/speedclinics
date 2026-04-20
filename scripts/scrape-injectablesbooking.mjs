#!/usr/bin/env node
/**
 * Scrape injectablesbooking.nl for all Dutch cosmetic/injectable clinics.
 *
 * Outputs:  ~/Desktop/injectablesbooking-klinieken.csv
 *
 * Usage:    node scripts/scrape-injectablesbooking.mjs
 *
 * Columns:  naam, stad, adres, telefoon, website, email, detail_url
 */

import * as cheerio from "cheerio";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const BASE = "https://injectablesbooking.nl";
const DESKTOP = join(homedir(), "Desktop");
const OUTPUT = join(DESKTOP, "injectablesbooking-klinieken.csv");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

async function fetchHtml(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) {
      console.warn(`  ! ${res.status} ${url}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`  ! error ${url}: ${err.message}`);
    return null;
  }
}

/** Sleep for rate limiting (polite to the host). */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Step 1: find all city/listing pages from /steden. */
async function getCityListingUrls() {
  const html = await fetchHtml(`${BASE}/steden`);
  if (!html) return [];
  const $ = cheerio.load(html);
  const urls = new Set();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    // Only botox/lipfiller city pages (they actually list clinics)
    if (/^\/(botox|lipfillers|fillers|injectables|klinieken)\//i.test(href)) {
      urls.add(href.startsWith("http") ? href : BASE + href);
    }
    if (/^\/injectables-/.test(href)) {
      urls.add(BASE + href);
    }
    if (/^\/(noord-holland|zuid-holland|utrecht|gelderland|noord-brabant|limburg|zeeland|friesland|drenthe|overijssel|flevoland|groningen|provincie-)/i.test(href)) {
      urls.add(BASE + href);
    }
  });

  return [...urls];
}

/** Step 2: extract clinic cards from a listing page. */
function parseListingPage(html, cityHint) {
  const $ = cheerio.load(html);
  const clinics = [];

  // Strategy: look for links to /kliniek/* and their nearby content
  $("a[href^='/kliniek/']").each((_, el) => {
    const link = $(el);
    const href = link.attr("href");
    if (!href) return;

    // Try to find the clinic name and address from the card structure
    const card = link.closest("article, .clinic-card, li, div").first();
    const container = card.length ? card : link.parent();

    const name = (link.text() || container.find("h2, h3, .clinic-name").first().text() || "").trim();
    const addressText = container.find(".address, .adres, .location, p").text().trim();

    // Extract address (look for Dutch street patterns)
    let address = "";
    const addrMatch = addressText.match(/([A-Za-zÀ-ÿ\s'.-]+?\s?\d+[a-zA-Z]?(?:\s?-\s?\d+[a-zA-Z]?)?)/);
    if (addrMatch) address = addrMatch[1].trim();

    if (!name || href.includes("#")) return;

    clinics.push({
      name: name.replace(/\s+/g, " "),
      city: cityHint || "",
      address: address,
      phone: "",
      website: "",
      email: "",
      detail_url: BASE + href,
    });
  });

  return clinics;
}

/** Step 3: enrich a clinic with phone/website/email from its detail page. */
async function enrichClinic(clinic) {
  const html = await fetchHtml(clinic.detail_url);
  if (!html) return clinic;
  const $ = cheerio.load(html);

  // Phone: look for tel: links or Dutch phone patterns
  const telLink = $("a[href^='tel:']").first().attr("href");
  if (telLink) {
    clinic.phone = telLink.replace("tel:", "").trim();
  } else {
    const bodyText = $("body").text();
    const phoneMatch = bodyText.match(/(\+?31[\s-]?\(?0?\)?[\s-]?[1-9][\s-]?\d[\s-]?\d[\s-]?\d[\s-]?\d[\s-]?\d[\s-]?\d[\s-]?\d)|(0\d{2,3}[\s-]?\d{6,7})/);
    if (phoneMatch) clinic.phone = phoneMatch[0].replace(/\s+/g, " ").trim();
  }

  // Email
  const mailLink = $("a[href^='mailto:']").first().attr("href");
  if (mailLink) {
    clinic.email = mailLink.replace("mailto:", "").trim();
  }

  // Website: external link that's not injectablesbooking itself
  $("a[href^='http']").each((_, el) => {
    if (clinic.website) return;
    const href = $(el).attr("href") || "";
    if (href.includes("injectablesbooking.nl")) return;
    if (href.includes("facebook.com") || href.includes("instagram.com")) return;
    if (href.includes("google.com") || href.includes("maps.")) return;
    if (href.includes("wa.me") || href.includes("whatsapp")) return;
    clinic.website = href.split("?")[0].replace(/\/$/, "");
  });

  // Address: try to extract from the detail page (often more complete)
  if (!clinic.address) {
    const addrText = $("*").filter((_, el) => {
      const t = $(el).text();
      return /\d+[a-zA-Z]?\s*(?:,\s*)?\d{4}\s?[A-Z]{2}/.test(t);
    }).first().text();
    const addrMatch = addrText.match(/([A-Za-zÀ-ÿ\s'.-]+?\s+\d+[a-zA-Z]?)/);
    if (addrMatch) clinic.address = addrMatch[1].trim();
  }

  // City (fallback): try to find Dutch postal code + city
  if (!clinic.city) {
    const bodyText = $("body").text();
    const cityMatch = bodyText.match(/\d{4}\s?[A-Z]{2}\s+([A-Z][a-zA-Z\s-]+?)(?=[,.\n]|$)/);
    if (cityMatch) clinic.city = cityMatch[1].trim();
  }

  return clinic;
}

function toCSVRow(values) {
  return values
    .map((v) => {
      const s = String(v || "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    })
    .join(",");
}

async function main() {
  console.log("1. Ophalen van stad-pagina's...");
  const listingUrls = await getCityListingUrls();
  console.log(`   ${listingUrls.length} listing-pagina's gevonden.`);

  console.log("2. Klinieken extraheren per pagina...");
  const allClinics = new Map(); // key = detail_url, value = clinic

  for (let i = 0; i < listingUrls.length; i++) {
    const url = listingUrls[i];
    // Derive city hint from URL
    const cityHint = decodeURIComponent(
      url.split("/").pop().replace(/-/g, " ").replace(/\.\w+$/, "")
    );
    process.stdout.write(`  [${i + 1}/${listingUrls.length}] ${url}...`);
    const html = await fetchHtml(url);
    if (!html) {
      console.log(" skip");
      continue;
    }
    const clinics = parseListingPage(html, cityHint);
    clinics.forEach((c) => {
      if (!allClinics.has(c.detail_url)) {
        allClinics.set(c.detail_url, c);
      }
    });
    console.log(` ${clinics.length} klinieken`);
    await sleep(400);
  }

  console.log(`\n3. Verrijken met contactgegevens (${allClinics.size} klinieken)...`);
  const clinicList = [...allClinics.values()];
  for (let i = 0; i < clinicList.length; i++) {
    const c = clinicList[i];
    process.stdout.write(`  [${i + 1}/${clinicList.length}] ${c.name}...`);
    await enrichClinic(c);
    console.log(` ${c.phone || "-"} | ${c.website ? "✓ site" : "-"} | ${c.email ? "✓ mail" : "-"}`);
    await sleep(300);
  }

  console.log("\n4. CSV schrijven...");
  const header = ["naam", "stad", "adres", "telefoon", "email", "website", "detail_url"];
  const rows = [toCSVRow(header)];
  for (const c of clinicList) {
    rows.push(toCSVRow([c.name, c.city, c.address, c.phone, c.email, c.website, c.detail_url]));
  }
  writeFileSync(OUTPUT, rows.join("\n"), "utf8");
  console.log(`✓ Klaar: ${OUTPUT}`);
  console.log(`  ${clinicList.length} unieke klinieken opgeslagen.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
