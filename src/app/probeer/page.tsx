"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";

export default function ProbeerPage() {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handlePlay() {
    setPlaying(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.play();
      }
    }, 50);
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 pt-20 lg:pt-28 pb-12">

          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">

            {/* ─── LEFT ON DESKTOP / TOP ON MOBILE: Headline + Video ─── */}
            <div className="w-full lg:flex-1 flex flex-col items-center lg:items-start">

              {/* HEADLINE — mobile only (above video) */}
              <h1 className="lg:hidden text-2xl sm:text-3xl font-extrabold text-surface-900 leading-tight text-center">
                Klant belt. Jij bent bezig.
                <br />
                <span className="text-red-500">Die klus is weg.</span>
              </h1>

              {/* VIDEO */}
              <div className="mt-6 lg:mt-0 w-full flex justify-center lg:justify-start">
                {/* Phone frame */}
                <div className="relative bg-surface-900 rounded-[2.5rem] p-[6px] shadow-2xl w-full max-w-[280px] sm:max-w-[300px]">
                  {/* Inner screen */}
                  <div
                    className="relative rounded-[2.2rem] overflow-hidden bg-black"
                    onClick={handlePlay}
                  >
                    <video
                      ref={videoRef}
                      src="/demo.mp4"
                      className="w-full h-auto block"
                      playsInline
                      preload="metadata"
                      muted
                      loop
                      {...(playing ? { controls: true } : {})}
                    />

                    {/* Play overlay */}
                    {!playing && (
                      <div className="absolute inset-0 cursor-pointer">
                        <div className="absolute inset-0 bg-black/10" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-white/95 shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-200">
                            <svg className="w-9 h-9 text-brand-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                        <div className="absolute bottom-5 right-5 bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded">
                          0:42
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── RIGHT ON DESKTOP / BELOW ON MOBILE: Social proof + copy + CTA ─── */}
            <div className="w-full lg:flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">

              {/* HEADLINE — desktop only (in right column) */}
              <h1 className="hidden lg:block text-5xl font-extrabold text-surface-900 leading-tight text-left mb-6">
                Klant belt. Jij bent bezig.
                <br />
                <span className="text-red-500">Die klus is weg.</span>
              </h1>

              {/* Social Proof */}
              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[11px] font-bold text-surface-400 uppercase tracking-widest">
                  Gebouwd voor vakmensen in Nederland
                </p>
              </div>

              {/* Subheadline */}
              <p className="mt-5 text-base sm:text-lg text-surface-600 leading-relaxed max-w-md">
                Het systeem dat jouw beller direct een WhatsApp stuurt en de afspraak volautomatisch inplant. Mis nooit meer omzet als je op de ladder staat.
              </p>

              {/* CTA */}
              <div className="mt-8 w-full max-w-md">
                <Link
                  href="/demo?ref=probeer"
                  className="flex items-center justify-center gap-2 w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-xl transition-all"
                >
                  Gratis laten instellen
                </Link>
                <p className="text-xs text-surface-400 mt-3 text-center">
                  14 dagen gratis. Daarna €79/mnd. Geen contract.
                </p>
              </div>

              {/* Trust badges */}
              <div className="mt-5 flex flex-col sm:flex-row items-center lg:items-start gap-3 sm:gap-6">
                <span className="inline-flex items-center gap-1.5 text-sm text-surface-500">
                  <svg className="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Werkt met eigen nummer
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-surface-500">
                  <svg className="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Wij doen de technische setup
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
