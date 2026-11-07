'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { MapPin, ExternalLink, Check, Plus, Edit3, ChevronDown, ChevronUp, User, Mail, Phone, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ClienteDireccion } from '@/lib/shop/direcciones-schema';
import {
  getCiudadesPorRegion,
  getComunasPorRegion,
  isChileRegion,
} from '@enjambre/logistica';

export type ReplenishmentShippingData = {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  region: string;
  codigoPostal: string;
  instrucciones: string;
};

const REGIONS = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble',
  'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
];

const ATAJOS_DESTINOS = [
  { label: 'Castro', comuna: 'Castro', region: 'Los Lagos' },
  { label: 'Ancud', comuna: 'Ancud', region: 'Los Lagos' },
  { label: 'Puerto Varas', comuna: 'Puerto Varas', region: 'Los Lagos' },
  { label: 'Puerto Montt', comuna: 'Puerto Montt', region: 'Los Lagos' },
  { label: 'Providencia (RM)', comuna: 'Providencia', region: 'Metropolitana' },
  { label: 'Las Condes (RM)', comuna: 'Las Condes', region: 'Metropolitana' },
  { label: 'Santiago Centro (RM)', comuna: 'Santiago', region: 'Metropolitana' },
  { label: 'Viña del Mar', comuna: 'Viña del Mar', region: 'Valparaíso' },
  { label: 'Concepción', comuna: 'Concepción', region: 'Biobío' },
] as const;

type ReplenishmentAddressFieldProps = {
  value: string;
  onChange: (value: string, details?: ReplenishmentShippingData) => void;
  direcciones?: ClienteDireccion[];
  initialUserData?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  className?: string;
};

function formatDireccionToString(d: Partial<ClienteDireccion> | ReplenishmentShippingData): string {
  const parts = [
    d.direccion,
    d.comuna,
    d.ciudad,
    d.region,
  ].filter(Boolean);
  return parts.join(', ');
}

export function ReplenishmentAddressField({
  value,
  onChange,
  direcciones = [],
  initialUserData,
  className = '',
}: ReplenishmentAddressFieldProps) {
  const t = useTranslations('perfil.reposicion');

  // Estado del formulario manual
  const [formData, setFormData] = useState<ReplenishmentShippingData>({
    nombre: initialUserData?.name ?? '',
    email: initialUserData?.email ?? '',
    telefono: initialUserData?.phone ?? '',
    direccion: '',
    comuna: '',
    ciudad: '',
    region: 'Los Lagos',
    codigoPostal: '',
    instrucciones: '',
  });

  // Si el usuario seleccionó una dirección guardada existente
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  // Modo de gestión / visualización de lista de direcciones guardadas
  const [isManaging, setIsManaging] = useState<boolean>(false);
  // Si está usando el formulario manual (porque no hay guardadas o eligió "+ Nueva dirección")
  const [isManualForm, setIsManualForm] = useState<boolean>(direcciones.length === 0);

  // Inicialización con dirección predeterminada o guardada
  useEffect(() => {
    if (direcciones.length > 0 && !selectedAddressId && !isManualForm) {
      const def = direcciones.find((d) => d.es_predeterminada) || direcciones[0];
      if (def) {
        setSelectedAddressId(def.id);
        const formatted = formatDireccionToString(def);
        onChange(formatted, {
          nombre: def.nombre || initialUserData?.name || '',
          email: initialUserData?.email || '',
          telefono: def.telefono || initialUserData?.phone || '',
          direccion: def.direccion,
          comuna: def.comuna,
          ciudad: def.ciudad || def.comuna,
          region: def.region,
          codigoPostal: def.codigo_postal || '',
          instrucciones: def.instrucciones || '',
        });
      }
    }
  }, [direcciones, selectedAddressId, isManualForm, initialUserData, onChange]);

  // Actualización de datos del usuario si llegan tarde
  useEffect(() => {
    if (initialUserData) {
      setFormData((prev) => ({
        ...prev,
        nombre: prev.nombre || initialUserData.name || '',
        email: prev.email || initialUserData.email || '',
        telefono: prev.telefono || initialUserData.phone || '',
      }));
    }
  }, [initialUserData]);

  const comunasRegion = useMemo(() => {
    if (!formData.region || !isChileRegion(formData.region)) return [];
    return getComunasPorRegion(formData.region);
  }, [formData.region]);

  const ciudadesRegion = useMemo(() => {
    if (!formData.region || !isChileRegion(formData.region)) return [];
    return getCiudadesPorRegion(formData.region);
  }, [formData.region]);

  const handleSelectSaved = (d: ClienteDireccion) => {
    setSelectedAddressId(d.id);
    setIsManualForm(false);
    setIsManaging(false);
    const formatted = formatDireccionToString(d);
    onChange(formatted, {
      nombre: d.nombre || initialUserData?.name || '',
      email: initialUserData?.email || '',
      telefono: d.telefono || initialUserData?.phone || '',
      direccion: d.direccion,
      comuna: d.comuna,
      ciudad: d.ciudad || d.comuna,
      region: d.region,
      codigoPostal: d.codigo_postal || '',
      instrucciones: d.instrucciones || '',
    });
  };

  const handleStartNewAddress = () => {
    setSelectedAddressId(null);
    setIsManualForm(true);
    setIsManaging(false);
  };

  const updateFormField = (field: keyof ReplenishmentShippingData, val: string) => {
    const updated = { ...formData, [field]: val };
    if (field === 'region') {
      const comunas = getComunasPorRegion(val);
      if (comunas.length > 0 && !comunas.includes(updated.comuna)) {
        updated.comuna = '';
        updated.ciudad = '';
      }
    }
    setFormData(updated);
    const formatted = formatDireccionToString(updated);
    onChange(formatted, updated);
  };

  const aplicarAtajo = (atajo: typeof ATAJOS_DESTINOS[number]) => {
    const updated = {
      ...formData,
      region: atajo.region,
      comuna: atajo.comuna,
      ciudad: atajo.comuna,
    };
    setFormData(updated);
    const formatted = formatDireccionToString(updated);
    onChange(formatted, updated);
  };

  const activeSelectedAddress = useMemo(() => {
    if (!selectedAddressId) return null;
    return direcciones.find((d) => d.id === selectedAddressId) ?? null;
  }, [direcciones, selectedAddressId]);

  return (
    <section className={`space-y-3 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="tienda-replenishment-section-label">
          <span className="inline-flex items-center gap-2">
            <MapPin size={14} className="text-accent" />
            {t('destination')}
          </span>
        </h4>
        <Link
          href="/perfil/billetera"
          target="_blank"
          className="text-xs text-accent-text hover:underline inline-flex items-center gap-1 font-medium"
        >
          <span>Libreta en Billetera</span>
          <ExternalLink size={12} />
        </Link>
      </div>

      {/* Caso A: El usuario tiene direcciones guardadas y ha seleccionado una */}
      {!isManualForm && activeSelectedAddress && (
        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-foreground text-sm">
                  {activeSelectedAddress.etiqueta || 'Dirección de Entrega'}
                </span>
                {activeSelectedAddress.es_predeterminada && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent font-bold uppercase tracking-wider">
                    Predeterminada
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground font-medium">
                {activeSelectedAddress.direccion}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeSelectedAddress.comuna}, {activeSelectedAddress.ciudad ? `${activeSelectedAddress.ciudad}, ` : ''}{activeSelectedAddress.region}
              </p>
              {activeSelectedAddress.nombre && (
                <p className="text-[11px] text-muted-foreground pt-0.5">
                  Destinatario: {activeSelectedAddress.nombre} {activeSelectedAddress.telefono ? `(${activeSelectedAddress.telefono})` : ''}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsManaging((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary/50 text-xs font-semibold text-foreground hover:border-accent/40 hover:text-accent transition shrink-0 cursor-pointer"
            >
              <span>{isManaging ? 'Ocultar' : 'Gestionar'}</span>
              {isManaging ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {/* Menú desplegable para gestionar / cambiar de dirección guardada */}
          {isManaging && (
            <div className="pt-3 border-t border-border/60 space-y-2 animate-in fade-in duration-200">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                Cambiar por otra dirección guardada:
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {direcciones.map((d) => {
                  const isSel = d.id === selectedAddressId;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleSelectSaved(d)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start justify-between gap-2 cursor-pointer ${
                        isSel
                          ? 'border-accent bg-accent/15 text-foreground ring-1 ring-accent/30'
                          : 'border-border/70 bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-border'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-foreground truncate">
                            {d.etiqueta || 'Dirección'}
                          </span>
                          {d.es_predeterminada && (
                            <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-accent/20 text-accent font-bold uppercase">
                              Predeterminada
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{d.direccion}</p>
                        <p className="text-[10px] text-muted-foreground/80">{d.comuna}, {d.region}</p>
                      </div>
                      {isSel && <Check size={14} className="text-accent shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartNewAddress}
                  className="inline-flex items-center gap-1.5 text-xs text-accent-text hover:underline font-medium cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Ingresar una dirección nueva para esta reposición</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Caso B: Formulario manual de dirección (no hay direcciones o el usuario decidió ingresar una nueva) */}
      {(isManualForm || !activeSelectedAddress) && (
        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Datos y Dirección de Despacho
            </span>
            {direcciones.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsManualForm(false);
                  const def = direcciones.find((d) => d.es_predeterminada) || direcciones[0];
                  if (def) handleSelectSaved(def);
                }}
                className="text-xs text-accent-text hover:underline cursor-pointer"
              >
                Volver a mis direcciones guardadas
              </button>
            )}
          </div>

          {/* Atajos territoriales habituales para acelerar llenado */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
              Destinos habituales de despacho
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ATAJOS_DESTINOS.map((at) => {
                const isSel = formData.comuna.toLowerCase() === at.comuna.toLowerCase();
                return (
                  <button
                    key={at.label}
                    type="button"
                    onClick={() => aplicarAtajo(at)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      isSel
                        ? 'border-accent bg-accent/20 text-accent font-medium'
                        : 'border-border/60 bg-secondary/40 text-muted-foreground hover:border-accent/40 hover:text-foreground'
                    }`}
                  >
                    {at.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campos de contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Nombre completo *</label>
              <input
                type="text"
                autoComplete="name"
                value={formData.nombre}
                onChange={(e) => updateFormField('nombre', e.target.value)}
                placeholder="Cristina Miranda"
                className="w-full min-h-10 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Email *</label>
              <input
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => updateFormField('email', e.target.value)}
                placeholder="cristimira32@hotmail.com"
                className="w-full min-h-10 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Teléfono *</label>
              <input
                type="tel"
                autoComplete="tel"
                value={formData.telefono}
                onChange={(e) => updateFormField('telefono', e.target.value)}
                placeholder="+56 9 9123 4567"
                className="w-full min-h-10 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
            </div>
          </div>

          {/* Región, Comuna y Ciudad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Región *</label>
              <select
                value={formData.region}
                onChange={(e) => updateFormField('region', e.target.value)}
                className="w-full min-h-10 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20 cursor-pointer"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r} className="bg-card text-foreground">
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Comuna *</label>
              <input
                type="text"
                list="replenishment-comunas-list"
                value={formData.comuna}
                onChange={(e) => updateFormField('comuna', e.target.value)}
                placeholder="Comuna"
                className="w-full min-h-10 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
              {comunasRegion.length > 0 && (
                <datalist id="replenishment-comunas-list">
                  {comunasRegion.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              )}
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Ciudad *</label>
              <input
                type="text"
                list="replenishment-ciudades-list"
                value={formData.ciudad}
                onChange={(e) => updateFormField('ciudad', e.target.value)}
                placeholder="Ciudad"
                className="w-full min-h-10 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
              {ciudadesRegion.length > 0 && (
                <datalist id="replenishment-ciudades-list">
                  {ciudadesRegion.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              )}
            </div>
          </div>

          {/* Dirección y Código Postal */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-[11px] text-muted-foreground mb-1">Dirección *</label>
              <input
                type="text"
                autoComplete="street-address"
                value={formData.direccion}
                onChange={(e) => updateFormField('direccion', e.target.value)}
                placeholder="Calle, número, depto"
                className="w-full min-h-10 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Código postal</label>
              <input
                type="text"
                autoComplete="postal-code"
                inputMode="numeric"
                value={formData.codigoPostal}
                onChange={(e) => updateFormField('codigoPostal', e.target.value)}
                placeholder="Opcional"
                className="w-full min-h-10 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
            </div>
          </div>

          {/* Instrucciones de entrega */}
          <div>
            <label className="block text-[11px] text-muted-foreground mb-1">Instrucciones de entrega</label>
            <textarea
              value={formData.instrucciones}
              onChange={(e) => updateFormField('instrucciones', e.target.value)}
              placeholder="Casa con reja verde, dejar en portería..."
              rows={2}
              className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20 resize-none"
            />
          </div>
        </div>
      )}
    </section>
  );
}
