import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nodaris — Sistema de gestión",
  description:
    "Sistema que alinea el negocio. CRM para estudios que crean SaaS y landing pages.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
