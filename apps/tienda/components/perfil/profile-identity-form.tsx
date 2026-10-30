'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast, friendlyError } from '@enjambre/ui';
import { useAuthStore } from '@enjambre/auth';
import { Truck, FileText, UserCheck, Building2, Loader2, Check } from 'lucide-react';
import {
  CHILEAN_COURIERS,
  CHILE_REGIONES,
  CHILE_COMUNAS_POR_REGION,
  getComunasPorRegion,
  getRegionDeComuna,
  getSugerenciaCiudad,
} from '@enjambre/logistica';
import { validarRUT, formatearRUT } from '@/lib/shop/rut';
import {
  type ProfileCompleteData,
  updateProfileCompleteData,
} from '@/app/actions/profile';

const ATAJOS_COMUNAS_PERFIL = [
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

interface ProfileIdentityFormProps {
  initialData: ProfileCompleteData;
}

export function ProfileIdentityForm({ initialData }: ProfileIdentityFormProps) {
  const router = useRouter();
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const [isPending, startTransition] = useTransition();

  // 1. Identidad y Contacto
  const [fullName, setFullName] = useState(initialData.full_name);
  const [telefono, setTelefono] = useState(initialData.telefono);

  // 2. Despacho Predeterminado
  const [courierPreferido, setCourierPreferido] = useState(
    initialData.courier_preferido || 'blueexpress',
  );
  const [region, setRegion] = useState(initialData.region || '');
  const [comuna, setComuna] = useState(initialData.comuna || '');
  const [ciudad, setCiudad] = useState(initialData.ciudad || '');
  const [direccion, setDireccion] = useState(initialData.direccion || '');
  const [codigoPostal, setCodigoPostal] = useState(initialData.codigo_postal || '');
  const [instrucciones, setInstrucciones] = useState(initialData.instrucciones || '');

  // 3. Documento Tributario (Boleta vs Factura B2B)
  const [tipoDte, setTipoDte] = useState<'boleta' | 'factura'>(initialData.tipo_dte || 'boleta');
  const [rut, setRut] = useState(initialData.rut || '');
  const [razonSocial, setRazonSocial] = useState(initialData.razon_social || '');
  const [giro, setGiro] = useState(initialData.giro || '');
  const [direccionTributaria, setDireccionTributaria] = useState(
    initialData.direccion_tributaria || '',
  );

  // Autocompletado territorial
  const comunasDisponibles = React.useMemo(() => {
    return region ? getComunasPorRegion(region) : Object.values(CHILE_COMUNAS_POR_REGION).flat();
  }, [region]);

  const handleComunaChange = (valor: string) => {
    setComuna(valor);
    const sugerencia = getSugerenciaCiudad(valor);
    if (sugerencia && (!ciudad || ciudad === 'Santiago' || comunasDisponibles.includes(ciudad))) {
      setCiudad(sugerencia);
    }
    const regDetectada = getRegionDeComuna(valor);
    if (regDetectada && regDetectada !== region) {
      setRegion(regDetectada);
    }
  };

  const aplicarAtajo = (item: { comuna: string; region: string }) => {
    setRegion(item.region);
    setComuna(item.comuna);
    const sugerencia = getSugerenciaCiudad(item.comuna);
    if (sugerencia) setCiudad(sugerencia);
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatearRUT(raw);
    setRut(formatted);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (tipoDte === 'factura') {
      const cleanRut = rut.trim();
      if (!cleanRut || !validarRUT(cleanRut)) {
        toast('Por favor ingresa un RUT de empresa válido (ej. 76.350.040-3).', {
          type: 'error',
        });
        return;
      }
      if (!razonSocial.trim()) {
        toast('Por favor ingresa la Razón Social de la empresa.', { type: 'error' });
        return;
      }
    }

    startTransition(async () => {
      try {
        await updateProfileCompleteData({
          full_name: fullName,
          email: initialData.email,
          telefono,
          courier_preferido: courierPreferido,
          direccion_id: initialData.direccion_id,
          direccion,
          comuna,
          ciudad,
          region,
          codigo_postal: codigoPostal,
          instrucciones,
          tipo_dte: tipoDte,
          rut,
          razon_social: razonSocial,
          giro,
          direccion_tributaria: direccionTributaria || direccion,
        });

        await refreshSession();
        router.refresh();
        toast('Datos de perfil y compra segura guardados exitosamente', { type: 'success' });
      } catch (error) {
        const message = friendlyError(error, 'No se pudo guardar la información');
        toast(message, { type: 'error' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      {/* ── BLOQUE 1: IDENTIDAD & CONTACTO ── */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label
              htmlFor="fullName"
              className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground ml-1 font-semibold"
            >
              Nombre Completo *
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: Cristina Miranda"
              required
              disabled={isPending}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="telefono"
              className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground ml-1 font-semibold"
            >
              Teléfono de Contacto *
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+56 9 1234 5678"
              disabled={isPending}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all disabled:opacity-60"
            />
            <p className="text-[0.6rem] text-muted-foreground ml-1">
              Coordinación de despacho y entrega por el transportista.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground ml-1 font-semibold"
          >
            Correo Electrónico Oficial
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={initialData.email}
            readOnly
            disabled
            className="w-full bg-secondary/60 border border-border/80 rounded-xl px-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
          />
          <p className="text-[0.6rem] text-muted-foreground ml-1">
            Tu cuenta y comprobantes están asociados a este correo.
          </p>
        </div>
      </div>

      {/* ── BLOQUE 2: DESPACHO PREDETERMINADO (PAGO SEGURO) ── */}
      <div className="space-y-6 pt-4 border-t border-border/60">
        <div className="flex items-center gap-2.5 text-accent-text">
          <Truck size={17} />
          <h4 className="text-[0.7rem] uppercase tracking-[0.2em] font-bold">
            Despacho Predeterminado
          </h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed -mt-3">
          Configura tus coordenadas habituales para que se precarguen automáticamente en cada compra.
        </p>

        <div className="space-y-2">
          <label
            htmlFor="courierPreferido"
            className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground ml-1 font-semibold"
          >
            Operador de Despacho Habitual
          </label>
          <select
            id="courierPreferido"
            value={courierPreferido}
            onChange={(e) => setCourierPreferido(e.target.value)}
            disabled={isPending}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all cursor-pointer"
          >
            {CHILEAN_COURIERS.map((c) => (
              <option key={c.code} value={c.code} className="bg-card text-foreground">
                {c.label} {c.code === 'blueexpress' ? '(Predeterminado oficial)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Atajos territoriales frecuentes */}
        <div className="space-y-1.5">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground ml-1 font-semibold">
            Destinos habituales de despacho
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ATAJOS_COMUNAS_PERFIL.map((item) => {
              const isSelected = comuna.trim().toLowerCase() === item.comuna.toLowerCase();
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => aplicarAtajo(item)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    isSelected
                      ? 'border-accent bg-accent/15 text-accent font-medium'
                      : 'border-border/60 bg-secondary/40 text-muted-foreground hover:border-accent/40 hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="region"
              className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground ml-1 font-semibold"
            >
              Región
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={isPending}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all cursor-pointer"
            >
              <option value="" className="bg-card text-foreground">Seleccionar región</option>
              {CHILE_REGIONES.map((reg) => (
                <option key={reg} value={reg} className="bg-card text-foreground">
                  {reg}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="comuna"
              className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground ml-1 font-semibold"
            >
              Comuna {region ? `(${region})` : ''}
            </label>
            <input
              type="text"
              id="comuna"
              list="perfil-comunas-list"
              value={comuna}
              onChange={(e) => handleComunaChange(e.target.value)}
              placeholder="Escribe o selecciona tu comuna..."
              disabled={isPending}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all"
            />
            <datalist id="perfil-comunas-list">
              {comunasDisponibles.map((com) => (
                <option key={com} value={com} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="ciudad"
              className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground ml-1 font-semibold"
            >
              Ciudad
            </label>
            <input
              type="text"
              id="ciudad"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Ej: Castro, Puerto Montt, Santiago..."
              disabled={isPending}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2 md:col-span-3">
            <label
              htmlFor="direccion"
              className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground ml-1 font-semibold"
            >
              Dirección de Entrega
            </label>
            <input
              type="text"
              id="direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle, número, depto o referencia"
              disabled={isPending}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="codigoPostal"
              className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground ml-1 font-semibold"
            >
              Código Postal
            </label>
            <input
              type="text"
              id="codigoPostal"
              value={codigoPostal}
              onChange={(e) => setCodigoPostal(e.target.value)}
              placeholder="Opcional"
              disabled={isPending}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="instrucciones"
            className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground ml-1 font-semibold"
          >
            Instrucciones de Entrega
          </label>
          <input
            type="text"
            id="instrucciones"
            value={instrucciones}
            onChange={(e) => setInstrucciones(e.target.value)}
            placeholder="Ej: Dejar en conserjería o portón de madera lateral"
            disabled={isPending}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all"
          />
        </div>
      </div>

      {/* ── BLOQUE 3: DOCUMENTO TRIBUTARIO & ALIANZAS B2B ── */}
      <div className="space-y-6 pt-4 border-t border-border/60">
        <div className="flex items-center gap-2.5 text-accent-text">
          <FileText size={17} />
          <h4 className="text-[0.7rem] uppercase tracking-[0.2em] font-bold">
            Documento Tributario Predeterminado
          </h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed -mt-3">
          Elige cómo deseas que se emitan tus comprobantes fiscales y si perteneces a una alianza o empresa asociada.
        </p>

        <div className="flex items-center p-1 rounded-2xl bg-secondary/80 border border-border max-w-sm">
          <button
            type="button"
            onClick={() => setTipoDte('boleta')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tipoDte === 'boleta'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tipoDte === 'boleta' && <Check size={13} />}
            Boleta
          </button>
          <button
            type="button"
            onClick={() => setTipoDte('factura')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tipoDte === 'factura'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tipoDte === 'factura' && <Building2 size={13} />}
            Factura B2B
          </button>
        </div>

        {tipoDte === 'factura' && (
          <div className="p-5 rounded-2xl bg-secondary/40 border border-border/80 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Building2 size={15} className="text-accent-text" />
              <span>Datos de Empresa & Alianza Comercial</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="factura-rut"
                  className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground font-semibold"
                >
                  RUT de Empresa *
                </label>
                <input
                  type="text"
                  id="factura-rut"
                  value={rut}
                  onChange={handleRutChange}
                  placeholder="76.350.040-3"
                  required={tipoDte === 'factura'}
                  disabled={isPending}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="factura-razonSocial"
                  className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground font-semibold"
                >
                  Razón Social *
                </label>
                <input
                  type="text"
                  id="factura-razonSocial"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Ej: Inversiones y Sabores SpA"
                  required={tipoDte === 'factura'}
                  disabled={isPending}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="factura-giro"
                  className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground font-semibold"
                >
                  Giro Comercial
                </label>
                <input
                  type="text"
                  id="factura-giro"
                  value={giro}
                  onChange={(e) => setGiro(e.target.value)}
                  placeholder="Ej: Hotelería, Gastronomía o Cafetería"
                  disabled={isPending}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="factura-direccion"
                  className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground font-semibold"
                >
                  Dirección Tributaria
                </label>
                <input
                  type="text"
                  id="factura-direccion"
                  value={direccionTributaria}
                  onChange={(e) => setDireccionTributaria(e.target.value)}
                  placeholder="Dirección fiscal registrada en SII"
                  disabled={isPending}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTÓN DE GUARDADO PRINCIPAL ── */}
      <div className="pt-4 flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground text-xs uppercase tracking-[0.18em] font-semibold hover:opacity-90 active:scale-[0.99] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Guardando cambios…</span>
            </>
          ) : (
            <>
              <UserCheck size={15} />
              <span>Guardar preferencias de compra</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
