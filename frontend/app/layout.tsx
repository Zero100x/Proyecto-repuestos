import type { Metadata } from "next";
import "./globals.css";
import Providers from "../components/Providers";

export const metadata: Metadata = {
  title: "RepuestosYA — Encuentra repuestos automotrices al instante en Colombia",
  description:
    "Plataforma digital líder en consulta centralizada de repuestos automotrices. Encuentra la pieza exacta para tu vehículo, compara precios entre almacenes y contacta al instante por WhatsApp.",
  keywords: [
    "repuestos automotrices",
    "autopartes colombia",
    "repuestos bogota",
    "repuestos medellin",
    "buscar repuestos",
    "pastillas de freno",
    "amortiguadores",
    "kit de embrague",
    "repuestos toyota chevrolet renault",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
