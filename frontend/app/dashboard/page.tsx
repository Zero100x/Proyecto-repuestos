'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  formatPriceCOP,
  fetchInventorySummary,
  fetchStoreInventory,
  uploadInventoryCsv,
  downloadCsvTemplate,
  createPartWithStock,
  updateInventoryStock,
  updateInventoryPartDetails,
  deleteInventoryItem,
  fetchStoreLocations,
  createStoreLocation,
  updateStoreProfile,
  updateStoreLocation,
  fetchCategories,
  uploadPartImage,
  uploadStoreImage,
  onboardUserStore,
  fetchStoreLeads,
  fetchStoreLeadStats,
  updateLeadStatus,
  fetchUnmetDemand,
  fetchStoreReservations,
  fetchStoreReservationStats,
  updateReservationStatus,
  buildWhatsAppLink,
  resolveImageUrl,
} from '../../lib/api';
import {
  StoreInventoryItem,
  InventorySummary,
  BulkUploadReport,
  Location,
  CreatePartWithStockDto,
  PartCompatibilityInput,
  LeadItem,
  LeadStats,
  LeadStatus,
  UnmetDemandItem,
  ReservationItem,
  ReservationStats,
  ReservationStatus,
} from '../../lib/types';
import ReservationVoucherModal from '../../components/ReservationVoucherModal';
import StoreImageUploader from '../../components/StoreImageUploader';
import StoreLocationPicker from '../../components/StoreLocationPicker';

export default function DashboardPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Auth & Session
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'inventory' | 'locations' | 'inquiries' | 'reservations'>('inventory');

  // Summary & KPIs
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Inventory Table State
  const [inventoryList, setInventoryList] = useState<StoreInventoryItem[]>([]);
  const [inventoryTotal, setInventoryTotal] = useState<number>(0);
  const [inventoryPages, setInventoryPages] = useState<number>(1);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'low' | 'out'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Metadata
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  // Inline Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [savingEdit, setSavingEdit] = useState(false);

  // Toast Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isNewPartModalOpen, setIsNewPartModalOpen] = useState(false);
  const [isNewLocationModalOpen, setIsNewLocationModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<StoreInventoryItem | null>(null);

  // Bulk Upload Modal State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkReport, setBulkReport] = useState<BulkUploadReport | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // New Part Form State
  const [newPartForm, setNewPartForm] = useState({
    name: '',
    oemNumber: '',
    brand: '',
    categoryId: '',
    locationId: '',
    price: '',
    stock: '',
    condition: 'NEW' as 'NEW' | 'USED' | 'REFURBISHED',
    description: '',
    hasWarranty: true,
    warranty: '12 Meses',
  });
  const [partGallery, setPartGallery] = useState<
    Array<{ id: string; file?: File; previewUrl: string; name?: string }>
  >([]);
  const [partImageUrlInput, setPartImageUrlInput] = useState<string>('');
  const [useUrlMode, setUseUrlMode] = useState<boolean>(false);
  const [partCompatibilities, setPartCompatibilities] = useState<PartCompatibilityInput[]>([]);
  const [compatDraft, setCompatDraft] = useState({
    make: 'Renault',
    customMake: '',
    model: '',
    yearFrom: '2012',
    yearTo: '2022',
    version: '',
  });
  const [creatingPart, setCreatingPart] = useState(false);
  const [newPartError, setNewPartError] = useState<string | null>(null);

  // Store Onboarding State (for users without a store yet)
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    nit: '',
    phone: '',
    whatsapp: '',
    operatingHours: 'Lunes a Sábado • 08:00 - 18:30',
    hasDelivery: true,
    deliveryDetails: 'Despacho express disponible en Pasto',
    address: 'Carrera 19 # 14-35, Barrio Julián Bucheli',
    city: 'Pasto',
    latitude: 1.2084,
    longitude: -77.2765,
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=80',
  });
  const [onboardingStore, setOnboardingStore] = useState(false);
  const [onboardError, setOnboardError] = useState<string | null>(null);

  // New Location Form State
  const [newLocForm, setNewLocForm] = useState({
    name: '',
    address: 'Carrera 19 # 14-35, Barrio Julián Bucheli',
    city: 'Pasto',
    state: 'Nariño',
    latitude: 1.2084,
    longitude: -77.2765,
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=80',
    phone: '',
    whatsapp: '',
    operatingHours: 'Lunes a Sábado • 08:00 - 18:30',
    hasDelivery: true,
    deliveryDetails: 'Despacho express disponible en Pasto',
  });
  const [creatingLoc, setCreatingLoc] = useState(false);

  // Edit Existing Part Modal State (Implementation #1)
  const [editingPartItem, setEditingPartItem] = useState<StoreInventoryItem | null>(null);
  const [editPartForm, setEditPartForm] = useState({
    name: '',
    oemNumber: '',
    brand: '',
    categoryId: '',
    locationId: '',
    price: '',
    stock: '',
    condition: 'NEW' as 'NEW' | 'USED' | 'REFURBISHED',
    description: '',
    hasWarranty: true,
    warranty: '12 Meses',
  });
  const [editPartGallery, setEditPartGallery] = useState<
    Array<{ id: string; file?: File; previewUrl: string; name?: string }>
  >([]);
  const [editPartImageUrlInput, setEditPartImageUrlInput] = useState<string>('');
  const [editUseUrlMode, setEditUseUrlMode] = useState<boolean>(false);
  const [editPartCompatibilities, setEditPartCompatibilities] = useState<PartCompatibilityInput[]>([]);
  const [editCompatDraft, setEditCompatDraft] = useState({
    make: 'Renault',
    customMake: '',
    model: '',
    yearFrom: '2012',
    yearTo: '2022',
    version: '',
  });
  const [savingPartDetails, setSavingPartDetails] = useState(false);
  const [editPartError, setEditPartError] = useState<string | null>(null);

  // Edit Existing Sede & Store Profile Modal State (Implementation #2)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editLocForm, setEditLocForm] = useState({
    storeName: '',
    storeNit: '',
    name: '',
    address: 'Carrera 19 # 14-35, Barrio Julián Bucheli',
    city: 'Pasto',
    state: 'Nariño',
    latitude: 1.2084,
    longitude: -77.2765,
    imageUrl: '',
    phone: '',
    whatsapp: '',
    operatingHours: 'Lunes a Sábado • 08:00 - 18:30',
    hasDelivery: true,
    deliveryDetails: 'Despacho express disponible en Pasto',
  });
  const [savingLocEdit, setSavingLocEdit] = useState(false);

  // Sprint 4: Leads & Demand Analytics State
  const [leadsList, setLeadsList] = useState<LeadItem[]>([]);
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [unmetDemand, setUnmetDemand] = useState<UnmetDemandItem[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsFilterStatus, setLeadsFilterStatus] = useState<string>('all');
  const [leadUpdatingId, setLeadUpdatingId] = useState<string | null>(null);

  // Sprint 5: Click & Collect Reservations State
  const [reservationsList, setReservationsList] = useState<ReservationItem[]>([]);
  const [reservationStats, setReservationStats] = useState<ReservationStats | null>(null);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationFilterStatus, setReservationFilterStatus] = useState<string>('all');
  const [reservationSearch, setReservationSearch] = useState<string>('');
  const [selectedVoucherReservation, setSelectedVoucherReservation] = useState<ReservationItem | null>(null);
  const [updatingReservationId, setUpdatingReservationId] = useState<string | null>(null);

  // Show auto-dismiss toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // 1. Initial auth read from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('repuestos_token');
      const storedUser = localStorage.getItem('repuestos_user');
      if (storedToken && storedToken !== 'demo-token' && storedToken !== 'demo-jwt-token-repuestos-2026') {
        setToken(storedToken);
      }
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn('Error reading session:', e);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Quick 1-click Demo Login for Store Admin Jorge
  const handleQuickDemoLogin = async () => {
    try {
      setAuthLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'jorge@elmotor.com', password: 'password123' }),
      });
      if (!res.ok) throw new Error('Error al conectar con la API de autenticación');
      const data = await res.json();
      localStorage.setItem('repuestos_token', data.accessToken);
      localStorage.setItem('repuestos_user', JSON.stringify(data.user));
      setToken(data.accessToken);
      setUser(data.user);
      showToast('Sesión iniciada como Jorge Martínez (Almacén El Motor)', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al iniciar sesión demo', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out / Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('repuestos_token');
    localStorage.removeItem('repuestos_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event('auth-changed'));
    showToast('Sesión cerrada correctamente', 'info');
    router.push('/login');
  };

  // 2. Load Metadata (Locations & Categories)
  const loadMetadata = useCallback(async (activeJwt: string) => {
    try {
      const [locs, cats] = await Promise.all([
        fetchStoreLocations(activeJwt).catch(() => []),
        fetchCategories(activeJwt).catch(() => []),
      ]);
      setLocations(locs);
      setCategories(cats);
      setNewPartForm(prev => ({
        ...prev,
        locationId: prev.locationId && locs.some(l => l.id === prev.locationId) ? prev.locationId : (locs[0]?.id || ''),
        categoryId: prev.categoryId && cats.some(c => c.id === prev.categoryId) ? prev.categoryId : (cats[0]?.id || ''),
      }));
    } catch (err) {
      console.warn('Error fetching metadata:', err);
    }
  }, []);

  // 3. Load Summary / KPIs
  const loadSummary = useCallback(async (activeJwt: string) => {
    setSummaryLoading(true);
    try {
      const data = await fetchInventorySummary(activeJwt);
      setSummary(data);
    } catch (err: any) {
      console.warn('Error loading summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // 4. Load Scoped Inventory List
  const loadInventory = useCallback(
    async (activeJwt: string) => {
      setInventoryLoading(true);
      try {
        const res = await fetchStoreInventory(activeJwt, {
          q: searchQuery.trim() || undefined,
          locationId: filterLocation === 'all' ? undefined : filterLocation,
          status: filterStatus === 'all' ? undefined : filterStatus,
          page: currentPage,
          limit: pageSize,
        });
        setInventoryList(res.data);
        setInventoryTotal(res.meta.total);
        setInventoryPages(res.meta.totalPages || 1);
      } catch (err: any) {
        console.warn('Error fetching inventory:', err);
        showToast('Error al cargar la lista de inventario', 'error');
      } finally {
        setInventoryLoading(false);
      }
    },
    [searchQuery, filterLocation, filterStatus, currentPage],
  );

  // Load Click & Collect Reservations Data
  const loadReservationsData = useCallback(
    async (activeJwt: string, status?: string, query?: string) => {
      setReservationsLoading(true);
      try {
        const [resList, resStats] = await Promise.all([
          fetchStoreReservations(activeJwt, {
            status: status && status !== 'all' ? (status as ReservationStatus) : undefined,
            q: query !== undefined ? (query.trim() || undefined) : (reservationSearch.trim() || undefined),
          }),
          fetchStoreReservationStats(activeJwt).catch(() => null),
        ]);
        setReservationsList(resList.data || []);
        setReservationStats(resStats);
      } catch (err: any) {
        console.warn('Error loading reservations data:', err);
      } finally {
        setReservationsLoading(false);
      }
    },
    [reservationSearch],
  );

  const hasStore = Boolean(
    user && (
      user.storeId ||
      user.store?.id ||
      user.roles?.includes('PLATFORM_ADMIN')
    )
  );

  // Trigger loading when token is available AND user has an active store
  useEffect(() => {
    if (token && hasStore) {
      loadMetadata(token);
      loadSummary(token);
      loadInventory(token);
      loadLeadsData(token);
      loadReservationsData(token);
    }
  }, [token, hasStore, loadMetadata, loadSummary, loadInventory, loadReservationsData]);

  // Handle Store Onboarding for accounts without a store yet
  const handleOnboardStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!onboardForm.name.trim()) {
      setOnboardError('Ingresa el nombre comercial de tu almacén en Pasto.');
      return;
    }

    setOnboardingStore(true);
    setOnboardError(null);
    try {
      const result = await onboardUserStore(token, {
        name: onboardForm.name.trim(),
        nit: onboardForm.nit.trim() || undefined,
        phone: onboardForm.phone.trim() || user?.phone || undefined,
        whatsapp: onboardForm.whatsapp.trim() || onboardForm.phone.trim() || user?.phone || undefined,
        address: onboardForm.address.trim() || 'Carrera 19 # 14-35, Barrio Julián Bucheli',
        city: onboardForm.city.trim() || 'Pasto',
        latitude: onboardForm.latitude,
        longitude: onboardForm.longitude,
        imageUrl: onboardForm.imageUrl || undefined,
      });

      localStorage.setItem('repuestos_token', result.accessToken);
      localStorage.setItem('repuestos_user', JSON.stringify(result.user));
      setToken(result.accessToken);
      setUser(result.user);
      window.dispatchEvent(new Event('auth-changed'));
      showToast(
        `¡Almacén "${result.store.name}" registrado en Pasto! Tu Panel de Inventario ya está activo.`,
        'success'
      );
    } catch (err: any) {
      setOnboardError(err.message || 'No se pudo activar tu almacén');
    } finally {
      setOnboardingStore(false);
    }
  };

  // Handle Search Input Debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Inline Stock & Price Editing
  const startEdit = (item: StoreInventoryItem) => {
    setEditingId(item.id);
    setEditPrice(item.price);
    setEditStock(item.stock);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (item: StoreInventoryItem) => {
    if (!token) return;
    setSavingEdit(true);
    try {
      const updated = await updateInventoryStock(token, item.id, {
        price: editPrice,
        stock: editStock,
      });

      // Update in table
      setInventoryList(prev =>
        prev.map(row => (row.id === item.id ? { ...row, price: updated.price, stock: updated.stock } : row)),
      );
      setEditingId(null);
      showToast(`Stock de "${item.part.name}" actualizado y sincronizado en Meilisearch`, 'success');
      // Refresh summary counts
      loadSummary(token);
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar el registro', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete inventory item
  const handleDeleteConfirm = async () => {
    if (!token || !itemToDelete) return;
    try {
      await deleteInventoryItem(token, itemToDelete.id);
      setInventoryList(prev => prev.filter(r => r.id !== itemToDelete.id));
      showToast(`Repuesto removido del inventario del almacén`, 'info');
      setItemToDelete(null);
      loadSummary(token);
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar registro', 'error');
    }
  };

  // Download CSV Template
  const handleDownloadTemplate = async () => {
    if (!token) return;
    try {
      const csvText = await downloadCsvTemplate(token);
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_inventario_autopart_pro.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Plantilla descargada correctamente', 'success');
    } catch (err: any) {
      showToast(err.message || 'No se pudo descargar la plantilla', 'error');
    }
  };

  // Handle CSV Bulk Upload Submission
  const handleBulkUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !csvFile) return;

    setBulkUploading(true);
    setBulkError(null);
    try {
      const report = await uploadInventoryCsv(token, csvFile, dryRun);
      setBulkReport(report);
      if (!dryRun) {
        showToast(
          `Carga masiva completada: ${report.partsCreated} repuestos creados, ${report.inventoryCreated + report.inventoryUpdated} existencias actualizadas`,
          'success',
        );
        loadInventory(token);
        loadSummary(token);
      } else {
        showToast(`Simulación completada: ${report.totalRows} filas analizadas`, 'info');
      }
    } catch (err: any) {
      setBulkError(err.message || 'Error procesando el archivo CSV');
    } finally {
      setBulkUploading(false);
    }
  };

  // Commit from Dry Run to Real Upload
  const handleCommitDryRun = async () => {
    if (!token || !csvFile) return;
    setDryRun(false);
    setBulkUploading(true);
    setBulkError(null);
    try {
      const report = await uploadInventoryCsv(token, csvFile, false);
      setBulkReport(report);
      showToast(
        `¡Carga real exitosa! ${report.partsCreated} creados, ${report.inventoryCreated + report.inventoryUpdated} asignados a sedes`,
        'success',
      );
      loadInventory(token);
      loadSummary(token);
    } catch (err: any) {
      setBulkError(err.message || 'Error al aplicar cambios definitivos');
    } finally {
      setBulkUploading(false);
    }
  };

  // Helper to add a vehicle compatibility chip
  const handleAddCompatibilityDraft = () => {
    const resolvedMake = (compatDraft.make === '__OTHER__' ? compatDraft.customMake : compatDraft.make).trim();
    const resolvedModel = compatDraft.model.trim();
    if (!resolvedMake || !resolvedModel) return;

    const yFrom = Number(compatDraft.yearFrom) || 2015;
    const yTo = Number(compatDraft.yearTo) || yFrom;
    const newEntry: PartCompatibilityInput = {
      make: resolvedMake,
      model: resolvedModel,
      yearFrom: Math.min(yFrom, yTo),
      yearTo: Math.max(yFrom, yTo),
      version: compatDraft.version.trim() || undefined,
    };

    setPartCompatibilities(prev => {
      const exists = prev.some(
        c =>
          c.make.toLowerCase() === newEntry.make.toLowerCase() &&
          c.model.toLowerCase() === newEntry.model.toLowerCase() &&
          c.yearFrom === newEntry.yearFrom &&
          c.yearTo === newEntry.yearTo
      );
      return exists ? prev : [...prev, newEntry];
    });
    setCompatDraft(prev => ({ ...prev, model: '', version: '' }));
  };

  // Handle New Part Submission (PDCIRA-13)
  const handleNewPartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const resolvedCategoryId = newPartForm.categoryId || categories[0]?.id;
    const resolvedLocationId = newPartForm.locationId || locations[0]?.id;

    if (!newPartForm.name.trim() || !resolvedCategoryId || !resolvedLocationId) {
      setNewPartError('Por favor completa los campos obligatorios (*)');
      return;
    }

    setCreatingPart(true);
    setNewPartError(null);
    try {
      // 1. Procesar galería multi-imagen (hasta 5 fotos)
      const uploadedUrls: string[] = [];
      for (const item of partGallery.slice(0, 5)) {
        if (item.file) {
          try {
            const uploadRes = await uploadPartImage(token, item.file);
            if (uploadRes?.url) {
              uploadedUrls.push(uploadRes.url);
              continue;
            }
          } catch {
            // Fallback a uploadStoreImage / DataURL
            const fallbackRes = await uploadStoreImage(item.file);
            if (fallbackRes?.imageUrl) {
              uploadedUrls.push(fallbackRes.imageUrl);
            }
          }
        } else if (item.previewUrl) {
          uploadedUrls.push(item.previewUrl);
        }
      }

      if (partImageUrlInput.trim() && uploadedUrls.length < 5 && !uploadedUrls.includes(partImageUrlInput.trim())) {
        uploadedUrls.push(partImageUrlInput.trim());
      }

      const finalCompatibilities = [...partCompatibilities];
      // Si el usuario escribió un modelo en el borrador pero olvidó darle "+ Agregar", lo incluimos automáticamente
      const draftMake = (compatDraft.make === '__OTHER__' ? compatDraft.customMake : compatDraft.make).trim();
      const draftModel = compatDraft.model.trim();
      if (draftMake && draftModel) {
        const yFrom = Number(compatDraft.yearFrom) || 2015;
        const yTo = Number(compatDraft.yearTo) || yFrom;
        const alreadyIn = finalCompatibilities.some(
          c => c.make.toLowerCase() === draftMake.toLowerCase() && c.model.toLowerCase() === draftModel.toLowerCase()
        );
        if (!alreadyIn) {
          finalCompatibilities.push({
            make: draftMake,
            model: draftModel,
            yearFrom: Math.min(yFrom, yTo),
            yearTo: Math.max(yFrom, yTo),
            version: compatDraft.version.trim() || undefined,
          });
        }
      }

      const resolvedWarranty = newPartForm.hasWarranty
        ? (newPartForm.warranty.trim() || '12 Meses')
        : 'Sin garantía';

      const dto: CreatePartWithStockDto = {
        name: newPartForm.name.trim(),
        oemNumber: newPartForm.oemNumber.trim() ? newPartForm.oemNumber.trim().toUpperCase() : undefined,
        brand: newPartForm.brand.trim() || undefined,
        categoryId: resolvedCategoryId,
        locationId: resolvedLocationId,
        price: Number(newPartForm.price) || 0,
        stock: Number(newPartForm.stock) || 0,
        condition: newPartForm.condition,
        description: newPartForm.description.trim() || undefined,
        hasWarranty: newPartForm.hasWarranty,
        warranty: resolvedWarranty,
        imageUrl: uploadedUrls[0] || undefined,
        images: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        compatibilities: finalCompatibilities.length > 0 ? finalCompatibilities : undefined,
      };

      await createPartWithStock(token, dto);
      const oemLabel = dto.oemNumber ? ` (OEM ${dto.oemNumber})` : '';
      showToast(`Repuesto "${dto.name}"${oemLabel} registrado con ${uploadedUrls.length || 1} foto(s) y sincronizado`, 'success');
      setIsNewPartModalOpen(false);
      // Reset form
      setNewPartForm({
        name: '',
        oemNumber: '',
        brand: '',
        categoryId: categories[0]?.id || '',
        locationId: locations[0]?.id || '',
        price: '',
        stock: '',
        condition: 'NEW',
        description: '',
        hasWarranty: true,
        warranty: '12 Meses',
      });
      setPartGallery([]);
      setPartCompatibilities([]);
      setCompatDraft({
        make: 'Renault',
        customMake: '',
        model: '',
        yearFrom: '2012',
        yearTo: '2022',
        version: '',
      });
      setPartImageUrlInput('');
      setUseUrlMode(false);
      loadInventory(token);
      loadSummary(token);
    } catch (err: any) {
      setNewPartError(err.message || 'Error al crear la pieza');
    } finally {
      setCreatingPart(false);
    }
  };

  // Handle Create Sede / Location
  const handleCreateLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user?.storeId) return;

    setCreatingLoc(true);
    try {
      await createStoreLocation(token, {
        storeId: user.storeId,
        name: newLocForm.name.trim(),
        address: newLocForm.address.trim(),
        city: newLocForm.city.trim(),
        state: newLocForm.state.trim() || undefined,
        latitude: newLocForm.latitude,
        longitude: newLocForm.longitude,
        imageUrl: newLocForm.imageUrl || undefined,
        phone: newLocForm.phone.trim() || undefined,
        whatsapp: newLocForm.whatsapp.trim() || undefined,
      });

      showToast(`Nueva sede "${newLocForm.name}" registrada exitosamente con coordenadas GPS`, 'success');
      setIsNewLocationModalOpen(false);
      setNewLocForm({
        name: '',
        address: 'Carrera 19 # 14-35, Barrio Julián Bucheli',
        city: 'Pasto',
        state: 'Nariño',
        latitude: 1.2084,
        longitude: -77.2765,
        imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=80',
        phone: '',
        whatsapp: '',
    operatingHours: 'Lunes a Sábado • 08:00 - 18:30',
    hasDelivery: true,
    deliveryDetails: 'Despacho express disponible en Pasto',
      });
      loadMetadata(token);
      loadSummary(token);
    } catch (err: any) {
      showToast(err.message || 'Error al registrar la sede', 'error');
    } finally {
      setCreatingLoc(false);
    }
  };

  // Implementation #1: Open & Submit Full Part Edit Modal
  const openEditPartModal = (item: StoreInventoryItem) => {
    const oemNum =
      item.part?.partNumbers?.find(pn => pn.type === 'OEM')?.number ||
      item.part?.partNumbers?.[0]?.number ||
      '';

    const partObj = item.part as any;
    const hasWarranty = partObj?.hasWarranty !== undefined
      ? Boolean(partObj.hasWarranty)
      : (partObj?.warranty ? partObj.warranty !== 'Sin garantía' : true);
    const warrantyText = partObj?.warranty && partObj.warranty !== 'Sin garantía'
      ? partObj.warranty
      : '12 Meses';

    setEditPartForm({
      name: item.part?.name || '',
      oemNumber: oemNum === 'SIN-OEM' ? '' : oemNum,
      brand: item.part?.brand || '',
      categoryId: item.part?.categoryId || item.part?.category?.id || categories[0]?.id || '',
      locationId: item.locationId || item.location?.id || locations[0]?.id || '',
      price: String(item.price ?? 0),
      stock: String(item.stock ?? 0),
      condition: item.condition || 'NEW',
      description: item.part?.description || '',
      hasWarranty,
      warranty: warrantyText,
    });

    const rawImages =
      item.part?.images && item.part.images.length > 0
        ? item.part.images
        : item.part?.imageUrl
        ? [item.part.imageUrl]
        : [];
    setEditPartGallery(
      rawImages.slice(0, 5).map((url, idx) => ({
        id: `existing-${idx}-${Date.now()}`,
        previewUrl: url,
        name: `Foto ${idx + 1}`,
      })),
    );
    setEditPartImageUrlInput('');
    setEditUseUrlMode(false);

    // Group existing CompatibilityItem[] by Make + Model into clean { make, model, yearFrom, yearTo } chips
    const groupedMap = new Map<string, { make: string; model: string; years: number[]; version?: string }>();
    for (const c of item.part?.compatibility || []) {
      const makeName = c.version?.year?.model?.make?.name;
      const modelName = c.version?.year?.model?.name;
      const yearNum = c.version?.year?.year;
      if (!makeName || !modelName || !yearNum) continue;
      const key = `${makeName.toLowerCase()}|${modelName.toLowerCase()}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          make: makeName,
          model: modelName,
          years: [yearNum],
          version: c.version?.name,
        });
      } else {
        groupedMap.get(key)!.years.push(yearNum);
      }
    }
    const groupedChips: PartCompatibilityInput[] = Array.from(groupedMap.values()).map(g => ({
      make: g.make,
      model: g.model,
      yearFrom: Math.min(...g.years),
      yearTo: Math.max(...g.years),
      version: g.version,
    }));
    setEditPartCompatibilities(groupedChips);
    setEditCompatDraft({
      make: 'Renault',
      customMake: '',
      model: '',
      yearFrom: '2012',
      yearTo: '2022',
      version: '',
    });
    setEditPartError(null);
    setEditingPartItem(item);
  };

  const handleAddEditCompatibilityDraft = () => {
    const resolvedMake = (editCompatDraft.make === '__OTHER__' ? editCompatDraft.customMake : editCompatDraft.make).trim();
    const resolvedModel = editCompatDraft.model.trim();
    if (!resolvedMake || !resolvedModel) return;

    const yFrom = Number(editCompatDraft.yearFrom) || 2015;
    const yTo = Number(editCompatDraft.yearTo) || yFrom;
    const newEntry: PartCompatibilityInput = {
      make: resolvedMake,
      model: resolvedModel,
      yearFrom: Math.min(yFrom, yTo),
      yearTo: Math.max(yFrom, yTo),
      version: editCompatDraft.version.trim() || undefined,
    };

    setEditPartCompatibilities(prev => {
      const exists = prev.some(
        c =>
          c.make.toLowerCase() === newEntry.make.toLowerCase() &&
          c.model.toLowerCase() === newEntry.model.toLowerCase() &&
          c.yearFrom === newEntry.yearFrom &&
          c.yearTo === newEntry.yearTo
      );
      return exists ? prev : [...prev, newEntry];
    });
    setEditCompatDraft(prev => ({ ...prev, model: '', version: '' }));
  };

  const handleEditPartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingPartItem) return;

    if (!editPartForm.name.trim()) {
      setEditPartError('El nombre de la pieza es obligatorio.');
      return;
    }

    setSavingPartDetails(true);
    setEditPartError(null);
    try {
      const uploadedUrls: string[] = [];
      for (const item of editPartGallery.slice(0, 5)) {
        if (item.file) {
          try {
            const uploadRes = await uploadPartImage(token, item.file);
            if (uploadRes?.url) {
              uploadedUrls.push(uploadRes.url);
              continue;
            }
          } catch {
            const fallbackRes = await uploadStoreImage(item.file);
            if (fallbackRes?.imageUrl) {
              uploadedUrls.push(fallbackRes.imageUrl);
            }
          }
        } else if (item.previewUrl) {
          uploadedUrls.push(item.previewUrl);
        }
      }

      if (editPartImageUrlInput.trim() && uploadedUrls.length < 5 && !uploadedUrls.includes(editPartImageUrlInput.trim())) {
        uploadedUrls.push(editPartImageUrlInput.trim());
      }

      const finalCompatibilities = [...editPartCompatibilities];
      const draftMake = (editCompatDraft.make === '__OTHER__' ? editCompatDraft.customMake : editCompatDraft.make).trim();
      const draftModel = editCompatDraft.model.trim();
      if (draftMake && draftModel) {
        const yFrom = Number(editCompatDraft.yearFrom) || 2015;
        const yTo = Number(editCompatDraft.yearTo) || yFrom;
        const alreadyIn = finalCompatibilities.some(
          c => c.make.toLowerCase() === draftMake.toLowerCase() && c.model.toLowerCase() === draftModel.toLowerCase()
        );
        if (!alreadyIn) {
          finalCompatibilities.push({
            make: draftMake,
            model: draftModel,
            yearFrom: Math.min(yFrom, yTo),
            yearTo: Math.max(yFrom, yTo),
            version: editCompatDraft.version.trim() || undefined,
          });
        }
      }

      const resolvedWarranty = editPartForm.hasWarranty
        ? (editPartForm.warranty.trim() || '12 Meses')
        : 'Sin garantía';

      await updateInventoryPartDetails(token, editingPartItem.id, {
        name: editPartForm.name.trim(),
        oemNumber: editPartForm.oemNumber.trim(),
        brand: editPartForm.brand.trim(),
        categoryId: editPartForm.categoryId || undefined,
        locationId: editPartForm.locationId || undefined,
        price: Number(editPartForm.price) || 0,
        stock: Number(editPartForm.stock) || 0,
        condition: editPartForm.condition,
        description: editPartForm.description.trim(),
        hasWarranty: editPartForm.hasWarranty,
        warranty: resolvedWarranty,
        imageUrl: uploadedUrls[0] || '',
        images: uploadedUrls,
        compatibilities: finalCompatibilities,
      });

      showToast(
        `Ficha de "${editPartForm.name.trim()}" actualizada (${uploadedUrls.length} foto(s), ${finalCompatibilities.length} vehículo(s)) y sincronizada en Meilisearch`,
        'success'
      );
      setEditingPartItem(null);
      loadInventory(token);
      loadSummary(token);
    } catch (err: any) {
      setEditPartError(err.message || 'No se pudo actualizar la ficha del repuesto');
    } finally {
      setSavingPartDetails(false);
    }
  };

  // Implementation #2: Open & Submit Sede + Store Profile Edit Modal
  const openEditLocationModal = (loc: Location) => {
    setEditLocForm({
      storeName: summary?.store?.name || user?.store?.name || loc.store?.name || '',
      storeNit: summary?.store?.nit || user?.store?.nit || loc.store?.nit || '',
      name: loc.name || '',
      address: loc.address || 'Carrera 19 # 14-35, Barrio Julián Bucheli',
      city: loc.city || 'Pasto',
      state: loc.state || 'Nariño',
      latitude: Number(loc.latitude) || 1.2084,
      longitude: Number(loc.longitude) || -77.2765,
      imageUrl:
        loc.imageUrl ||
        summary?.store?.imageUrl ||
        loc.store?.imageUrl ||
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=80',
      phone: loc.phone || summary?.store?.phone || user?.phone || '',
      whatsapp: loc.whatsapp || loc.phone || user?.phone || '',
      operatingHours:
        loc.operatingHours ||
        summary?.store?.operatingHours ||
        user?.store?.operatingHours ||
        'Lunes a Sábado • 08:00 - 18:30',
      hasDelivery:
        loc.hasDelivery !== undefined
          ? loc.hasDelivery
          : summary?.store?.hasDelivery !== undefined
          ? summary.store.hasDelivery
          : true,
      deliveryDetails:
        loc.deliveryDetails ||
        summary?.store?.deliveryDetails ||
        user?.store?.deliveryDetails ||
        'Despacho express disponible en Pasto',
    });
    setEditingLocation(loc);
  };

  const handleEditLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingLocation) return;

    setSavingLocEdit(true);
    try {
      const storeId = user?.storeId || summary?.store?.id || editingLocation.storeId;
      await updateStoreLocation(token, editingLocation.id, {
        name: editLocForm.name.trim() || 'Sede Principal',
        address: editLocForm.address.trim(),
        city: editLocForm.city.trim() || 'Pasto',
        state: editLocForm.state.trim() || 'Nariño',
        latitude: editLocForm.latitude,
        longitude: editLocForm.longitude,
        imageUrl: editLocForm.imageUrl || undefined,
        phone: editLocForm.phone.trim() || undefined,
        whatsapp: editLocForm.whatsapp.trim() || editLocForm.phone.trim() || undefined,
        operatingHours: editLocForm.operatingHours.trim() || 'Lunes a Sábado • 08:00 - 18:30',
        hasDelivery: editLocForm.hasDelivery,
        deliveryDetails: editLocForm.deliveryDetails.trim() || undefined,
      });

      if (storeId && editLocForm.storeName.trim()) {
        const updatedStore = await updateStoreProfile(token, storeId, {
          name: editLocForm.storeName.trim(),
          nit: editLocForm.storeNit.trim() || undefined,
          phone: editLocForm.phone.trim() || undefined,
          imageUrl: editLocForm.imageUrl || undefined,
          operatingHours: editLocForm.operatingHours.trim() || 'Lunes a Sábado • 08:00 - 18:30',
          hasDelivery: editLocForm.hasDelivery,
          deliveryDetails: editLocForm.deliveryDetails.trim() || undefined,
        });
        if (user) {
          const nextUser = {
            ...user,
            store: { ...(user.store || {}), ...updatedStore },
          };
          setUser(nextUser);
          localStorage.setItem('repuestos_user', JSON.stringify(nextUser));
          window.dispatchEvent(new Event('auth-changed'));
        }
      }

      showToast(
        `Sede "${editLocForm.name.trim()}" y perfil del almacén actualizados en el mapa de Pasto`,
        'success'
      );
      setEditingLocation(null);
      loadMetadata(token);
      loadSummary(token);
      loadInventory(token);
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar los datos de la sede', 'error');
    } finally {
      setSavingLocEdit(false);
    }
  };

  // Sprint 4: Load Leads, Conversion KPIs & Unmet Demand
  const loadLeadsData = useCallback(async (activeJwt: string, status?: string) => {
    setLeadsLoading(true);
    try {
      const [leadsRes, statsRes, unmetRes] = await Promise.all([
        fetchStoreLeads(activeJwt, {
          status: status && status !== 'all' ? (status as LeadStatus) : undefined,
        }),
        fetchStoreLeadStats(activeJwt).catch(() => null),
        fetchUnmetDemand(activeJwt).catch(() => []),
      ]);
      setLeadsList(leadsRes.data || []);
      setLeadStats(statsRes);
      setUnmetDemand(unmetRes || []);
    } catch (err: any) {
      console.warn('Error loading leads data:', err);
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    if (!token) return;
    setLeadUpdatingId(leadId);
    try {
      await updateLeadStatus(token, leadId, newStatus);
      showToast(`Estado del prospecto actualizado a "${newStatus}"`, 'success');
      setLeadsList(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      fetchStoreLeadStats(token).then(setLeadStats).catch(() => {});
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar estado del lead', 'error');
    } finally {
      setLeadUpdatingId(null);
    }
  };

  // Sprint 5: Click & Collect Handlers

  const handleDeliverReservation = async (reservation: ReservationItem) => {
    if (!token) return;
    setUpdatingReservationId(reservation.id);
    try {
      const updated = await updateReservationStatus(token, reservation.id, {
        status: ReservationStatus.COMPLETED,
      });
      showToast(
        `¡Entrega en mostrador confirmada! Reserva ${reservation.code} entregada y ${reservation.quantity} unidad(es) descontada(s) del stock físico.`,
        'success',
      );
      setReservationsList(prev => prev.map(r => (r.id === reservation.id ? updated : r)));
      fetchStoreReservationStats(token).then(setReservationStats).catch(() => {});
      loadSummary(token);
      loadInventory(token);
    } catch (err: any) {
      showToast(err.message || 'Error al completar entrega en mostrador', 'error');
    } finally {
      setUpdatingReservationId(null);
    }
  };

  const handleCancelReservation = async (reservation: ReservationItem) => {
    if (!token) return;
    if (!window.confirm(`¿Estás seguro de cancelar la reserva ${reservation.code}? Se liberará el compromiso de compra.`)) {
      return;
    }
    setUpdatingReservationId(reservation.id);
    try {
      const updated = await updateReservationStatus(token, reservation.id, {
        status: ReservationStatus.CANCELLED,
      });
      showToast(`Reserva ${reservation.code} cancelada`, 'info');
      setReservationsList(prev => prev.map(r => (r.id === reservation.id ? updated : r)));
      fetchStoreReservationStats(token).then(setReservationStats).catch(() => {});
    } catch (err: any) {
      showToast(err.message || 'Error al cancelar la reserva', 'error');
    } finally {
      setUpdatingReservationId(null);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col antialiased pt-[68px]">
      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs font-heading font-bold transition-all transform animate-bounce ${
            toast.type === 'success'
              ? 'bg-[#10b981] text-white'
              : toast.type === 'error'
              ? 'bg-[#ef4444] text-white'
              : 'bg-[var(--primary)] text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      <main className="flex-1 p-4 md:px-margin-desktop py-8 max-w-container-max-width mx-auto w-full">
        {/* Unauthenticated / Demo Banner */}
        {!token && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600 text-2xl">lock</span>
              <div>
                <h4 className="font-heading text-sm font-bold text-amber-900">
                  Modo Vista Previa de Almacén B2B
                </h4>
                <p className="font-sans text-xs text-amber-800">
                  Para editar existencias físicas y subir archivos CSV con el backend activo, inicia sesión con un almacén verificado.
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link
                href="/login"
                className="px-5 py-2.5 bg-amber-600 text-white rounded-xl font-heading text-xs font-bold hover:bg-amber-700 transition shadow-sm"
              >
                Iniciar Sesión / Registrar Cuenta
              </Link>
            </div>
          </div>
        )}

        {/* Store Onboarding / Lock Screen for Authenticated Users WITHOUT a Store */}
        {token && !hasStore ? (
          <div className="max-w-4xl mx-auto py-4">
            <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(10,31,68,0.06)]">
              {/* Top Lock Header Banner */}
              <div className="bg-[var(--primary)] text-white p-6 sm:p-10 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-300/30 mb-3">
                      <span className="material-symbols-outlined text-sm">lock</span>
                      <span>PANEL DE INVENTARIO BLOQUEADO • CUENTA COMPRADOR</span>
                    </div>
                    <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                      ¿Tienes un almacén o tienda de repuestos en Pasto?
                    </h1>
                    <p className="font-sans text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                      Tu cuenta actual (<strong className="text-white">{user?.email}</strong>) no tiene un almacén registrado. Registra los datos de tu local en <strong>San Juan de Pasto, Nariño</strong> para desbloquear tu Panel de Inventario, publicar repuestos con fotos y aparecer en el Radar Logístico GPS.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                    <Link
                      href="/search"
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-heading text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">search</span>
                      <span>Seguir como Comprador</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 rounded-xl font-heading text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Store Activation Form */}
              <form onSubmit={handleOnboardStoreSubmit} className="p-6 sm:p-10 space-y-6">
                {onboardError && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-sans text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-red-600">error</span>
                    <span>{onboardError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                      Nombre Comercial del Almacén *
                    </label>
                    <input
                      type="text"
                      required
                      value={onboardForm.name}
                      onChange={e => setOnboardForm({ ...onboardForm, name: e.target.value })}
                      placeholder="Ej: Autopartes Galeras Pasto"
                      className="w-full px-3.5 py-2.5 bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:bg-white focus:border-[var(--primary)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                      NIT / RUT Comercial <span className="text-[var(--secondary)] font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={onboardForm.nit}
                      onChange={e => setOnboardForm({ ...onboardForm, nit: e.target.value })}
                      placeholder="Ej: 900.412.889-1"
                      className="w-full px-3.5 py-2.5 bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:bg-white focus:border-[var(--primary)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                      WhatsApp de Ventas y Mostrador *
                    </label>
                    <input
                      type="tel"
                      required
                      value={onboardForm.phone || user?.phone || ''}
                      onChange={e =>
                        setOnboardForm({
                          ...onboardForm,
                          phone: e.target.value,
                          whatsapp: e.target.value,
                        })
                      }
                      placeholder="+57 315 800 1122"
                      className="w-full px-3.5 py-2.5 bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:bg-white focus:border-[var(--primary)] outline-none"
                    />
                  </div>
                </div>

                {/* Store Facade Photo */}
                <StoreImageUploader
                  value={onboardForm.imageUrl}
                  onChange={url => setOnboardForm({ ...onboardForm, imageUrl: url })}
                  storeName={onboardForm.name || 'Mi Almacén en Pasto'}
                />

                {/* Store Location Map Picker in Pasto */}
                <StoreLocationPicker
                  value={{
                    address: onboardForm.address,
                    city: onboardForm.city,
                    latitude: onboardForm.latitude,
                    longitude: onboardForm.longitude,
                  }}
                  onChange={locVal =>
                    setOnboardForm({
                      ...onboardForm,
                      address: locVal.address,
                      city: locVal.city,
                      latitude: locVal.latitude,
                      longitude: locVal.longitude,
                    })
                  }
                />

                <div className="pt-4 border-t border-[var(--outline-variant)] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-[var(--secondary)]">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
                    <span>Activación inmediata sin costo • Tu inventario iniciará en 0 unidades listas para operar.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={onboardingStore}
                    className="w-full sm:w-auto px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white rounded-xl font-heading text-xs font-bold transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {onboardingStore ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-base">autorenew</span>
                        <span>Activando tu Almacén...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">lock_open</span>
                        <span>Registrar mi Almacén y Desbloquear Inventario</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
        <>
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 pb-6 border-b border-[var(--outline-variant)]">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--surface-container)] text-[var(--on-surface-variant)] font-mono text-[10px] mb-2 border border-[var(--outline-variant)]">
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              {summary
                ? `ALMACÉN: ${summary.store.name.toUpperCase()}`
                : `ALMACÉN: ${(user?.store?.name || 'MI ALMACÉN EN PASTO').toUpperCase()}`}
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--primary)] mb-1">
              Gestión de Inventario y Carga Masiva (Sprint 3)
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[var(--secondary)]">
              Sincronización multi-sede con Meilisearch, validación RFC 4180 de CSV y control de compatibilidad OEM.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
            {/* Download Template Button */}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-[var(--outline-variant)] text-[var(--primary)] rounded-xl font-heading text-xs font-bold hover:bg-[var(--surface-container-low)] transition-all shadow-sm"
              title="Descargar plantilla CSV oficial compatible con Excel en Español"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Plantilla CSV</span>
            </button>

            {/* Bulk Upload Modal Trigger */}
            <button
              type="button"
              onClick={() => {
                setBulkReport(null);
                setBulkError(null);
                setIsBulkModalOpen(true);
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[var(--outline-variant)] text-[var(--primary)] rounded-xl font-heading text-xs font-bold hover:bg-[var(--surface-container-low)] transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-base">upload_file</span>
              <span>Carga Masiva (CSV)</span>
            </button>

            {/* Quick Part Creation Modal Trigger */}
            <button
              type="button"
              onClick={() => {
                setNewPartError(null);
                setNewPartForm(prev => ({
                  ...prev,
                  categoryId: prev.categoryId && categories.some(c => c.id === prev.categoryId) ? prev.categoryId : (categories[0]?.id || ''),
                  locationId: prev.locationId && locations.some(l => l.id === prev.locationId) ? prev.locationId : (locations[0]?.id || ''),
                }));
                setIsNewPartModalOpen(true);
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl font-heading text-xs font-bold hover:bg-[var(--primary-container)] transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Añadir Repuesto</span>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-heading text-xs font-bold hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
              title="Cerrar sesión de la cuenta actual"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Bento Grid: KPI Cards (Real Data from /api/inventory/summary) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total Distinct Parts */}
          <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:shadow-[0_4px_20px_rgba(10,31,68,0.06)] transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider font-semibold">
                Referencias Únicas
              </span>
              <div className="p-2 bg-[var(--primary-container)]/10 text-[var(--primary)] rounded-xl">
                <span className="material-symbols-outlined text-lg">category</span>
              </div>
            </div>
            <div>
              <div className="font-heading text-3xl font-extrabold text-[var(--primary)] mb-1">
                {summaryLoading ? '...' : summary?.totalItems ?? 0}
              </div>
              <div className="font-sans text-xs text-[var(--secondary)]">Repuestos registrados en catálogo</div>
            </div>
          </div>

          {/* Total Units in Stock */}
          <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:shadow-[0_4px_20px_rgba(10,31,68,0.06)] transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider font-semibold">
                Unidades Físicas
              </span>
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <span className="material-symbols-outlined text-lg">inventory</span>
              </div>
            </div>
            <div>
              <div className="font-heading text-3xl font-extrabold text-[var(--primary)] mb-1">
                {summaryLoading ? '...' : summary?.totalUnits ?? 0}
              </div>
              <div className="flex items-center gap-1 font-sans text-xs text-emerald-700 font-medium">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>Disponibles para despacho</span>
              </div>
            </div>
          </div>

          {/* Low Stock Warning */}
          <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:shadow-[0_4px_20px_rgba(10,31,68,0.06)] transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider font-semibold">
                Stock Bajo (&lt; {summary?.lowStockThreshold ?? 5} uds)
              </span>
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <span className="material-symbols-outlined text-lg">warning</span>
              </div>
            </div>
            <div>
              <div className="font-heading text-3xl font-extrabold text-[var(--primary)] mb-1">
                {summaryLoading ? '...' : summary?.lowStock ?? 0}
              </div>
              <div className="font-sans text-xs text-amber-700">Requiere pedido a proveedor</div>
            </div>
          </div>

          {/* Sedes / Locations */}
          <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:shadow-[0_4px_20px_rgba(10,31,68,0.06)] transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider font-semibold">
                Sedes Físicas Activas
              </span>
              <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                <span className="material-symbols-outlined text-lg">store</span>
              </div>
            </div>
            <div>
              <div className="font-heading text-3xl font-extrabold text-[var(--primary)] mb-1">
                {summaryLoading ? '...' : summary?.locations ?? locations.length}
              </div>
              <div className="font-sans text-xs text-[var(--secondary)]">Bodegas operativas</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-6 border-b border-[var(--outline-variant)] mb-6">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 font-heading text-sm font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                : 'text-[var(--secondary)] hover:text-[var(--primary)]'
            }`}
          >
            <span className="material-symbols-outlined text-base">inventory_2</span>
            <span>Inventario de Piezas ({inventoryTotal})</span>
          </button>

          <button
            onClick={() => setActiveTab('locations')}
            className={`pb-3 font-heading text-sm font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'locations'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                : 'text-[var(--secondary)] hover:text-[var(--primary)]'
            }`}
          >
            <span className="material-symbols-outlined text-base">warehouse</span>
            <span>Sedes & Almacenes ({locations.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('inquiries');
              if (token) loadLeadsData(token, leadsFilterStatus);
            }}
            className={`pb-3 font-heading text-sm font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'inquiries'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                : 'text-[var(--secondary)] hover:text-[var(--primary)]'
            }`}
          >
            <span className="material-symbols-outlined text-base">chat</span>
            <span>Leads por WhatsApp ({leadStats?.totalLeads ?? leadsList.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('reservations');
              if (token) loadReservationsData(token, reservationFilterStatus);
            }}
            className={`pb-3 font-heading text-sm font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'reservations'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                : 'text-[var(--secondary)] hover:text-[var(--primary)]'
            }`}
          >
            <span className="material-symbols-outlined text-base">qr_code_scanner</span>
            <span>Reservas Click & Collect</span>
            {reservationStats && (reservationStats.pendingCount ?? reservationStats.pending ?? 0) > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white animate-pulse">
                {reservationStats.pendingCount ?? reservationStats.pending}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: INVENTORY TABLE */}
        {activeTab === 'inventory' && (
          <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl overflow-hidden shadow-sm">
            {/* Filter Toolbar */}
            <div className="p-4 sm:p-5 border-b border-[var(--outline-variant)] flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-[var(--surface-container-low)]/30">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary)] text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Buscar por OEM, nombre o marca..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)] transition"
                />
              </div>

              {/* Sede Dropdown Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterLocation}
                  onChange={e => {
                    setFilterLocation(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="all">Todas las Sedes ({locations.length})</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.city})
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={e => {
                    setFilterStatus(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="ok">Disponibles (&gt;= 5)</option>
                  <option value="low">Stock Bajo (&lt; 5)</option>
                  <option value="out">Agotados (0)</option>
                </select>

                <button
                  type="button"
                  onClick={() => token && loadInventory(token)}
                  className="p-2 bg-white border border-[var(--outline-variant)] rounded-xl text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-container-low)] transition"
                  title="Refrescar tabla"
                >
                  <span className="material-symbols-outlined text-base">refresh</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs min-w-[700px]">
                <thead>
                  <tr className="bg-[var(--surface-container-low)] border-b border-[var(--outline-variant)] font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider">
                    <th className="p-4">Repuesto / Referencia OEM</th>
                    <th className="p-4">Categoría / Marca</th>
                    <th className="p-4">Sede Física</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Precio COP</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline-variant)]">
                  {inventoryLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[var(--secondary)]">
                        <div className="flex items-center justify-center gap-2 font-mono text-xs">
                          <span className="material-symbols-outlined animate-spin">autorenew</span>
                          <span>Cargando inventario de la tienda...</span>
                        </div>
                      </td>
                    </tr>
                  ) : inventoryList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[var(--secondary)]">
                        <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">inventory_2</span>
                        <p className="font-heading font-bold text-sm text-[var(--on-surface)]">
                          No se encontraron piezas con estos filtros
                        </p>
                        <p className="font-sans text-xs text-[var(--secondary)] mt-1">
                          Prueba cambiando el término de búsqueda o añade un nuevo repuesto.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    inventoryList.map(item => {
                      const isEditing = editingId === item.id;
                      const oemPartNumber =
                        item.part?.partNumbers?.find(pn => pn.type === 'OEM')?.number ||
                        item.part?.partNumbers?.[0]?.number ||
                        'SIN-OEM';

                      return (
                        <tr key={item.id} className="hover:bg-[var(--surface-container-low)]/40 transition-colors">
                          {/* Part Name & OEM */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--surface-container)] flex-shrink-0 border border-[var(--outline-variant)] flex items-center justify-center">
                                {item.part?.imageUrl ? (
                                  <img
                                    src={resolveImageUrl(item.part.imageUrl)}
                                    alt={item.part.name}
                                    className="w-full h-full object-cover"
                                    onError={e => ((e.target as any).src = '/assets/engine.svg')}
                                  />
                                ) : (
                                  <span className="material-symbols-outlined text-[var(--secondary)] text-lg">
                                    image
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-heading font-bold text-[var(--primary)] text-sm">
                                  {item.part?.name}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  <span className="font-mono text-[10px] bg-[var(--surface-container)] text-[var(--primary)] font-bold px-1.5 py-0.5 rounded border border-[var(--outline-variant)]">
                                    OEM: {oemPartNumber}
                                  </span>
                                  <span className="font-mono text-[10px] text-[var(--secondary)]">
                                    {item.condition}
                                  </span>
                                  <span className="font-mono text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                                    {item.part?.images?.length || (item.part?.imageUrl ? 1 : 0)} foto(s)
                                  </span>
                                  {item.part?.compatibility && item.part.compatibility.length > 0 && (
                                    <span className="font-mono text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                                      ✓ Vehículo compatible
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category & Brand */}
                          <td className="p-4">
                            <div className="font-heading font-semibold text-xs text-[var(--on-surface)]">
                              {item.part?.category?.name || 'General'}
                            </div>
                            <div className="font-mono text-[11px] text-[var(--secondary)]">
                              {item.part?.brand || 'Genérico'}
                            </div>
                          </td>

                          {/* Location */}
                          <td className="p-4">
                            <div className="font-medium text-xs text-[var(--primary)]">{item.location?.name}</div>
                            <div className="font-mono text-[10px] text-[var(--secondary)]">{item.location?.city}</div>
                          </td>

                          {/* Stock Column with Inline Editing */}
                          <td className="p-4">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                value={editStock}
                                onChange={e => setEditStock(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-20 px-2 py-1 bg-white border-2 border-[var(--primary)] rounded font-mono text-xs outline-none"
                                autoFocus
                              />
                            ) : (
                              <span
                                className={`font-mono font-bold text-sm ${
                                  item.stock === 0
                                    ? 'text-red-600'
                                    : item.stock < 5
                                    ? 'text-amber-600'
                                    : 'text-[var(--primary)]'
                                }`}
                              >
                                {item.stock} uds
                              </span>
                            )}
                          </td>

                          {/* Price Column with Inline Editing */}
                          <td className="p-4">
                            {isEditing ? (
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-400">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={editPrice}
                                  onChange={e => setEditPrice(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-28 pl-6 pr-2 py-1 bg-white border-2 border-[var(--primary)] rounded font-mono text-xs outline-none"
                                />
                              </div>
                            ) : (
                              <span className="font-mono font-bold text-sm text-[var(--primary)]">
                                {formatPriceCOP(item.price)}
                              </span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="p-4">
                            <span
                              className={`inline-block font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                item.stock === 0
                                  ? 'bg-red-100 text-red-800'
                                  : item.stock < 5
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {item.stock === 0 ? 'Agotado' : item.stock < 5 ? 'Stock Bajo' : 'Disponible'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  disabled={savingEdit}
                                  onClick={() => handleSaveEdit(item)}
                                  className="px-2.5 py-1 bg-[#10b981] text-white font-mono text-xs font-bold rounded-lg hover:bg-[#059669] transition flex items-center gap-1 shadow-sm"
                                  title="Guardar cambios"
                                >
                                  {savingEdit ? '...' : '✓'}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="px-2.5 py-1 bg-gray-200 text-gray-700 font-mono text-xs font-bold rounded-lg hover:bg-gray-300 transition"
                                  title="Cancelar"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditPartModal(item)}
                                  className="px-2.5 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)] text-[var(--primary)] hover:text-white border border-[var(--primary)]/30 rounded-lg font-heading text-[11px] font-bold transition flex items-center gap-1"
                                  title="Editar ficha técnica, galería de fotos y compatibilidad vehicular"
                                >
                                  <span className="material-symbols-outlined text-sm">edit_note</span>
                                  <span className="hidden xl:inline">Editar Ficha</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEdit(item)}
                                  className="p-1.5 border border-[var(--outline-variant)] text-[var(--primary)] rounded-lg hover:bg-white hover:border-[var(--primary)] transition"
                                  title="Edición rápida de stock o precio"
                                >
                                  <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setItemToDelete(item)}
                                  className="p-1.5 border border-[var(--outline-variant)] text-red-600 rounded-lg hover:bg-red-50 hover:border-red-400 transition"
                                  title="Eliminar registro"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-[var(--outline-variant)] flex items-center justify-between font-mono text-xs text-[var(--secondary)]">
              <div>
                Mostrando {inventoryList.length} de {inventoryTotal} registros
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1 || inventoryLoading}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 border border-[var(--outline-variant)] rounded-lg hover:bg-[var(--surface-container-low)] disabled:opacity-40 transition"
                >
                  ← Anterior
                </button>
                <span>
                  Página {currentPage} de {inventoryPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= inventoryPages || inventoryLoading}
                  onClick={() => setCurrentPage(prev => Math.min(inventoryPages, prev + 1))}
                  className="px-3 py-1.5 border border-[var(--outline-variant)] rounded-lg hover:bg-[var(--surface-container-low)] disabled:opacity-40 transition"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEDES & ALMACENES (PDCIRA-6) */}
        {activeTab === 'locations' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-[var(--primary)]">
                  Sedes Físicas y Puntos de Despacho
                </h3>
                <p className="font-sans text-xs text-[var(--secondary)]">
                  Cada sede cuenta con su propio inventario y botón de contacto por WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewLocationModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white font-heading text-xs font-bold rounded-xl hover:bg-[var(--primary-container)] transition shadow-sm"
              >
                <span className="material-symbols-outlined text-base">add_business</span>
                <span>Nueva Sede</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map(loc => (
                <div
                  key={loc.id}
                  className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="relative h-36 bg-gray-900 overflow-hidden">
                      <img
                        src={
                          loc.imageUrl ||
                          loc.store?.imageUrl ||
                          'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=80'
                        }
                        alt={loc.name}
                        className="w-full h-full object-cover opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-600/90 text-white font-bold">
                            {loc.city}
                          </span>
                          <span className="font-mono text-[10px] bg-black/60 text-white px-2 py-0.5 rounded">
                            {(loc as any)._count?.inventory ?? 0} repuestos
                          </span>
                        </div>
                        {loc.latitude && loc.longitude && (
                          <div className="font-mono text-[10px] text-emerald-300 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">pin_drop</span>
                            <span>
                              GPS: {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-5 pb-3">
                      <h4 className="font-heading text-base font-bold text-[var(--primary)] mb-1">
                        {loc.name}
                      </h4>
                      <p className="font-sans text-xs text-[var(--secondary)]">{loc.address}</p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-[var(--outline-variant)] flex flex-col gap-2 font-mono text-xs text-[var(--on-surface-variant)]">
                    {loc.phone && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-[var(--secondary)]">call</span>
                        <span>{loc.phone}</span>
                      </div>
                    )}
                    {loc.whatsapp && (
                      <div className="flex items-center gap-2 text-emerald-700 font-bold">
                        <span className="material-symbols-outlined text-sm">chat</span>
                        <span>WhatsApp: {loc.whatsapp}</span>
                      </div>
                    )}
                    <div className="pt-2 mt-1 border-t border-[var(--outline-variant)]/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openEditLocationModal(loc)}
                        className="w-full py-2 px-3 bg-[var(--surface-container-low)] hover:bg-[var(--primary)] text-[var(--primary)] hover:text-white border border-[var(--outline-variant)] rounded-xl font-heading text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">edit_location_alt</span>
                        <span>Editar Sede / Foto y Pin GPS</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: INQUIRIES & REAL LEADS (SPRINT 4) */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            {/* Bento KPIs: Conversión y Métricas de Leads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-5 hover:shadow-md transition">
                <span className="font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider font-semibold">
                  Total Leads Recibidos
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-heading text-2xl font-black text-[var(--primary)]">
                    {leadStats?.totalLeads ?? leadsList.length}
                  </span>
                  <span className="font-sans text-[11px] text-emerald-600 font-bold flex items-center">
                    <span className="material-symbols-outlined text-xs">trending_up</span>
                    +{leadStats?.leads7d ?? 0} esta semana
                  </span>
                </div>
                <p className="font-sans text-[11px] text-[var(--secondary)] mt-1">
                  Clientes que pulsaron cotizar por WhatsApp
                </p>
              </div>

              <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-5 hover:shadow-md transition">
                <span className="font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider font-semibold">
                  Tasa de Conversión
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-heading text-2xl font-black text-emerald-600">
                    {leadStats?.conversionRate ?? 0}%
                  </span>
                  <span className="font-sans text-[11px] text-[var(--secondary)]">
                    ({leadStats?.byStatus.CONVERTED ?? 0} cerrados)
                  </span>
                </div>
                <p className="font-sans text-[11px] text-[var(--secondary)] mt-1">
                  Ventas concretadas sobre consultas
                </p>
              </div>

              <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-5 hover:shadow-md transition">
                <span className="font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider font-semibold">
                  Estado de Prospectos
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    Nuevos: {leadStats?.byStatus.NEW ?? 0}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    En contacto: {leadStats?.byStatus.CONTACTED ?? 0}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Cerrados: {leadStats?.byStatus.CONVERTED ?? 0}
                  </span>
                </div>
                <p className="font-sans text-[11px] text-[var(--secondary)] mt-1">
                  Distribución del embudo comercial
                </p>
              </div>

              <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-5 hover:shadow-md transition">
                <span className="font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider font-semibold">
                  Repuesto Más Cotizado
                </span>
                <div className="mt-2">
                  <span className="font-heading text-xs font-bold text-[var(--primary)] line-clamp-1">
                    {leadStats?.topParts?.[0]?.name || 'Pastillas de freno'}
                  </span>
                  <span className="font-sans text-[11px] text-emerald-600 font-bold">
                    {leadStats?.topParts?.[0]?.count || 0} consultas registradas
                  </span>
                </div>
                <p className="font-sans text-[11px] text-[var(--secondary)] mt-1">
                  Pieza con mayor interés del comprador
                </p>
              </div>
            </div>

            {/* Leads Table Container */}
            <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-[var(--outline-variant)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading text-base font-bold text-[var(--primary)] flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600">forum</span>
                    <span>Trazabilidad de Prospectos y Clientes WhatsApp (PDCIRA-15)</span>
                  </h3>
                  <p className="font-sans text-xs text-[var(--secondary)]">
                    Cada clic en "Cotizar por WhatsApp" queda registrado con los datos del repuesto y el contacto.
                  </p>
                </div>

                {/* Filter by Status */}
                <div className="flex items-center gap-2">
                  <span className="font-sans text-xs text-[var(--secondary)]">Filtrar:</span>
                  <select
                    value={leadsFilterStatus}
                    onChange={e => {
                      setLeadsFilterStatus(e.target.value);
                      if (token) loadLeadsData(token, e.target.value);
                    }}
                    className="px-3 py-1.5 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="NEW">Nuevos</option>
                    <option value="CONTACTED">En contacto</option>
                    <option value="CONVERTED">Ventas Cerradas</option>
                    <option value="CANCELLED">Cancelados</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => token && loadLeadsData(token, leadsFilterStatus)}
                    className="p-1.5 bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)] text-[var(--secondary)] rounded-xl transition"
                    title="Actualizar listado"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                  </button>
                </div>
              </div>

              {leadsLoading ? (
                <div className="py-16 text-center text-[var(--secondary)] font-sans text-xs flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-2xl text-[var(--primary)]">sync</span>
                  <span>Cargando consultas de WhatsApp en tiempo real...</span>
                </div>
              ) : leadsList.length === 0 ? (
                <div className="py-16 text-center text-[var(--secondary)] font-sans text-xs">
                  <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">chat_error</span>
                  <p className="font-bold">No hay consultas registradas para este filtro</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Cuando los compradores pulsen "Cotizar por WhatsApp" en el marketplace aparecerán aquí de inmediato.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs min-w-[750px]">
                    <thead>
                      <tr className="bg-[var(--surface-container-low)] border-b border-[var(--outline-variant)] font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider">
                        <th className="p-4">Repuesto Solicitado</th>
                        <th className="p-4">Comprador / Taller</th>
                        <th className="p-4">Sede / Ubicación</th>
                        <th className="p-4">Mensaje / Consulta</th>
                        <th className="p-4">Estado Comercial</th>
                        <th className="p-4 text-right">Acción WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--outline-variant)]">
                      {leadsList.map(lead => {
                        const cleanPhone = (lead.buyerPhone || lead.location?.whatsapp || lead.location?.phone || '573002001001').replace(/[^0-9]/g, '');
                        const responseMsg = `Hola ${lead.buyerName || 'amigo'}, te escribo de Repuestos El Motor respecto a tu consulta en AutoPart Pro sobre: "${lead.part?.name}". Con gusto te confirmamos disponibilidad y entrega inmediata.`;

                        return (
                          <tr key={lead.id} className="hover:bg-[var(--surface-container-low)]/50 transition-colors">
                            {/* Part Info */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {lead.part?.imageUrl ? (
                                  <img
                                    src={resolveImageUrl(lead.part.imageUrl)}
                                    alt={lead.part.name}
                                    className="w-10 h-10 object-cover rounded-lg border border-[var(--outline-variant)]"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-[var(--surface-container)] flex items-center justify-center text-[var(--secondary)]">
                                    <span className="material-symbols-outlined text-lg">directions_car</span>
                                  </div>
                                )}
                                <div>
                                  <p className="font-heading font-bold text-[var(--primary)] line-clamp-1">{lead.part?.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="font-sans text-[10px] text-[var(--secondary)]">{lead.part?.brand || 'Genérico'}</span>
                                    {lead.part?.partNumbers?.[0]?.number && (
                                      <span className="font-mono text-[9px] bg-gray-100 text-gray-700 px-1 rounded">
                                        OEM: {lead.part.partNumbers[0].number}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Buyer */}
                            <td className="p-4">
                              <p className="font-bold text-[var(--primary)]">{lead.buyerName || 'Comprador Anónimo'}</p>
                              <p className="font-mono text-[11px] text-[var(--secondary)]">{lead.buyerPhone || 'Sin teléfono'}</p>
                            </td>

                            {/* Sede & City */}
                            <td className="p-4">
                              <p className="font-medium">{lead.location?.name || 'Sede Principal'}</p>
                              <p className="font-mono text-[11px] text-[var(--secondary)]">{lead.buyerCity || lead.location?.city || 'Pasto'}</p>
                            </td>

                            {/* Message & Date */}
                            <td className="p-4 max-w-[220px]">
                              <p className="line-clamp-2 text-gray-700 italic">
                                "{lead.buyerMessage || '¿Tienen disponibilidad para hoy?'}"
                              </p>
                              <span className="font-mono text-[10px] text-[var(--secondary)] block mt-1">
                                {new Date(lead.createdAt).toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>

                            {/* Status Selector */}
                            <td className="p-4">
                              <select
                                value={lead.status}
                                disabled={leadUpdatingId === lead.id}
                                onChange={e => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition focus:outline-none ${
                                  lead.status === 'NEW'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : lead.status === 'CONTACTED'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : lead.status === 'CONVERTED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-gray-100 text-gray-600 border-gray-200'
                                }`}
                              >
                                <option value="NEW">Nuevo</option>
                                <option value="CONTACTED">Contactado</option>
                                <option value="CONVERTED">Venta Cerrada</option>
                                <option value="CANCELLED">Cancelado</option>
                              </select>
                            </td>

                            {/* WhatsApp Button */}
                            <td className="p-4 text-right">
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(responseMsg)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 transition shadow-sm"
                              >
                                <span className="material-symbols-outlined text-sm">chat</span>
                                <span>Chatear</span>
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* PDCIRA-16: Demanda Insatisfecha / Oportunidades Comerciales */}
            <div className="bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 border border-amber-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl border border-amber-200">
                    <span className="material-symbols-outlined text-xl">local_fire_department</span>
                  </div>
                  <div>
                    <h4 className="font-heading text-sm sm:text-base font-bold text-[var(--primary)]">
                      Oportunidades de Mercado — Demanda Insatisfecha en tu Zona (PDCIRA-16)
                    </h4>
                    <p className="font-sans text-xs text-[var(--secondary)]">
                      Piezas buscadas por talleres mecánicos en tu ciudad que arrojaron 0 resultados. Abastécete para capturar estas ventas.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-200/60 text-amber-900 rounded-full font-mono text-[10px] font-bold">
                  {unmetDemand.length} Oportunidades
                </span>
              </div>

              {unmetDemand.length === 0 ? (
                <p className="font-sans text-xs text-[var(--secondary)] italic">
                  No hay búsquedas con 0 resultados registradas recientemente en tu zona.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {unmetDemand.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-amber-200 rounded-xl p-3.5 flex flex-col justify-between hover:shadow-md transition"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <span className="font-heading text-xs font-bold text-[var(--primary)] capitalize">
                            {item.query}
                          </span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-700 whitespace-nowrap">
                            {item.searchCount} búsquedas
                          </span>
                        </div>
                        <p className="font-sans text-[11px] text-[var(--secondary)]">
                          {item.recommendation}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setNewPartForm(prev => ({
                            ...prev,
                            name: item.query.charAt(0).toUpperCase() + item.query.slice(1),
                          }));
                          setIsNewPartModalOpen(true);
                        }}
                        className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-heading text-[11px] font-bold transition shadow-sm"
                      >
                        <span className="material-symbols-outlined text-xs">add_shopping_cart</span>
                        <span>Dar de Alta esta Pieza</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CLICK & COLLECT RESERVATIONS (PDCIRA-17)                           */}
        {/* ========================================================================= */}
        {activeTab === 'reservations' && (
          <div className="space-y-6">
            {/* Header / Description Banner */}
            <div className="bg-gradient-to-r from-emerald-950 via-[#0a231c] to-[var(--primary)] border border-emerald-800/40 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30 mb-2">
                    <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                    CLICK &amp; COLLECT — SISTEMA DE VOUCHERS Y ENTREGAS EN SEDE
                  </div>
                  <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-white mb-1">
                    Control de Retiro en Tienda y Validación QR
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                    Gestiona los pedidos reservados en línea con retiro físico. Al marcar{' '}
                    <strong className="text-emerald-300">«Entregar en Mostrador»</strong>, el stock físico se descuenta
                    automáticamente en el inventario de la sede y el voucher queda liquidado.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (token) loadReservationsData(token, reservationFilterStatus);
                    }}
                    disabled={reservationsLoading}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-heading text-xs font-bold transition shadow-md disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-base ${reservationsLoading ? 'animate-spin' : ''}`}>
                      refresh
                    </span>
                    <span>Actualizar Mostrador</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bento Grid: 4 Reservation KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Active Pending Reservations */}
              <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-5 flex flex-col justify-between hover:shadow-sm transition">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider font-semibold">
                    Reservas Activas
                  </span>
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <span className="material-symbols-outlined text-lg">shopping_bag_speed</span>
                  </div>
                </div>
                <div>
                  <div className="font-heading text-3xl font-extrabold text-[var(--primary)] mb-0.5">
                    {reservationsLoading ? '...' : reservationStats?.pendingCount ?? 0}
                  </div>
                  <div className="font-sans text-xs text-amber-700 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Pendientes de retiro en mostrador</span>
                  </div>
                </div>
              </div>

              {/* Expiring Soon (< 12 hours) */}
              <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-5 flex flex-col justify-between hover:shadow-sm transition">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider font-semibold">
                    Próximas a Vencer
                  </span>
                  <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
                    <span className="material-symbols-outlined text-lg">hourglass_top</span>
                  </div>
                </div>
                <div>
                  <div className="font-heading text-3xl font-extrabold text-rose-600 mb-0.5">
                    {reservationsLoading ? '...' : reservationStats?.expiringSoonCount ?? 0}
                  </div>
                  <div className="font-sans text-xs text-rose-700">
                    Menos de 12 horas de validez (48h total)
                  </div>
                </div>
              </div>

              {/* Delivered / Completed */}
              <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-5 flex flex-col justify-between hover:shadow-sm transition">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider font-semibold">
                    Entregadas en Tienda
                  </span>
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <span className="material-symbols-outlined text-lg">verified</span>
                  </div>
                </div>
                <div>
                  <div className="font-heading text-3xl font-extrabold text-emerald-700 mb-0.5">
                    {reservationsLoading ? '...' : reservationStats?.completedCount ?? 0}
                  </div>
                  <div className="font-sans text-xs text-emerald-700 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    <span>Repuestos entregados y cobrados</span>
                  </div>
                </div>
              </div>

              {/* Pending Value in COP */}
              <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-5 flex flex-col justify-between hover:shadow-sm transition">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider font-semibold">
                    Valor en Mostrador
                  </span>
                  <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                    <span className="material-symbols-outlined text-lg">payments</span>
                  </div>
                </div>
                <div>
                  <div className="font-heading text-2xl font-extrabold text-[var(--primary)] mb-0.5">
                    {reservationsLoading ? '...' : formatPriceCOP(reservationStats?.pendingValueCOP ?? 0)}
                  </div>
                  <div className="font-sans text-xs text-[var(--secondary)]">
                    Total en reservas pendientes de cobro
                  </div>
                </div>
              </div>
            </div>

            {/* Main Reservation Management Card */}
            <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl overflow-hidden shadow-sm">
              {/* Filters & Search Toolbar */}
              <div className="p-4 sm:p-5 border-b border-[var(--outline-variant)] flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-[var(--surface-container-low)]/30">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary)] text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={reservationSearch}
                    onChange={e => {
                      setReservationSearch(e.target.value);
                      if (token) loadReservationsData(token, reservationFilterStatus, e.target.value);
                    }}
                    placeholder="Buscar por código (ej. RES-4821), cliente o repuesto..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)] transition"
                  />
                  {reservationSearch && (
                    <button
                      onClick={() => {
                        setReservationSearch('');
                        if (token) loadReservationsData(token, reservationFilterStatus, '');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setReservationFilterStatus('all');
                      if (token) loadReservationsData(token, 'all');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-heading text-xs font-bold transition ${
                      reservationFilterStatus === 'all'
                        ? 'bg-[var(--primary)] text-white shadow-sm'
                        : 'bg-white border border-[var(--outline-variant)] text-[var(--secondary)] hover:bg-gray-50'
                    }`}
                  >
                    Todas ({reservationStats?.totalReservations ?? reservationsList.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReservationFilterStatus('PENDING');
                      if (token) loadReservationsData(token, 'PENDING');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-heading text-xs font-bold transition flex items-center gap-1.5 ${
                      reservationFilterStatus === 'PENDING'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white border border-[var(--outline-variant)] text-amber-800 hover:bg-amber-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Pendientes ({reservationStats?.pendingCount ?? 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReservationFilterStatus('COMPLETED');
                      if (token) loadReservationsData(token, 'COMPLETED');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-heading text-xs font-bold transition flex items-center gap-1.5 ${
                      reservationFilterStatus === 'COMPLETED'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border border-[var(--outline-variant)] text-emerald-800 hover:bg-emerald-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Entregadas ({reservationStats?.completedCount ?? 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReservationFilterStatus('CANCELLED');
                      if (token) loadReservationsData(token, 'CANCELLED');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-heading text-xs font-bold transition ${
                      reservationFilterStatus === 'CANCELLED'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'bg-white border border-[var(--outline-variant)] text-[var(--secondary)] hover:bg-gray-50'
                    }`}
                  >
                    Canceladas ({reservationStats?.cancelledCount ?? 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReservationFilterStatus('EXPIRED');
                      if (token) loadReservationsData(token, 'EXPIRED');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-heading text-xs font-bold transition ${
                      reservationFilterStatus === 'EXPIRED'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-white border border-[var(--outline-variant)] text-rose-800 hover:bg-rose-50'
                    }`}
                  >
                    Vencidas ({reservationStats?.expiredCount ?? 0})
                  </button>
                </div>
              </div>

              {/* Reservations Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--outline-variant)] bg-[var(--surface-container-low)]/50 text-[10px] font-mono uppercase tracking-wider text-[var(--secondary)]">
                      <th className="py-3 px-4 font-semibold">Código / Voucher</th>
                      <th className="py-3 px-4 font-semibold">Cliente &amp; Contacto</th>
                      <th className="py-3 px-4 font-semibold">Repuesto &amp; Cantidad</th>
                      <th className="py-3 px-4 font-semibold">Sede de Retiro</th>
                      <th className="py-3 px-4 font-semibold text-right">Total a Cobrar</th>
                      <th className="py-3 px-4 font-semibold text-center">Estado / Vencimiento</th>
                      <th className="py-3 px-4 font-semibold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--outline-variant)] text-xs font-sans">
                    {reservationsLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[var(--secondary)]">
                          <div className="inline-flex items-center gap-2 font-heading font-medium">
                            <span className="material-symbols-outlined animate-spin text-xl text-[var(--primary)]">
                              progress_activity
                            </span>
                            <span>Cargando reservas de mostrador...</span>
                          </div>
                        </td>
                      </tr>
                    ) : reservationsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          <div className="max-w-md mx-auto flex flex-col items-center">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mb-3">
                              <span className="material-symbols-outlined text-3xl">shopping_bag_speed</span>
                            </div>
                            <h4 className="font-heading text-sm font-bold text-[var(--primary)] mb-1">
                              No se encontraron reservas
                            </h4>
                            <p className="font-sans text-xs text-[var(--secondary)] mb-4">
                              {reservationSearch || reservationFilterStatus !== 'all'
                                ? 'No hay reservas que coincidan con los filtros actuales.'
                                : 'Cuando los compradores hagan una reserva en la ficha de un repuesto, aparecerá aquí lista para entrega en mostrador.'}
                            </p>
                            {(reservationSearch || reservationFilterStatus !== 'all') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReservationSearch('');
                                  setReservationFilterStatus('all');
                                  if (token) loadReservationsData(token, 'all', '');
                                }}
                                className="px-4 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-heading text-xs font-bold text-[var(--primary)] hover:bg-gray-50 transition"
                              >
                                Restablecer Filtros
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      reservationsList.map(res => {
                        const isPendingState = res.status === ReservationStatus.PENDING;
                        const isCompletedState = res.status === ReservationStatus.COMPLETED;
                        const isCancelledState = res.status === ReservationStatus.CANCELLED;
                        const isExpiredState = res.status === ReservationStatus.EXPIRED;

                        const expiresDate = new Date(res.expiresAt);
                        const isUrgent = isPendingState && (expiresDate.getTime() - Date.now()) < 12 * 3600 * 1000;

                        const customerWhatsAppMsg = `¡Hola ${res.customerName}! Te escribimos de ${res.store?.name || 'AutoPart Pro'} respecto a tu reserva ${res.code} para retirar: ${res.part.name} en nuestra sede ${res.location.name}. ¡Tu repuesto está listo para entrega!`;
                        const customerWhatsAppUrl = buildWhatsAppLink(res.customerPhone, customerWhatsAppMsg);

                        const oemNum = res.part.oemNumber || res.part.partNumbers?.find(p => p.type === 'OEM')?.number;

                        return (
                          <tr
                            key={res.id}
                            className={`hover:bg-[var(--surface-container-low)]/40 transition group ${
                              isUrgent ? 'bg-amber-50/40' : ''
                            }`}
                          >
                            {/* Code / Voucher */}
                            <td className="py-4 px-4 align-top">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white tracking-wider flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">qr_code</span>
                                  {res.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(res.code);
                                    showToast(`Código ${res.code} copiado al portapapeles`, 'info');
                                  }}
                                  title="Copiar código alfanumérico"
                                  className="text-gray-400 hover:text-slate-800 p-0.5"
                                >
                                  <span className="material-symbols-outlined text-sm">content_copy</span>
                                </button>
                              </div>
                              <div className="font-sans text-[10px] text-[var(--secondary)]">
                                Creado:{' '}
                                {new Date(res.createdAt).toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>

                            {/* Customer info */}
                            <td className="py-4 px-4 align-top">
                              <div className="font-heading font-bold text-xs text-[var(--primary)]">
                                {res.customerName}
                              </div>
                              {res.customerDocument && (
                                <div className="font-mono text-[10px] text-[var(--secondary)]">
                                  Doc: {res.customerDocument}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-xs text-[var(--secondary)]">{res.customerPhone}</span>
                                <a
                                  href={customerWhatsAppUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#25D366]/15 hover:bg-[#25D366]/30 text-emerald-800 rounded font-heading text-[10px] font-bold transition"
                                  title="Contactar al cliente por WhatsApp"
                                >
                                  <span>WA</span>
                                  <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                </a>
                              </div>
                              {res.customerEmail && (
                                <div className="font-sans text-[10px] text-gray-500 truncate max-w-[160px]">
                                  {res.customerEmail}
                                </div>
                              )}
                            </td>

                            {/* Part & Quantity */}
                            <td className="py-4 px-4 align-top">
                              <Link
                                href={`/parts/${res.part.id}`}
                                className="font-heading font-bold text-xs text-[var(--primary)] hover:underline block max-w-[220px] line-clamp-1"
                              >
                                {res.part.name}
                              </Link>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {oemNum && (
                                  <span className="font-mono text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded font-bold">
                                    OEM: {oemNum}
                                  </span>
                                )}
                                <span className="font-mono text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                                  x {res.quantity} {res.quantity === 1 ? 'unidad' : 'unidades'}
                                </span>
                              </div>
                              {res.notes && (
                                <div className="font-sans text-[10px] text-gray-500 italic mt-1 line-clamp-1">
                                  Nota: &quot;{res.notes}&quot;
                                </div>
                              )}
                            </td>

                            {/* Sede / Location */}
                            <td className="py-4 px-4 align-top">
                              <div className="font-heading font-bold text-xs text-[var(--primary)]">
                                {res.location.name}
                              </div>
                              <div className="font-sans text-[10px] text-[var(--secondary)]">
                                {res.location.city} — {res.location.address}
                              </div>
                            </td>

                            {/* Pricing */}
                            <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                              <div className="font-heading font-extrabold text-sm text-[var(--primary)]">
                                {formatPriceCOP(res.totalPrice)}
                              </div>
                              {res.quantity > 1 && (
                                <div className="font-sans text-[10px] text-[var(--secondary)]">
                                  {formatPriceCOP(res.unitPrice)} c/u
                                </div>
                              )}
                            </td>

                            {/* Status & Expiry */}
                            <td className="py-4 px-4 align-top text-center">
                              {isPendingState && (
                                <div className="inline-flex flex-col items-center">
                                  <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                                    <span>Pendiente de Retiro</span>
                                  </span>
                                  <span
                                    className={`font-mono text-[10px] mt-1 ${
                                      isUrgent ? 'text-rose-600 font-bold' : 'text-[var(--secondary)]'
                                    }`}
                                  >
                                    Vence:{' '}
                                    {expiresDate.toLocaleDateString('es-CO', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              )}

                              {isCompletedState && (
                                <div className="inline-flex flex-col items-center">
                                  <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs text-emerald-700">
                                      check_circle
                                    </span>
                                    <span>Entregado en Sede</span>
                                  </span>
                                  {res.deliveredAt && (
                                    <span className="font-mono text-[10px] text-emerald-700 mt-1">
                                      {new Date(res.deliveredAt).toLocaleDateString('es-CO', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  )}
                                </div>
                              )}

                              {isCancelledState && (
                                <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                  Cancelada
                                </span>
                              )}

                              {isExpiredState && (
                                <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  Vencida (+48h)
                                </span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-4 px-4 align-top text-center whitespace-nowrap">
                              <div className="flex flex-col gap-1.5 items-center justify-center">
                                {isPendingState && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeliverReservation(res)}
                                    disabled={updatingReservationId === res.id}
                                    className="w-full px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-heading text-[11px] font-bold transition shadow-sm flex items-center justify-center gap-1 disabled:opacity-50"
                                    title="Confirmar entrega al cliente y descontar del inventario físico"
                                  >
                                    {updatingReservationId === res.id ? (
                                      <span className="material-symbols-outlined text-xs animate-spin">
                                        progress_activity
                                      </span>
                                    ) : (
                                      <span className="material-symbols-outlined text-xs">done_all</span>
                                    )}
                                    <span>Entregar en Mostrador</span>
                                  </button>
                                )}

                                <div className="flex items-center gap-1 w-full justify-center">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedVoucherReservation(res)}
                                    className="flex-1 px-2.5 py-1 bg-white border border-[var(--outline-variant)] text-[var(--primary)] hover:bg-gray-50 rounded-lg font-heading text-[10px] font-bold transition flex items-center justify-center gap-1"
                                    title="Ver código QR y comprobante para imprimir"
                                  >
                                    <span className="material-symbols-outlined text-xs">qr_code_2</span>
                                    <span>Voucher</span>
                                  </button>

                                  {isPendingState && (
                                    <button
                                      type="button"
                                      onClick={() => handleCancelReservation(res)}
                                      disabled={updatingReservationId === res.id}
                                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg font-heading text-[10px] font-bold transition"
                                      title="Cancelar reserva"
                                    >
                                      Cancelar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: CSV BULK UPLOAD (PDCIRA-12)                                     */}
      {/* ========================================================================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-[var(--outline-variant)] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-[var(--outline-variant)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-[var(--primary)] rounded-xl border border-blue-200">
                  <span className="material-symbols-outlined text-2xl">upload_file</span>
                </div>
                <div>
                  <h3 className="font-heading text-lg sm:text-xl font-extrabold text-[var(--primary)]">
                    Carga Masiva de Inventario (CSV)
                  </h3>
                  <p className="font-sans text-xs text-[var(--secondary)]">
                    Importa cientos de referencias validando códigos OEM, categorías y sedes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkUploadSubmit} className="space-y-6">
              {/* File Drop Zone */}
              <div>
                <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-2">
                  Selecciona el archivo CSV (RFC 4180 / Delimitador , o ;)
                </label>
                <div className="border-2 border-dashed border-[var(--outline-variant)] rounded-2xl p-6 text-center hover:border-[var(--primary)] transition cursor-pointer relative bg-[var(--surface-container-low)]/40">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setCsvFile(e.target.files[0]);
                        setBulkReport(null);
                        setBulkError(null);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span className="material-symbols-outlined text-4xl text-[var(--secondary)] mb-2">
                    cloud_upload
                  </span>
                  {csvFile ? (
                    <div>
                      <p className="font-heading font-bold text-sm text-[var(--primary)]">{csvFile.name}</p>
                      <p className="font-mono text-xs text-[var(--secondary)]">
                        {(csvFile.size / 1024).toFixed(1)} KB — Listo para procesar
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-heading font-bold text-sm text-[var(--primary)]">
                        Haz clic o arrastra tu archivo .csv aquí
                      </p>
                      <p className="font-sans text-xs text-[var(--secondary)] mt-1">
                        Compatible con exportaciones de Excel en Español e Inglés
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Simulation Mode Toggle (Dry Run) */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-700 text-xl">fact_check</span>
                  <div>
                    <h5 className="font-heading text-xs font-bold text-blue-900">
                      Modo Simulación (Dry Run)
                    </h5>
                    <p className="font-sans text-[11px] text-blue-800">
                      Valida filas, detecta errores y verifica piezas sin guardar cambios en la base de datos.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={e => setDryRun(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>

              {/* Template Download Link */}
              <div className="flex items-center justify-between text-xs font-mono text-[var(--secondary)]">
                <span>¿No tienes el formato estándar?</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-[var(--primary)] font-bold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Descargar Plantilla Oficial</span>
                </button>
              </div>

              {/* Bulk Error Alert */}
              {bulkError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 font-sans text-xs flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-red-600 mt-0.5">error</span>
                  <div>
                    <strong className="font-heading block">Error al procesar el archivo:</strong>
                    <span>{bulkError}</span>
                  </div>
                </div>
              )}

              {/* Bulk Upload Report View */}
              {bulkReport && (
                <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-xs font-bold text-[var(--primary)]">
                      {bulkReport.dryRun ? '📊 Resultado de la Simulación:' : '🎉 Reporte de Carga Exitosa:'}
                    </span>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                        bulkReport.errors.length > 0 ? 'bg-amber-100 text-amber-900' : 'bg-green-100 text-green-900'
                      }`}
                    >
                      {bulkReport.errors.length > 0
                        ? `${bulkReport.errors.length} incidencias encontradas`
                        : '0 Errores detectados'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs">
                    <div className="bg-white p-2 rounded-lg border border-[var(--outline-variant)]">
                      <div className="text-[10px] text-[var(--secondary)]">Filas</div>
                      <div className="font-bold text-sm">{bulkReport.totalRows}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[var(--outline-variant)]">
                      <div className="text-[10px] text-[var(--secondary)]">Nuevos Repuestos</div>
                      <div className="font-bold text-sm text-blue-700">{bulkReport.partsCreated}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[var(--outline-variant)]">
                      <div className="text-[10px] text-[var(--secondary)]">Stock Creado</div>
                      <div className="font-bold text-sm text-emerald-700">{bulkReport.inventoryCreated}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[var(--outline-variant)]">
                      <div className="text-[10px] text-[var(--secondary)]">Stock Actualizado</div>
                      <div className="font-bold text-sm text-purple-700">
                        {bulkReport.inventoryUpdated}
                      </div>
                    </div>
                  </div>

                  {/* Errors Table if any */}
                  {bulkReport.errors.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border border-red-200 rounded-xl bg-red-50/50 p-2 text-xs">
                      <div className="font-heading font-bold text-[11px] text-red-900 mb-1">
                        Detalle de filas con errores (no se procesaron):
                      </div>
                      <ul className="space-y-1 font-mono text-[11px] text-red-800">
                        {bulkReport.errors.map((err, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="font-bold">Fila {err.row}:</span>
                            <span>{err.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* If Dry Run was successful, provide commit button */}
                  {bulkReport.dryRun && bulkReport.errors.length === 0 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleCommitDryRun}
                        disabled={bulkUploading}
                        className="w-full py-2.5 bg-[#10b981] hover:bg-[#059669] text-white font-heading text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">task_alt</span>
                        <span>Confirmar y Aplicar Carga Real en Base de Datos</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-[var(--outline-variant)]">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 border border-[var(--outline-variant)] rounded-xl font-heading text-xs font-bold hover:bg-gray-100 transition"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={!csvFile || bulkUploading}
                  className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white rounded-xl font-heading text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {bulkUploading && <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>}
                  <span>{dryRun ? 'Ejecutar Simulación' : 'Subir y Procesar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: AÑADIR REPUESTO RÁPIDO CON STOCK INICIAL (PDCIRA-13)             */}
      {/* ========================================================================= */}
      {isNewPartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-[var(--outline-variant)] shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-[var(--outline-variant)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 text-[var(--on-tertiary-container)] rounded-xl border border-orange-200">
                  <span className="material-symbols-outlined text-2xl">add_circle</span>
                </div>
                <div>
                  <h3 className="font-heading text-lg sm:text-xl font-extrabold text-[var(--primary)]">
                    Añadir Nuevo Repuesto al Almacén
                  </h3>
                  <p className="font-sans text-xs text-[var(--secondary)]">
                    Crea la ficha técnica y asigna existencias físicas de forma inmediata (PDCIRA-13).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPartModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleNewPartSubmit} className="space-y-4">
              {newPartError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 font-sans text-xs">
                  {newPartError}
                </div>
              )}

              {/* Part Name */}
              <div>
                <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                  Nombre de la Pieza *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Bomba de Agua para Toyota Corolla 1.8"
                  value={newPartForm.name}
                  onChange={e => setNewPartForm({ ...newPartForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              {/* OEM Number & Brand Dual Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Número OEM Principal <span className="text-[var(--secondary)] font-normal text-[11px]">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 16100-39466 (opcional)"
                    value={newPartForm.oemNumber}
                    onChange={e => setNewPartForm({ ...newPartForm, oemNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)] uppercase"
                  />
                  <span className="font-sans text-[10px] text-[var(--secondary)]">
                    Opcional. Si se indica y ya existe en catálogo, se asociará la pieza.
                  </span>
                </div>

                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Marca del Fabricante
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Aisin / Bosch / Denso"
                    value={newPartForm.brand}
                    onChange={e => setNewPartForm({ ...newPartForm, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Category & Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Categoría del Sistema *
                  </label>
                  <select
                    value={newPartForm.categoryId}
                    onChange={e => setNewPartForm({ ...newPartForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Condición de la Pieza
                  </label>
                  <select
                    value={newPartForm.condition}
                    onChange={e => setNewPartForm({ ...newPartForm, condition: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                  >
                    <option value="NEW">Nuevo (Original / Aftermarket)</option>
                    <option value="REFURBISHED">Remanufacturado</option>
                    <option value="USED">Usado Verificado</option>
                  </select>
                </div>
              </div>

              {/* Sede Dropdown */}
              <div>
                <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                  Sede / Bodega Física de Almacenamiento *
                </label>
                <select
                  value={newPartForm.locationId}
                  onChange={e => setNewPartForm({ ...newPartForm, locationId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} — {loc.address} ({loc.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price & Initial Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Precio de Venta COP *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="Ej: 285000"
                      value={newPartForm.price}
                      onChange={e => setNewPartForm({ ...newPartForm, price: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Stock Inicial (Unidades) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Ej: 8"
                    value={newPartForm.stock}
                    onChange={e => setNewPartForm({ ...newPartForm, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Garantía de Fábrica / Vendedor */}
              <div className="p-4 rounded-2xl bg-[var(--surface-container-low)]/70 border border-[var(--outline-variant)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-heading text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-[var(--primary)]">verified_user</span>
                      <span>Garantía del Repuesto</span>
                    </label>
                    <p className="font-sans text-[11px] text-[var(--secondary)]">
                      Especifica si el repuesto cuenta con garantía técnica o si se vende sin garantía.
                    </p>
                  </div>
                  <div className="inline-flex rounded-xl border border-[var(--outline-variant)] bg-white p-1 text-xs font-heading font-bold shadow-sm">
                    <button
                      type="button"
                      onClick={() => setNewPartForm({ ...newPartForm, hasWarranty: true, warranty: newPartForm.warranty || '12 Meses' })}
                      className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                        newPartForm.hasWarranty
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>✓</span> Con Garantía
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPartForm({ ...newPartForm, hasWarranty: false })}
                      className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                        !newPartForm.hasWarranty
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>✕</span> Sin Garantía
                    </button>
                  </div>
                </div>

                {newPartForm.hasWarranty ? (
                  <div className="space-y-2 pt-1">
                    <label className="block font-heading text-[11px] font-bold text-[var(--primary)]">
                      Términos de la Garantía
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 12 Meses o 20.000 KM, 6 Meses, 1 Año..."
                      value={newPartForm.warranty}
                      onChange={e => setNewPartForm({ ...newPartForm, warranty: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] text-[var(--secondary)] mr-1">Opciones rápidas:</span>
                      {['3 Meses', '6 Meses', '12 Meses', '12 Meses o 20.000 KM', '1 Año'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setNewPartForm({ ...newPartForm, warranty: preset })}
                          className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-mono transition ${
                            newPartForm.warranty === preset
                              ? 'bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-sm'
                              : 'bg-white text-gray-700 border-[var(--outline-variant)] hover:border-gray-400'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <span className="material-symbols-outlined text-base text-amber-600">info</span>
                    <span>
                      En la ficha técnica y catálogo se mostrará visiblemente: <strong>"Sin garantía de fábrica"</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* Vehicle Compatibility Builder (Marca, Modelo, Años, Versión) */}
              <div className="p-4 rounded-2xl bg-[var(--surface-container-low)]/70 border border-[var(--outline-variant)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="font-heading text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[var(--primary)]">directions_car</span>
                    <span>Compatibilidad Vehicular (Marca, Modelo y Años)</span>
                  </label>
                  <span className="font-mono text-[10px] text-[var(--secondary)]">
                    Permite filtrar este repuesto por vehículo en el catálogo
                  </span>
                </div>

                {/* Quick-add popular vehicles in Pasto */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10px] text-[var(--secondary)] mr-1">Populares:</span>
                  {[
                    { make: 'Renault', model: 'Clio', yearFrom: 2008, yearTo: 2017, version: '1.6L 16V' },
                    { make: 'Chevrolet', model: 'Spark GT', yearFrom: 2011, yearTo: 2021, version: '1.2L' },
                    { make: 'Renault', model: 'Logan', yearFrom: 2010, yearTo: 2023, version: '1.6L' },
                    { make: 'Toyota', model: 'Hilux', yearFrom: 2012, yearTo: 2024, version: '2.4L / 2.8L' },
                    { make: 'Mazda', model: 'Mazda 3', yearFrom: 2010, yearTo: 2022, version: '2.0L' },
                    { make: 'Kia', model: 'Picanto', yearFrom: 2012, yearTo: 2023, version: '1.25L' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPartCompatibilities(prev => {
                          const exists = prev.some(
                            c => c.make === preset.make && c.model === preset.model && c.yearFrom === preset.yearFrom
                          );
                          return exists ? prev : [...prev, preset];
                        });
                      }}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-blue-50 border border-[var(--outline-variant)] hover:border-[var(--primary)] font-mono text-[10px] text-[var(--primary)] transition"
                    >
                      + {preset.make} {preset.model} ({preset.yearFrom}-{preset.yearTo})
                    </button>
                  ))}
                </div>

                {/* Custom Vehicle Compatibility Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
                  <div className="col-span-1 sm:col-span-3">
                    <label className="block font-mono text-[10px] text-[var(--secondary)] mb-1 uppercase font-semibold">
                      Marca Auto
                    </label>
                    <select
                      value={compatDraft.make}
                      onChange={e => setCompatDraft({ ...compatDraft, make: e.target.value })}
                      className="w-full px-2.5 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                    >
                      <option value="Renault">Renault</option>
                      <option value="Chevrolet">Chevrolet</option>
                      <option value="Toyota">Toyota</option>
                      <option value="Mazda">Mazda</option>
                      <option value="Kia">Kia</option>
                      <option value="Nissan">Nissan</option>
                      <option value="Hyundai">Hyundai</option>
                      <option value="Ford">Ford</option>
                      <option value="Volkswagen">Volkswagen</option>
                      <option value="Suzuki">Suzuki</option>
                      <option value="__OTHER__">Otra marca...</option>
                    </select>
                  </div>

                  {compatDraft.make === '__OTHER__' && (
                    <div className="col-span-1 sm:col-span-3">
                      <label className="block font-mono text-[10px] text-[var(--secondary)] mb-1 uppercase font-semibold">
                        Escribir Marca
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Subaru"
                        value={compatDraft.customMake}
                        onChange={e => setCompatDraft({ ...compatDraft, customMake: e.target.value })}
                        className="w-full px-2.5 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  )}

                  <div className={compatDraft.make === '__OTHER__' ? 'col-span-2 sm:col-span-3' : 'col-span-1 sm:col-span-3'}>
                    <label className="block font-mono text-[10px] text-[var(--secondary)] mb-1 uppercase font-semibold">
                      Modelo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Clio / Duster / Aveo"
                      value={compatDraft.model}
                      onChange={e => setCompatDraft({ ...compatDraft, model: e.target.value })}
                      className="w-full px-2.5 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="block font-mono text-[10px] text-[var(--secondary)] mb-1 uppercase font-semibold">
                      Año Desde
                    </label>
                    <input
                      type="number"
                      min="1980"
                      max="2027"
                      value={compatDraft.yearFrom}
                      onChange={e => setCompatDraft({ ...compatDraft, yearFrom: e.target.value })}
                      className="w-full px-2 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="block font-mono text-[10px] text-[var(--secondary)] mb-1 uppercase font-semibold">
                      Año Hasta
                    </label>
                    <input
                      type="number"
                      min="1980"
                      max="2027"
                      value={compatDraft.yearTo}
                      onChange={e => setCompatDraft({ ...compatDraft, yearTo: e.target.value })}
                      className="w-full px-2 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddCompatibilityDraft}
                      className="w-full py-2 px-3 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white rounded-xl font-heading text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>

                {/* Selected Vehicle Chips */}
                {partCompatibilities.length > 0 && (
                  <div className="pt-2 border-t border-[var(--outline-variant)] flex flex-wrap gap-2">
                    {partCompatibilities.map((comp, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[var(--primary)] font-heading text-xs font-bold"
                      >
                        <span className="material-symbols-outlined text-xs">directions_car</span>
                        <span>
                          {comp.make} {comp.model} ({comp.yearFrom}
                          {comp.yearTo && comp.yearTo !== comp.yearFrom ? `–${comp.yearTo}` : ''})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setPartCompatibilities(prev => prev.filter((_, i) => i !== idx))
                          }
                          className="ml-1 text-red-500 hover:text-red-700 font-bold"
                          title="Quitar vehículo"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Multi-Image Gallery Section (Up to 5 Photos) */}
              <div className="p-4 rounded-2xl bg-[var(--surface-container-low)]/50 border border-[var(--outline-variant)] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-heading text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[var(--primary)]">collections</span>
                    <span>Galería de Fotos del Repuesto ({partGallery.length}/5 fotos)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseUrlMode(!useUrlMode)}
                    className="font-mono text-[11px] text-[var(--primary)] font-bold hover:underline"
                  >
                    {useUrlMode ? '← Subir archivos desde mi equipo' : '+ Agregar foto por enlace URL →'}
                  </button>
                </div>

                {/* Thumbnail Strip if any images added */}
                {partGallery.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {partGallery.map((img, idx) => (
                      <div
                        key={img.id}
                        className={`relative group rounded-xl overflow-hidden border-2 bg-white aspect-square ${
                          idx === 0 ? 'border-[var(--primary)] shadow-sm' : 'border-[var(--outline-variant)]'
                        }`}
                      >
                        <img
                          src={img.previewUrl}
                          alt={img.name || `Foto ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={e => ((e.target as any).src = '/assets/engine.svg')}
                        />
                        {idx === 0 ? (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[var(--primary)] text-white font-mono text-[9px] font-bold">
                            PORTADA
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setPartGallery(prev => {
                                const copy = [...prev];
                                const [picked] = copy.splice(idx, 1);
                                return [picked, ...copy];
                              })
                            }
                            className="absolute bottom-1.5 left-1.5 right-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[9px] font-bold opacity-0 group-hover:opacity-100 transition"
                          >
                            Hacer Portada
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setPartGallery(prev => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow hover:bg-red-700"
                          title="Eliminar esta foto"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {partGallery.length < 5 && (
                  <>
                    {useUrlMode ? (
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://ejemplo.com/repuestos/foto-angulo-2.jpg"
                          value={partImageUrlInput}
                          onChange={e => setPartImageUrlInput(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const clean = partImageUrlInput.trim();
                            if (!clean) return;
                            setPartGallery(prev =>
                              prev.length >= 5
                                ? prev
                                : [
                                    ...prev,
                                    {
                                      id: `url-${Date.now()}-${Math.random()}`,
                                      previewUrl: clean,
                                      name: 'Imagen por URL',
                                    },
                                  ]
                            );
                            setPartImageUrlInput('');
                          }}
                          className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl font-heading text-xs font-bold hover:bg-[var(--primary-container)] transition"
                        >
                          Añadir Foto
                        </button>
                      </div>
                    ) : (
                      <div className="border border-dashed border-[var(--outline-variant)] hover:border-[var(--primary)] rounded-xl p-4 text-center cursor-pointer relative bg-white transition group">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={e => {
                            if (e.target.files && e.target.files.length > 0) {
                              const filesArray = Array.from(e.target.files);
                              setPartGallery(prev => {
                                const remaining = 5 - prev.length;
                                const nextItems = filesArray.slice(0, remaining).map(file => ({
                                  id: `file-${Date.now()}-${Math.random()}`,
                                  file,
                                  previewUrl: URL.createObjectURL(file),
                                  name: file.name,
                                }));
                                return [...prev, ...nextItems];
                              });
                              e.target.value = '';
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <span className="material-symbols-outlined text-2xl text-[var(--secondary)] group-hover:text-[var(--primary)] mb-1">
                          add_photo_alternate
                        </span>
                        <p className="font-heading font-bold text-xs text-[var(--primary)]">
                          Haz clic para subir una o varias fotos del repuesto (hasta 5 imágenes)
                        </p>
                        <p className="font-mono text-[10px] text-[var(--secondary)] mt-0.5">
                          La primera imagen será la portada principal • JPG, PNG, WEBP
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                  Descripción / Notas de Instalación (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Incluye empaque original y junta de sellado..."
                  value={newPartForm.description}
                  onChange={e => setNewPartForm({ ...newPartForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-[var(--outline-variant)]">
                <button
                  type="button"
                  onClick={() => setIsNewPartModalOpen(false)}
                  className="px-4 py-2 border border-[var(--outline-variant)] rounded-xl font-heading text-xs font-bold hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingPart}
                  className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white rounded-xl font-heading text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {creatingPart && <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>}
                  <span>Guardar y Publicar en Marketplace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REGISTRAR NUEVA SEDE / BODEGA (PDCIRA-6)                        */}
      {/* ========================================================================= */}
      {isNewLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[var(--outline-variant)] shadow-2xl max-w-xl w-full p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-[var(--outline-variant)]">
              <div>
                <h3 className="font-heading text-lg font-extrabold text-[var(--primary)]">
                  Registrar Sede o Bodega Física
                </h3>
                <p className="font-sans text-xs text-[var(--secondary)] mt-0.5">
                  Sube la foto de tu fachada y ubica el pin exacto en el mapa para tus clientes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewLocationModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLocationSubmit} className="space-y-4">
              <div>
                <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                  Nombre de la Sede *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sede Julián Bucheli / Bodega Parque Bolívar"
                  value={newLocForm.name}
                  onChange={e => setNewLocForm({ ...newLocForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <StoreImageUploader
                value={newLocForm.imageUrl}
                onChange={url => setNewLocForm({ ...newLocForm, imageUrl: url })}
                storeName={newLocForm.name}
              />

              <StoreLocationPicker
                value={{
                  address: newLocForm.address,
                  city: newLocForm.city,
                  latitude: newLocForm.latitude,
                  longitude: newLocForm.longitude,
                }}
                onChange={locVal =>
                  setNewLocForm({
                    ...newLocForm,
                    address: locVal.address,
                    city: locVal.city,
                    latitude: locVal.latitude,
                    longitude: locVal.longitude,
                  })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Teléfono Fijo
                  </label>
                  <input
                    type="text"
                    placeholder="+57 601 2345678"
                    value={newLocForm.phone}
                    onChange={e => setNewLocForm({ ...newLocForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    WhatsApp Despachos
                  </label>
                  <input
                    type="text"
                    placeholder="+57 300 1234567"
                    value={newLocForm.whatsapp}
                    onChange={e => setNewLocForm({ ...newLocForm, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[var(--outline-variant)]">
                <button
                  type="button"
                  onClick={() => setIsNewLocationModalOpen(false)}
                  className="px-4 py-2 border border-[var(--outline-variant)] rounded-xl font-heading text-xs font-bold hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingLoc}
                  className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white rounded-xl font-heading text-xs font-bold transition shadow-sm"
                >
                  {creatingLoc ? 'Guardando...' : 'Crear Sede'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EDITAR FICHA TÉCNICA, GALERÍA MULTI-IMAGEN Y VEHÍCULOS           */}
      {/* ========================================================================= */}
      {editingPartItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-[var(--outline-variant)] shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-[var(--outline-variant)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-[var(--primary)] rounded-xl border border-blue-200">
                  <span className="material-symbols-outlined text-2xl">edit_note</span>
                </div>
                <div>
                  <h3 className="font-heading text-lg sm:text-xl font-extrabold text-[var(--primary)]">
                    Editar Ficha Técnica, Galería y Vehículos
                  </h3>
                  <p className="font-sans text-xs text-[var(--secondary)]">
                    Actualiza hasta 5 fotos, compatibilidad vehicular (Marca/Modelo/Años) y existencias en tiempo real.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPartItem(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditPartSubmit} className="space-y-4">
              {editPartError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 font-sans text-xs">
                  {editPartError}
                </div>
              )}

              {/* Part Name */}
              <div>
                <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                  Nombre de la Pieza *
                </label>
                <input
                  type="text"
                  required
                  value={editPartForm.name}
                  onChange={e => setEditPartForm({ ...editPartForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              {/* OEM Number & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Número OEM Principal <span className="text-[var(--secondary)] font-normal text-[11px]">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 7700434177"
                    value={editPartForm.oemNumber}
                    onChange={e => setEditPartForm({ ...editPartForm, oemNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)] uppercase"
                  />
                </div>

                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Marca del Fabricante
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Renault / Gabriel / Bosch"
                    value={editPartForm.brand}
                    onChange={e => setEditPartForm({ ...editPartForm, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Category & Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Categoría del Sistema *
                  </label>
                  <select
                    value={editPartForm.categoryId}
                    onChange={e => setEditPartForm({ ...editPartForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Condición de la Pieza
                  </label>
                  <select
                    value={editPartForm.condition}
                    onChange={e => setEditPartForm({ ...editPartForm, condition: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                  >
                    <option value="NEW">Nuevo (Original / Aftermarket)</option>
                    <option value="REFURBISHED">Remanufacturado</option>
                    <option value="USED">Usado Verificado</option>
                  </select>
                </div>
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Precio de Venta COP *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={editPartForm.price}
                    onChange={e => setEditPartForm({ ...editPartForm, price: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Stock Físico (Unidades) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editPartForm.stock}
                    onChange={e => setEditPartForm({ ...editPartForm, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Sede Física
                  </label>
                  <select
                    value={editPartForm.locationId}
                    onChange={e => setEditPartForm({ ...editPartForm, locationId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Garantía de Fábrica / Vendedor */}
              <div className="p-4 rounded-2xl bg-[var(--surface-container-low)]/70 border border-[var(--outline-variant)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-heading text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-[var(--primary)]">verified_user</span>
                      <span>Garantía del Repuesto</span>
                    </label>
                    <p className="font-sans text-[11px] text-[var(--secondary)]">
                      Especifica si el repuesto cuenta con garantía técnica o si se vende sin garantía.
                    </p>
                  </div>
                  <div className="inline-flex rounded-xl border border-[var(--outline-variant)] bg-white p-1 text-xs font-heading font-bold shadow-sm">
                    <button
                      type="button"
                      onClick={() => setEditPartForm({ ...editPartForm, hasWarranty: true, warranty: editPartForm.warranty || '12 Meses' })}
                      className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                        editPartForm.hasWarranty
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>✓</span> Con Garantía
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPartForm({ ...editPartForm, hasWarranty: false })}
                      className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                        !editPartForm.hasWarranty
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>✕</span> Sin Garantía
                    </button>
                  </div>
                </div>

                {editPartForm.hasWarranty ? (
                  <div className="space-y-2 pt-1">
                    <label className="block font-heading text-[11px] font-bold text-[var(--primary)]">
                      Términos de la Garantía
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 12 Meses o 20.000 KM, 6 Meses, 1 Año..."
                      value={editPartForm.warranty}
                      onChange={e => setEditPartForm({ ...editPartForm, warranty: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] text-[var(--secondary)] mr-1">Opciones rápidas:</span>
                      {['3 Meses', '6 Meses', '12 Meses', '12 Meses o 20.000 KM', '1 Año'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setEditPartForm({ ...editPartForm, warranty: preset })}
                          className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-mono transition ${
                            editPartForm.warranty === preset
                              ? 'bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-sm'
                              : 'bg-white text-gray-700 border-[var(--outline-variant)] hover:border-gray-400'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <span className="material-symbols-outlined text-base text-amber-600">info</span>
                    <span>
                      En la ficha técnica y catálogo se mostrará visiblemente: <strong>"Sin garantía de fábrica"</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* Vehicle Compatibility Builder */}
              <div className="p-4 rounded-2xl bg-[var(--surface-container-low)]/70 border border-[var(--outline-variant)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="font-heading text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[var(--primary)]">directions_car</span>
                    <span>Compatibilidad Vehicular (Marca, Modelo y Años)</span>
                  </label>
                  <span className="font-mono text-[10px] text-[var(--secondary)]">
                    Sincronizado con el filtro de vehículo del buscador
                  </span>
                </div>

                {/* Quick-add popular vehicles */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10px] text-[var(--secondary)] mr-1">Añadir rápido:</span>
                  {[
                    { make: 'Renault', model: 'Clio', yearFrom: 2001, yearTo: 2016, version: '1.6L 16V' },
                    { make: 'Chevrolet', model: 'Spark GT', yearFrom: 2011, yearTo: 2021, version: '1.2L' },
                    { make: 'Renault', model: 'Logan', yearFrom: 2010, yearTo: 2023, version: '1.6L' },
                    { make: 'Toyota', model: 'Hilux', yearFrom: 2012, yearTo: 2024, version: '2.4L / 2.8L' },
                    { make: 'Mazda', model: 'Mazda 3', yearFrom: 2010, yearTo: 2022, version: '2.0L' },
                    { make: 'Kia', model: 'Picanto', yearFrom: 2012, yearTo: 2023, version: '1.25L' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEditPartCompatibilities(prev => {
                          const exists = prev.some(
                            c => c.make === preset.make && c.model === preset.model
                          );
                          return exists ? prev : [...prev, preset];
                        });
                      }}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-blue-50 border border-[var(--outline-variant)] hover:border-[var(--primary)] font-mono text-[10px] text-[var(--primary)] transition"
                    >
                      + {preset.make} {preset.model} ({preset.yearFrom}-{preset.yearTo})
                    </button>
                  ))}
                </div>

                {/* Custom Vehicle Compatibility Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
                  <div className="col-span-1 sm:col-span-3">
                    <label className="block font-mono text-[10px] text-[var(--secondary)] mb-1 uppercase font-semibold">
                      Marca Auto
                    </label>
                    <select
                      value={editCompatDraft.make}
                      onChange={e => setEditCompatDraft({ ...editCompatDraft, make: e.target.value })}
                      className="w-full px-2.5 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                    >
                      <option value="Renault">Renault</option>
                      <option value="Chevrolet">Chevrolet</option>
                      <option value="Toyota">Toyota</option>
                      <option value="Mazda">Mazda</option>
                      <option value="Kia">Kia</option>
                      <option value="Nissan">Nissan</option>
                      <option value="Hyundai">Hyundai</option>
                      <option value="Ford">Ford</option>
                      <option value="Volkswagen">Volkswagen</option>
                      <option value="Suzuki">Suzuki</option>
                      <option value="__OTHER__">Otra marca...</option>
                    </select>
                  </div>

                  {editCompatDraft.make === '__OTHER__' && (
                    <div className="col-span-1 sm:col-span-3">
                      <label className="block font-mono text-[10px] text-[var(--secondary)] mb-1 uppercase font-semibold">
                        Escribir Marca
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Subaru"
                        value={editCompatDraft.customMake}
                        onChange={e => setEditCompatDraft({ ...editCompatDraft, customMake: e.target.value })}
                        className="w-full px-2.5 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  )}

                  <div className={editCompatDraft.make === '__OTHER__' ? 'col-span-2 sm:col-span-3' : 'col-span-1 sm:col-span-3'}>
                    <label className="block font-mono text-[10px] text-[var(--secondary)] mb-1 uppercase font-semibold">
                      Modelo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Clio / Duster"
                      value={editCompatDraft.model}
                      onChange={e => setEditCompatDraft({ ...editCompatDraft, model: e.target.value })}
                      className="w-full px-2.5 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="block font-mono text-[10px] text-[var(--secondary)] mb-1 uppercase font-semibold">
                      Desde
                    </label>
                    <input
                      type="number"
                      min="1980"
                      max="2027"
                      value={editCompatDraft.yearFrom}
                      onChange={e => setEditCompatDraft({ ...editCompatDraft, yearFrom: e.target.value })}
                      className="w-full px-2 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="block font-mono text-[10px] text-[var(--secondary)] mb-1 uppercase font-semibold">
                      Hasta
                    </label>
                    <input
                      type="number"
                      min="1980"
                      max="2027"
                      value={editCompatDraft.yearTo}
                      onChange={e => setEditCompatDraft({ ...editCompatDraft, yearTo: e.target.value })}
                      className="w-full px-2 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddEditCompatibilityDraft}
                      className="w-full py-2 px-3 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white rounded-xl font-heading text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>

                {/* Selected Vehicle Chips */}
                {editPartCompatibilities.length > 0 && (
                  <div className="pt-2 border-t border-[var(--outline-variant)] flex flex-wrap gap-2">
                    {editPartCompatibilities.map((comp, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[var(--primary)] font-heading text-xs font-bold"
                      >
                        <span className="material-symbols-outlined text-xs">directions_car</span>
                        <span>
                          {comp.make} {comp.model} ({comp.yearFrom}
                          {comp.yearTo && comp.yearTo !== comp.yearFrom ? `–${comp.yearTo}` : ''})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditPartCompatibilities(prev => prev.filter((_, i) => i !== idx))
                          }
                          className="ml-1 text-red-500 hover:text-red-700 font-bold"
                          title="Quitar vehículo"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Multi-Image Gallery Section (Up to 5 Photos) */}
              <div className="p-4 rounded-2xl bg-[var(--surface-container-low)]/50 border border-[var(--outline-variant)] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-heading text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[var(--primary)]">collections</span>
                    <span>Galería de Fotos ({editPartGallery.length}/5 fotos)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditUseUrlMode(!editUseUrlMode)}
                    className="font-mono text-[11px] text-[var(--primary)] font-bold hover:underline"
                  >
                    {editUseUrlMode ? '← Subir archivos desde mi equipo' : '+ Agregar foto por enlace URL →'}
                  </button>
                </div>

                {editPartGallery.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {editPartGallery.map((img, idx) => (
                      <div
                        key={img.id}
                        className={`relative group rounded-xl overflow-hidden border-2 bg-white aspect-square ${
                          idx === 0 ? 'border-[var(--primary)] shadow-sm' : 'border-[var(--outline-variant)]'
                        }`}
                      >
                        <img
                          src={img.previewUrl}
                          alt={img.name || `Foto ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={e => ((e.target as any).src = '/assets/engine.svg')}
                        />
                        {idx === 0 ? (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[var(--primary)] text-white font-mono text-[9px] font-bold">
                            PORTADA
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setEditPartGallery(prev => {
                                const copy = [...prev];
                                const [picked] = copy.splice(idx, 1);
                                return [picked, ...copy];
                              })
                            }
                            className="absolute bottom-1.5 left-1.5 right-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[9px] font-bold opacity-0 group-hover:opacity-100 transition"
                          >
                            Hacer Portada
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setEditPartGallery(prev => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow hover:bg-red-700"
                          title="Eliminar esta foto"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {editPartGallery.length < 5 && (
                  <>
                    {editUseUrlMode ? (
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://ejemplo.com/repuestos/foto-angulo-2.jpg"
                          value={editPartImageUrlInput}
                          onChange={e => setEditPartImageUrlInput(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const clean = editPartImageUrlInput.trim();
                            if (!clean) return;
                            setEditPartGallery(prev =>
                              prev.length >= 5
                                ? prev
                                : [
                                    ...prev,
                                    {
                                      id: `url-${Date.now()}-${Math.random()}`,
                                      previewUrl: clean,
                                      name: 'Imagen por URL',
                                    },
                                  ]
                            );
                            setEditPartImageUrlInput('');
                          }}
                          className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl font-heading text-xs font-bold hover:bg-[var(--primary-container)] transition"
                        >
                          Añadir Foto
                        </button>
                      </div>
                    ) : (
                      <div className="border border-dashed border-[var(--outline-variant)] hover:border-[var(--primary)] rounded-xl p-4 text-center cursor-pointer relative bg-white transition group">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={e => {
                            if (e.target.files && e.target.files.length > 0) {
                              const filesArray = Array.from(e.target.files);
                              setEditPartGallery(prev => {
                                const remaining = 5 - prev.length;
                                const nextItems = filesArray.slice(0, remaining).map(file => ({
                                  id: `file-${Date.now()}-${Math.random()}`,
                                  file,
                                  previewUrl: URL.createObjectURL(file),
                                  name: file.name,
                                }));
                                return [...prev, ...nextItems];
                              });
                              e.target.value = '';
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <span className="material-symbols-outlined text-2xl text-[var(--secondary)] group-hover:text-[var(--primary)] mb-1">
                          add_photo_alternate
                        </span>
                        <p className="font-heading font-bold text-xs text-[var(--primary)]">
                          Haz clic para subir más fotos del repuesto (hasta 5 imágenes)
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                  Descripción / Notas Técnicas
                </label>
                <textarea
                  rows={2}
                  value={editPartForm.description}
                  onChange={e => setEditPartForm({ ...editPartForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[var(--outline-variant)]">
                <button
                  type="button"
                  onClick={() => setEditingPartItem(null)}
                  className="px-4 py-2 border border-[var(--outline-variant)] rounded-xl font-heading text-xs font-bold hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPartDetails}
                  className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white rounded-xl font-heading text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {savingPartDetails && <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>}
                  <span>Guardar Cambios y Sincronizar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: EDITAR SEDE Y PERFIL DEL ALMACÉN EN PASTO                        */}
      {/* ========================================================================= */}
      {editingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[var(--outline-variant)] shadow-2xl max-w-2xl w-full p-6 sm:p-8 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-[var(--outline-variant)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <span className="material-symbols-outlined text-2xl">edit_location_alt</span>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-extrabold text-[var(--primary)]">
                    Editar Perfil del Almacén y Ubicación GPS en Pasto
                  </h3>
                  <p className="font-sans text-xs text-[var(--secondary)] mt-0.5">
                    Actualiza el nombre comercial, foto de fachada, WhatsApp y pin GPS de tu sede.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingLocation(null)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditLocationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Nombre Comercial del Almacén *
                  </label>
                  <input
                    type="text"
                    required
                    value={editLocForm.storeName}
                    onChange={e => setEditLocForm({ ...editLocForm, storeName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    NIT / RUT Comercial <span className="text-[var(--secondary)] font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={editLocForm.storeNit}
                    onChange={e => setEditLocForm({ ...editLocForm, storeNit: e.target.value })}
                    placeholder="Ej: 900.412.889-1"
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Nombre de la Sede *
                  </label>
                  <input
                    type="text"
                    required
                    value={editLocForm.name}
                    onChange={e => setEditLocForm({ ...editLocForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    Teléfono de Mostrador
                  </label>
                  <input
                    type="text"
                    value={editLocForm.phone}
                    onChange={e => setEditLocForm({ ...editLocForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                    WhatsApp Despachos
                  </label>
                  <input
                    type="text"
                    value={editLocForm.whatsapp}
                    onChange={e => setEditLocForm({ ...editLocForm, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-mono text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Horario de Atención y Servicio a Domicilio en Pasto */}
              <div className="p-4 bg-gray-50/90 rounded-2xl border border-[var(--outline-variant)] space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-heading text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-amber-600">schedule</span>
                      Horario de Atención de la Sede
                    </label>
                    <span className="font-mono text-[10px] text-[var(--secondary)]">Visible en directorio</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={editLocForm.operatingHours}
                    onChange={e => setEditLocForm({ ...editLocForm, operatingHours: e.target.value })}
                    placeholder="Ej: Lunes a Sábado • 08:00 - 18:30"
                    className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] text-gray-500 self-center mr-1">Rápido:</span>
                    {[
                      'Lunes a Sábado • 08:00 - 18:30',
                      'Lun a Vie 08:00 - 18:00 • Sáb 08:00 - 13:00',
                      'Jornada Continua 07:30 - 19:00',
                    ].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEditLocForm({ ...editLocForm, operatingHours: preset })}
                        className="px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-md text-[10px] font-mono transition"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200/80">
                  <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-blue-600">local_shipping</span>
                    ¿Cuentan con Servicio a Domicilio en Pasto?
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEditLocForm({ ...editLocForm, hasDelivery: true })}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                        editLocForm.hasDelivery
                          ? 'border-blue-500 bg-blue-50/70 text-blue-900 shadow-xs'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-lg ${editLocForm.hasDelivery ? 'text-blue-600' : 'text-gray-400'}`}>
                        check_circle
                      </span>
                      <div>
                        <div className="font-heading text-xs font-bold">Sí, despacho a domicilio</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">Envío express en perímetro urbano de Pasto</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditLocForm({ ...editLocForm, hasDelivery: false })}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                        !editLocForm.hasDelivery
                          ? 'border-amber-500 bg-amber-50/70 text-amber-900 shadow-xs'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-lg ${!editLocForm.hasDelivery ? 'text-amber-600' : 'text-gray-400'}`}>
                        storefront
                      </span>
                      <div>
                        <div className="font-heading text-xs font-bold">No, solo retiro en tienda</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">El cliente recoge en el mostrador físico</div>
                      </div>
                    </button>
                  </div>

                  {editLocForm.hasDelivery && (
                    <div className="mt-3">
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">
                        Detalles o Tiempo de Entrega en Pasto:
                      </label>
                      <input
                        type="text"
                        value={editLocForm.deliveryDetails}
                        onChange={e => setEditLocForm({ ...editLocForm, deliveryDetails: e.target.value })}
                        placeholder="Ej: Despacho express en 30-60 min en Pasto"
                        className="w-full px-3 py-1.5 bg-white border border-[var(--outline-variant)] rounded-lg font-sans text-xs focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  )}
                </div>
              </div>

              <StoreImageUploader
                value={editLocForm.imageUrl}
                onChange={url => setEditLocForm({ ...editLocForm, imageUrl: url })}
                storeName={editLocForm.storeName || editLocForm.name}
              />

              <StoreLocationPicker
                value={{
                  address: editLocForm.address,
                  city: editLocForm.city,
                  latitude: editLocForm.latitude,
                  longitude: editLocForm.longitude,
                }}
                onChange={locVal =>
                  setEditLocForm({
                    ...editLocForm,
                    address: locVal.address,
                    city: locVal.city,
                    latitude: locVal.latitude,
                    longitude: locVal.longitude,
                  })
                }
              />

              <div className="flex gap-3 justify-end pt-4 border-t border-[var(--outline-variant)]">
                <button
                  type="button"
                  onClick={() => setEditingLocation(null)}
                  className="px-4 py-2 border border-[var(--outline-variant)] rounded-xl font-heading text-xs font-bold hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingLocEdit}
                  className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white rounded-xl font-heading text-xs font-bold transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {savingLocEdit && <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>}
                  <span>Guardar Cambios de Sede y Almacén</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION DIALOG                                                */}
      {/* ========================================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-[var(--outline-variant)] shadow-2xl max-w-sm w-full p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-red-500 mb-2">delete_forever</span>
            <h4 className="font-heading text-base font-extrabold text-[var(--primary)] mb-1">
              ¿Eliminar repuesto del inventario?
            </h4>
            <p className="font-sans text-xs text-[var(--secondary)] mb-6">
              Esta acción removerá las existencias de <strong>{itemToDelete.part.name}</strong> en la sede{' '}
              <strong>{itemToDelete.location.name}</strong>.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-[var(--outline-variant)] rounded-xl font-heading text-xs font-bold hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-heading text-xs font-bold transition shadow-sm"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VOUCHER MODAL FOR CLICK & COLLECT INSPECTION                             */}
      {/* ========================================================================= */}
      {selectedVoucherReservation && (
        <ReservationVoucherModal
          reservation={selectedVoucherReservation}
          isOpen={!!selectedVoucherReservation}
          onClose={() => setSelectedVoucherReservation(null)}
        />
      )}
    </div>
  );
}
