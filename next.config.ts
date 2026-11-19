import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  serverExternalPackages: [
    "@napi-rs/canvas",
    "@tesseract.js-data/ara",
    "@tesseract.js-data/eng",
    "tesseract.js",
  ],
  outputFileTracingIncludes: {
    "/api/extract": [
      "node_modules/@tesseract.js-data/ara/4.0.0_best_int/ara.traineddata.gz",
      "node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz",
      "node_modules/@napi-rs/canvas/**/*",
      "node_modules/@napi-rs/canvas-*/**/*",
      "node_modules/tesseract.js/**/*",
      "node_modules/tesseract.js-core/**/*",
    ],
  },
};

export default nextConfig;
