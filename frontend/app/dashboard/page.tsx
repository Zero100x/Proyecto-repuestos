'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MOCK_PARTS, MOCK_LOCATIONS, MOCK_STORES } from '../../lib/mockData';
import { formatPriceCOP } from '../../lib/api';
import { Part, Location, InventoryItem } from '../../lib/types';
import {
  BuildingIcon,
  MapPinIcon,
  TagIcon,
  WrenchIcon,
  CheckCircleIcon,
  WhatsAppIcon,
  UserIcon,
  ShieldCheckIcon,
  CarIcon,
  LayersIcon,
} from '../../components/Icons';

export default function DashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'inventory' | 'locations' | 'catalog' | 'leads'>('inventory');

  // Simulated state for inventory editing
  const [inventoryList, setInventoryList] = useState<Array<{
    id: string;
    partName: string;
    brand: string;
    locationName: string;
    condition: string;
    price: number;
    stock: number;
    oem: string;
  }>>([
    { id: 'inv-1', partName: 'Pastillas de freno delanteras cerámicas', brand: 'Akebono', locationName: 'Sede Norte — Bogotá', condition: 'Nuevo', price: 85000, stock: 12, oem: '04465-02220' },
    { id: 'inv-2', partName: 'Discos de freno ventilados delanteros', brand: 'Brembo', locationName: 'Sede Norte — Bogotá', condition: 'Nuevo', price: 195000, stock: 4, oem: '43512-02250' },
    { id: 'inv-3', partName: 'Filtro de aire alto flujo motor', brand: 'Mann', locationName: 'Sede Norte — Bogotá', condition: 'Nuevo', price: 45000, stock: 25, oem: '17801-0T020' },
    { id: 'inv-4', partName: 'Kit bujías Iridio Laser (x4)', brand: 'NGK', locationName: 'Bodega 7 de Agosto', condition: 'Nuevo', price: 18000, stock: 50, oem: 'ILKAR7B11' },
    { id: 'inv-5', partName: 'Amortiguador delantero gas reforzado', brand: 'KYB', locationName: 'Bodega 7 de Agosto', condition: 'Nuevo', price: 250000, stock: 5, oem: '339031' },
    { id: 'inv-6', partName: 'Batería 12V 65Ah sellada', brand: 'MAC Silver', locationName: 'Sede Medellín', condition: 'Nuevo', price: 290000, stock: 4, oem: 'MAC-65-850' },
  ]);

  // Locations state
  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS);
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocCity, setNewLocCity] = useState('Bogotá');
  const [newLocPhone, setNewLocPhone] = useState('');
  const [newLocWa, setNewLocWa] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Editing row state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);

  const startEdit = (item: typeof inventoryList[0]) => {
    setEditingId(item.id);
    setEditPrice(item.price);
    setEditStock(item.stock);
  };

  const saveEdit = (id: string) => {
    setInventoryList(prev =>
      prev.map(item => (item.id === id ? { ...item, price: editPrice, stock: editStock } : item))
    );
    setEditingId(null);
    showNotice('Existencias actualizadas en el servidor');
  };

  const showNotice = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(''), 3000);
  };

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocAddress) return;
    const newLoc: Location = {
      id: `loc-custom-${Date.now()}`,
      storeId: 's-1',
      name: newLocName,
      address: newLocAddress,
      city: newLocCity,
      phone: newLocPhone,
      whatsapp: newLocWa,
      isActive: true,
      store: MOCK_STORES[0],
    };
    setLocations([...locations, newLoc]);
    setNewLocName('');
    setNewLocAddress('');
    setNewLocPhone('');
    setNewLocWa('');
    showNotice(`Nueva sede "${newLoc.name}" registrada con éxito.`);
  };

  const handleLogout = () => {
    localStorage.removeItem('repuestos_token');
    localStorage.removeItem('repuestos_user');
    router.push('/login');
  };

  return (
    <div className="dashboard-container container">
      {/* Top Bar */}
      <div className="dash-top-bar">
        <div className="dash-welcome">
          <div className="dash-avatar">
            <BuildingIcon size={24} />
          </div>
          <div>
            <span className="dash-badge">Almacén Verificado</span>
            <h1 className="dash-title">Panel de Administración de Inventario</h1>
            <span className="dash-subtitle">Repuestos El Motor • Jorge Martínez (Administrador)</span>
          </div>
        </div>

        <div className="dash-top-actions">
          <Link href="/search" className="btn btn-secondary btn-sm">
            Ver Catálogo Público
          </Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card card">
          <span className="kpi-label">Referencias Activas</span>
          <span className="kpi-value">{inventoryList.length}</span>
          <span className="kpi-sub positive">100% Sincronizadas</span>
        </div>
        <div className="kpi-card card">
          <span className="kpi-label">Sedes Registradas</span>
          <span className="kpi-value">{locations.length}</span>
          <span className="kpi-sub">Bogotá y Medellín</span>
        </div>
        <div className="kpi-card card">
          <span className="kpi-label">Leads WhatsApp Recibidos</span>
          <span className="kpi-value text-wa">48</span>
          <span className="kpi-sub positive">+12 hoy</span>
        </div>
        <div className="kpi-card card">
          <span className="kpi-label">Stock Crítico (&lt;5 unid.)</span>
          <span className="kpi-value text-warning">2</span>
          <span className="kpi-sub">Requiere reposición</span>
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="notice-banner animate-fade-in">
          <CheckCircleIcon size={18} />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Dashboard Tabs */}
      <div className="dash-tabs-bar">
        <button
          type="button"
          className={`dash-tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <LayersIcon size={18} />
          <span>Existencias y Precios</span>
        </button>
        <button
          type="button"
          className={`dash-tab ${activeTab === 'locations' ? 'active' : ''}`}
          onClick={() => setActiveTab('locations')}
        >
          <MapPinIcon size={18} />
          <span>Sedes y Bodegas ({locations.length})</span>
        </button>
        <button
          type="button"
          className={`dash-tab ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <WrenchIcon size={18} />
          <span>Compatibilidad Vehicular</span>
        </button>
        <button
          type="button"
          className={`dash-tab ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          <WhatsAppIcon size={18} />
          <span>Métricas de WhatsApp</span>
        </button>
      </div>

      {/* TAB CONTENT: INVENTARIO */}
      {activeTab === 'inventory' && (
        <div className="tab-pane card glass">
          <div className="pane-header">
            <div>
              <h3>Gestión de Existencias por Sede (PDCIRA-9)</h3>
              <p>Actualiza precios y stock en tiempo real. Los cambios se reflejan al instante en Meilisearch.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => showNotice('Catálogo sincronizado exitosamente')}
            >
              Forzar Sync Meilisearch
            </button>
          </div>

          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Repuesto</th>
                  <th>OEM / Ref</th>
                  <th>Sede</th>
                  <th>Condición</th>
                  <th>Precio Actual</th>
                  <th>Stock</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {inventoryList.map(item => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.partName}</strong>
                      <span className="row-brand">{item.brand}</span>
                    </td>
                    <td>
                      <code>{item.oem}</code>
                    </td>
                    <td>{item.locationName}</td>
                    <td>
                      <span className="badge badge-success">{item.condition}</span>
                    </td>
                    <td>
                      {editingId === item.id ? (
                        <input
                          type="number"
                          className="form-input inline-input"
                          value={editPrice}
                          onChange={e => setEditPrice(Number(e.target.value))}
                        />
                      ) : (
                        <span className="table-price">{formatPriceCOP(item.price)}</span>
                      )}
                    </td>
                    <td>
                      {editingId === item.id ? (
                        <input
                          type="number"
                          className="form-input inline-input-sm"
                          value={editStock}
                          onChange={e => setEditStock(Number(e.target.value))}
                        />
                      ) : (
                        <span className={`stock-badge ${item.stock < 5 ? 'low-stock' : ''}`}>
                          {item.stock} unid.
                        </span>
                      )}
                    </td>
                    <td>
                      {editingId === item.id ? (
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => saveEdit(item.id)}
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditingId(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => startEdit(item)}
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: LOCATIONS */}
      {activeTab === 'locations' && (
        <div className="tab-pane">
          <div className="locations-management-grid">
            {/* List of current locations */}
            <div className="card glass">
              <h3 style={{ marginBottom: '1.25rem' }}>Sedes y Bodegas Registradas (PDCIRA-6)</h3>
              <div className="locs-stack">
                {locations.map(loc => (
                  <div key={loc.id} className="loc-item card">
                    <div className="loc-item-header">
                      <h4>{loc.name}</h4>
                      <span className="badge badge-primary">{loc.city}</span>
                    </div>
                    <p className="loc-item-addr">{loc.address}</p>
                    <div className="loc-item-meta">
                      <span>WhatsApp: {loc.whatsapp || 'No configurado'}</span>
                      <span>Tel: {loc.phone || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form to add a new location */}
            <div className="card glass">
              <h3 style={{ marginBottom: '1.25rem' }}>Registrar Nueva Sede o Bodega</h3>
              <form onSubmit={handleCreateLocation} className="loc-form">
                <div className="form-group">
                  <label className="form-label">Nombre de la Sede / Punto:</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej. Sede Calle 80, Bodega Fontibón..."
                    value={newLocName}
                    onChange={e => setNewLocName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ciudad:</label>
                  <select
                    className="form-select"
                    value={newLocCity}
                    onChange={e => setNewLocCity(e.target.value)}
                  >
                    <option value="Bogotá">Bogotá D.C.</option>
                    <option value="Medellín">Medellín</option>
                    <option value="Cali">Cali</option>
                    <option value="Barranquilla">Barranquilla</option>
                    <option value="Bucaramanga">Bucaramanga</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección Física:</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej. Calle 80 # 68-12"
                    value={newLocAddress}
                    onChange={e => setNewLocAddress(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Línea de WhatsApp para Leads:</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+57 300 123 4567"
                    value={newLocWa}
                    onChange={e => setNewLocWa(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono Fijo / PBX:</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+57 1 654 3210"
                    value={newLocPhone}
                    onChange={e => setNewLocPhone(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-full">
                  Guardar y Activar Sede
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CATALOG COMPATIBILITY */}
      {activeTab === 'catalog' && (
        <div className="tab-pane card glass">
          <div className="pane-header">
            <div>
              <h3>Matriz de Compatibilidad ACES/PIES (PDCIRA-7)</h3>
              <p>Asocia marcas vehiculares, modelos, años y motores con referencias de autopartes.</p>
            </div>
          </div>

          <div className="matrix-example-box">
            <div className="matrix-rule">
              <span className="badge badge-success">Regla Activa #1</span>
              <h4>04465-02220 — Pastillas de Freno Delanteras Akebono</h4>
              <p>Compatible con: Toyota Corolla (2019 - 2023) [Motores: 1.8L 4-cyl, 2.0L 4-cyl]</p>
            </div>
            <div className="matrix-rule">
              <span className="badge badge-success">Regla Activa #2</span>
              <h4>43512-02250 — Discos de Freno Ventilados Brembo</h4>
              <p>Compatible con: Toyota Corolla (2020 - 2022) y Renault Duster (2021)</p>
            </div>
            <div className="matrix-rule">
              <span className="badge badge-success">Regla Activa #3</span>
              <h4>ILKAR7B11 — Kit Bujías Láser NGK</h4>
              <p>Compatible con: Toyota Corolla, Chevrolet Onix, Nissan Versa, Mazda 3</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: LEADS & WHATSAPP METRICS */}
      {activeTab === 'leads' && (
        <div className="tab-pane card glass">
          <div className="pane-header">
            <div>
              <h3>Rendimiento del Modelo Lead Generation</h3>
              <p>Consultas y clics de compradores dirigidos a la línea de WhatsApp de tus sedes.</p>
            </div>
          </div>

          <div className="leads-stats-row">
            <div className="lead-stat-box card">
              <h4>Pastillas de freno cerámicas</h4>
              <span className="lead-num text-wa">26 clics WhatsApp</span>
              <p>Sede más consultada: Sede Norte Bogotá</p>
            </div>
            <div className="lead-stat-box card">
              <h4>Kit bujías NGK Iridio</h4>
              <span className="lead-num text-wa">14 clics WhatsApp</span>
              <p>Sede más consultada: Bodega 7 de Agosto</p>
            </div>
            <div className="lead-stat-box card">
              <h4>Amortiguadores KYB gas</h4>
              <span className="lead-num text-wa">8 clics WhatsApp</span>
              <p>Sede más consultada: Bodega 7 de Agosto</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-container {
          padding-top: 2rem;
          padding-bottom: 5rem;
        }
        .dash-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .dash-welcome {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .dash-avatar {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          background: var(--gradient-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dash-badge {
          font-size: 0.75rem;
          font-weight: 700;
          color: #38bdf8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .dash-title {
          font-size: 1.6rem;
          font-weight: 800;
          line-height: 1.2;
        }
        .dash-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .dash-top-actions {
          display: flex;
          gap: 0.75rem;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        .kpi-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }
        .kpi-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.4rem;
        }
        .kpi-value {
          font-size: 2rem;
          font-weight: 900;
          color: var(--text-primary);
          line-height: 1.1;
        }
        .text-wa {
          color: #25d366 !important;
        }
        .text-warning {
          color: var(--accent-warning) !important;
        }
        .kpi-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.4rem;
        }
        .kpi-sub.positive {
          color: #10b981;
          font-weight: 600;
        }
        .notice-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
          padding: 0.75rem 1.25rem;
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }
        .dash-tabs-bar {
          display: flex;
          gap: 0.5rem;
          background: rgba(15, 23, 42, 0.6);
          padding: 0.35rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          margin-bottom: 2rem;
          overflow-x: auto;
        }
        .dash-tab {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.9rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .dash-tab:hover {
          color: var(--text-primary);
        }
        .dash-tab.active {
          background: var(--accent-primary);
          color: white;
        }
        .tab-pane {
          padding: 2rem;
        }
        .pane-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.75rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .pane-header h3 {
          font-size: 1.35rem;
          margin-bottom: 0.3rem;
        }
        .pane-header p {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .table-responsive {
          overflow-x: auto;
        }
        .dash-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        .dash-table th {
          text-align: left;
          padding: 0.85rem 1rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color);
        }
        .dash-table td {
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          vertical-align: middle;
        }
        .row-brand {
          display: block;
          font-size: 0.75rem;
          color: var(--accent-primary-light);
        }
        .table-price {
          font-weight: 700;
          color: #38bdf8;
        }
        .stock-badge {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 600;
        }
        .stock-badge.low-stock {
          background: rgba(245, 158, 11, 0.15);
          color: var(--accent-warning);
        }
        .inline-input {
          width: 120px;
          padding: 0.35rem 0.5rem;
          font-size: 0.85rem;
        }
        .inline-input-sm {
          width: 70px;
          padding: 0.35rem 0.5rem;
          font-size: 0.85rem;
        }
        .btn-group {
          display: flex;
          gap: 0.35rem;
        }
        .locations-management-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 960px) {
          .locations-management-grid {
            grid-template-columns: 1.2fr 1fr;
          }
        }
        .locs-stack {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .loc-item {
          padding: 1.25rem;
          background: #111728;
        }
        .loc-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .loc-item-addr {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }
        .loc-item-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .loc-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .matrix-example-box {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .matrix-rule {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }
        .matrix-rule h4 {
          font-size: 1.05rem;
          margin: 0.4rem 0;
        }
        .matrix-rule p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .leads-stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.25rem;
        }
        .lead-stat-box {
          padding: 1.5rem;
          background: #111728;
        }
        .lead-stat-box h4 {
          font-size: 1rem;
          margin-bottom: 0.4rem;
        }
        .lead-num {
          font-size: 1.25rem;
          font-weight: 800;
          display: block;
          margin-bottom: 0.5rem;
        }
        .lead-stat-box p {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
