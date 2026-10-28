import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-primary text-on-primary w-full py-12 border-t border-outline">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop max-w-container-max-width mx-auto">
        <div className="col-span-1 md:col-span-1 flex flex-col gap-2">
          <Link href="/" className="font-heading text-2xl font-black text-on-primary">
            AutoPart Pro
          </Link>
          <p className="text-on-primary-container font-body-md text-xs sm:text-sm mt-3 leading-relaxed">
            © 2026 AutoPart Pro. Plataforma de consulta centralizada y gestión técnica de inventario de repuestos automotrices.
          </p>
        </div>

        <div className="col-span-1 md:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 font-body-md text-sm">
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-xs uppercase font-bold text-on-primary-container tracking-wider">
              Marketplace
            </span>
            <Link href="/search" className="text-gray-300 hover:text-white transition-colors">
              Buscar Repuestos
            </Link>
            <Link href="/stores" className="text-gray-300 hover:text-white transition-colors">
              Almacenes Aliados
            </Link>
            <Link href="/compare" className="text-gray-300 hover:text-white transition-colors">
              Comparador Técnico
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-xs uppercase font-bold text-on-primary-container tracking-wider">
              Proveedores B2B
            </span>
            <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
              Panel de Almacén
            </Link>
            <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
              Ingreso de Almacenes
            </Link>
            <Link href="/search" className="text-gray-300 hover:text-white transition-colors">
              Integración de Stock
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-xs uppercase font-bold text-on-primary-container tracking-wider">
              Soporte
            </span>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">
              Documentación Técnica
            </Link>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">
              Contacto y Asistencia
            </Link>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">
              Estado de Servicios
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-xs uppercase font-bold text-on-primary-container tracking-wider">
              Legal & Normativa
            </span>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">
              Términos de Servicio
            </Link>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">
              Política de Privacidad
            </Link>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">
              Certificación OEM
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
