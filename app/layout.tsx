import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LegalMind — Understand before you sign",
  description: "A clearer way to review freelance contracts.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
