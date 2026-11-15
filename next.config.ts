import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
