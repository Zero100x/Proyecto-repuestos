import React from 'react';
import Link from 'next/link';
import VehicleCascadeSelector from '../components/VehicleCascadeSelector';

export const metadata = {
  title: 'AutoPart Pro — Buscador de Repuestos Automotrices',
  description: 'Encuentra millones de componentes OEM y de posventa con compatibilidad garantizada.',
};

export default function HomePage() {
  const categories = [
    {
      title: 'Motor',
      desc: 'Componentes internos, bloques y turboalimentadores',
      href: '/search?category=motor',
      image: '/assets/engine.svg',
      fallbackImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCblWWa8hGpCYoMzYPfJciMCn9ozIE8WyMevFLNDkWIWri4hNTB7NUOVDGN35HFq--TgqYPB1-tF0INbVwgeaYYkpvhhtMR6MraNSf0waj4NPE8C66GIF1NoKWfqtW8ovWR3tU6O_9J4uiIvtUn8e1kHaERqeu3OOMqJgRbYY5o7DRr6F6WjGD8SwToyv6fpcDAnPX-La2d0mSXHRFEXMwY3H3MwcS6BLY05Fc0t7bVA0kdJRolM5C4',
    },
    {
      title: 'Frenos',
      desc: 'Discos ventilados, pastillas cerámicas y calipers',
      href: '/search?category=frenos',
      image: '/assets/brakes.svg',
      fallbackImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1n78KYMjDi50iCUbTedtgdVFqCuzyLwBtMmLkwKfr8oNHUU1kTZybJJRRFHujysqABJeBcW0e_8GrcDB0iujxO-D94-BE39q1lPoRt0qMpYUGsR6f8bA-oAO3FTiWLkVcMKrNSmonP0s20J2dMJcQTzcMf-B8nAzfRICkzHEwesaHBicy-IxFCvZJuDtcokDHu6EWlfxQciTsMSmj_cwdMlgCnrwctl0wwaRofI7qfo2vVXqRc1HK',
    },
    {
      title: 'Iluminación',
      desc: 'Ópticas LED matrix, exploradoras y halógenas',
      href: '/search?category=iluminacion',
      image: '/assets/lighting.svg',
      fallbackImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoCqlJqptbHcXi5VnUxNz_M7kLs_SfPsU2KGQ-bAtltELfDBbstQoEIyGGyP58hhlWKGH_sGobbM2Ys74xupZM4noF7NzpUookkbzrMimaC7CutjXHBCPVg3zd8PCYM2b81TOCa8jyYXVwyVU6J0AoEJR4tYXscQaj3O9x0dgtc8hRaEqw8HWqL8vkYSgSbVJ9paiQWAVg8vKFZbnLkAUrJQwCUyNC44a5yJKK-uqkmQJT_ZFSjV9n',
    },
  ];

  const warehouses = [
    {
      name: 'AutoPart Depot Central',
      address: 'Av. de los Industriales 4500, Zona Norte.',
      stock: 'Alto (+15.000 uds)',
      distance: '4.2 km',
      badge: 'Centro Principal',
      verified: true,
      image: '/assets/warehouse.svg',
    },
    {
      name: 'Repuestos Express Sur',
      address: 'Ruta Provincial 21, Km 12.5.',
      stock: 'Medio (+6.200 uds)',
      distance: '12.8 km',
      badge: 'Distribuidor',
      verified: false,
      image: '/assets/warehouse.svg',
    },
  ];

  return (
    <div className="bg-surface text-on-surface antialiased pt-[68px] min-h-screen flex flex-col">
      <main className="w-full flex flex-col items-center flex-1">
        {/* Hero Section */}
        <section className="w-full hero-pattern border-b border-outline-variant py-14 md:py-20 px-margin-mobile md:px-margin-desktop">
          <div className="max-w-container-max-width mx-auto flex flex-col items-center text-center">
            
            {/* Tag / Tech pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-mono text-xs mb-4 border border-outline-variant shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SISTEMA DE GESTIÓN &amp; CONSULTA DE INVENTARIOS</span>
            </div>

            <h1 className="font-display-lg text-3xl sm:text-4xl md:text-display-lg text-primary mb-4 max-w-3xl tracking-tight leading-tight">
              Precision Parts for Professional Grade Systems.
            </h1>
            <p className="font-body-lg text-base sm:text-body-lg text-secondary mb-10 max-w-2xl leading-relaxed">
              Search millions of OEM and aftermarket components with guaranteed compatibility.
            </p>

            {/* Central Search Module (Bento / Card Module) */}
            <div className="w-full max-w-4xl bg-surface-container-lowest border border-outline-variant shadow-[0_4px_20px_rgba(10,31,68,0.08)] rounded-xl p-6 md:p-8 text-left">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-tertiary-container">directions_car</span>
                  <span className="font-heading text-sm sm:text-base font-bold text-primary">
                    Búsqueda Técnica por Vehículo
                  </span>
                </div>
                <span className="font-mono text-xs text-secondary bg-surface-container px-2.5 py-1 rounded">
                  FILTRO EN CASCADA
                </span>
              </div>

              {/* Cascade Form Integration */}
              <VehicleCascadeSelector />
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 w-full max-w-4xl">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-center">
                <div className="font-heading text-2xl font-bold text-primary">+50.000</div>
                <div className="font-mono text-xs text-secondary mt-1">REPUESTOS ACTIVOS</div>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-center">
                <div className="font-heading text-2xl font-bold text-primary">100%</div>
                <div className="font-mono text-xs text-secondary mt-1">COMPATIBILIDAD OEM</div>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-center">
                <div className="font-heading text-2xl font-bold text-primary">+35</div>
                <div className="font-mono text-xs text-secondary mt-1">ALMACENES ALIADOS</div>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-center">
                <div className="font-heading text-2xl font-bold text-on-tertiary-container">&lt; 15 min</div>
                <div className="font-mono text-xs text-secondary mt-1">RESPUESTA WHATSAPP</div>
              </div>
            </div>

          </div>
        </section>

        {/* Popular Categories */}
        <section className="w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-16">
          <div className="flex justify-between items-end mb-8 border-b border-outline-variant pb-2">
            <div>
              <h2 className="font-title-md text-title-md text-primary">Categorías Populares</h2>
              <p className="font-sans text-xs text-secondary mt-1">Componentes clasificados por subsistema automotriz</p>
            </div>
            <Link
              href="/search"
              className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-1 font-bold"
            >
              <span>Ver todas</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                href={cat.href}
                className="group bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-[0_4px_20px_rgba(10,31,68,0.08)] transition-all cursor-pointer flex flex-col"
              >
                <div className="h-48 bg-surface-container flex items-center justify-center p-4 overflow-hidden relative">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="object-contain h-full w-full opacity-90 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6 border-t border-outline-variant flex justify-between items-center mt-auto">
                  <div>
                    <h3 className="font-title-md text-title-md text-primary group-hover:text-on-tertiary-container transition-colors">
                      {cat.title}
                    </h3>
                    <p className="font-label-sm text-label-sm text-secondary mt-1">
                      {cat.desc}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-secondary group-hover:translate-x-1 group-hover:text-primary transition-all">
                    arrow_forward
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Warehouses */}
        <section className="w-full bg-surface-container-low border-y border-outline-variant py-16">
          <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="flex justify-between items-end mb-8 border-b border-outline-variant pb-2">
              <div>
                <h2 className="font-title-md text-title-md text-primary">Almacenes Destacados Cercanos</h2>
                <p className="font-sans text-xs text-secondary mt-1">Red de distribuidores con inventario físico verificado</p>
              </div>
              <Link
                href="/stores"
                className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-1 font-bold"
              >
                <span>Ver mapa</span>
                <span className="material-symbols-outlined text-[16px]">map</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {warehouses.map((wh, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="sm:w-1/3 bg-surface-container h-44 sm:h-auto flex items-center justify-center p-4">
                    <img
                      src={wh.image}
                      alt={wh.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="sm:w-2/3 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-surface-variant text-on-surface-variant font-label-sm text-label-sm px-2 py-1 rounded-sm uppercase tracking-wider font-semibold">
                          {wh.badge}
                        </span>
                        {wh.verified && (
                          <span className="flex items-center text-secondary text-xs font-mono">
                            <span className="material-symbols-outlined text-[14px] mr-1 text-emerald-600">
                              check_circle
                            </span>
                            Verificado
                          </span>
                        )}
                      </div>
                      <h3 className="font-title-md text-title-md text-primary mb-1">
                        {wh.name}
                      </h3>
                      <p className="font-body-md text-body-md text-secondary text-sm">
                        {wh.address}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-6 pt-4 border-t border-outline-variant items-center justify-between">
                      <div className="flex gap-4">
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-secondary uppercase">Inventario</span>
                          <span className="font-body-md text-sm font-semibold text-primary">{wh.stock}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-secondary uppercase">Distancia</span>
                          <span className="font-body-md text-sm font-semibold text-primary">{wh.distance}</span>
                        </div>
                      </div>

                      <Link
                        href={`/search?store=${encodeURIComponent(wh.name)}`}
                        className="px-3 py-1.5 bg-surface-container-high hover:bg-primary hover:text-white text-primary text-xs font-heading font-bold rounded transition-colors"
                      >
                        Ver Stock
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* B2B Supplier Call to Action */}
        <section className="w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-16 text-center">
          <div className="bg-primary text-on-primary rounded-2xl p-8 md:p-12 shadow-lg relative overflow-hidden">
            <div className="max-w-2xl mx-auto flex flex-col items-center">
              <span className="font-mono text-xs uppercase tracking-widest text-tertiary-fixed bg-tertiary-container px-3 py-1 rounded-full mb-4">
                PORTAL PARA ALMACENES Y DISTRIBUIDORES
              </span>
              <h2 className="font-display-lg text-2xl sm:text-3xl font-extrabold text-white mb-4">
                Publica tu catálogo y recibe cotizaciones de compra directas
              </h2>
              <p className="font-body-md text-sm sm:text-base text-gray-300 mb-8 leading-relaxed">
                Conecta tu stock con talleres y compradores particulares sin intermediarios. Recibe solicitudes inmediatas a través de WhatsApp.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/login"
                  className="px-6 py-3 bg-on-tertiary-container text-white font-button text-sm rounded-lg hover:bg-orange-600 transition-colors shadow-md"
                >
                  Registrar mi Almacén
                </Link>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 border border-white/30 text-white font-button text-sm rounded-lg hover:bg-white/10 transition-colors"
                >
                  Acceso al Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
