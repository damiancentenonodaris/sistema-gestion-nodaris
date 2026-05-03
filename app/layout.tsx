import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nodaris — Sistema de gestión",
  description:
    "Sistema que alinea el negocio. CRM para estudios que crean SaaS y landing pages.",
  icons: { icon: "/favicon.svg" },
};

// Aplica el tema antes del primer paint para evitar flash claro.
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('nodaris-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
