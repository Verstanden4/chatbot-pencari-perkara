import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SI PERKARA — Asisten Pencarian Perkara Kejaksaan",
  description:
    "Chatbot AI pencari perkara pada Kejaksaan. Cari berdasarkan nomor perkara, jenis perkara, nama terdakwa, atau tahun.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}