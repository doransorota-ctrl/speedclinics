/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://www.googleadservices.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://app.cal.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://www.google-analytics.com https://region1.google-analytics.com https://www.google.com https://www.googleadservices.com https://www.google.com/pagead/ https://connect.facebook.net https://www.facebook.com https://app.cal.com https://cal.com",
      "frame-src https://js.stripe.com https://accounts.google.com https://www.googletagmanager.com https://td.doubleclick.net https://app.cal.com https://cal.com https://www.youtube.com https://youtube.com https:",
      "font-src 'self'",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
