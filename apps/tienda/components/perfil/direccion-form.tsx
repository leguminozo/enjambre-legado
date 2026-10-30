'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { toast, friendlyError } from '@enjambre/ui';
import { type DireccionFormData, direccionSchema } from '@/lib/shop/direcciones-schema';
import {
  CHILE_REGIONES_DPA,
  CHILE_COMUNAS_POR_REGION,
  getComunasPorRegion,
  getRegionDeComuna,
  getSugerenciaCiudad,
} from '@enjambre/logistica';
import { ZodError } from 'zod';

const DESTINOS_FRECUENTES_TIENDA = [
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

const TODAS_LAS_COMUNAS = Object.values(CHILE_COMUNAS_POR_REGION)
  .flat()
  .sort((a, b) => a.localeCompare(b, 'es'));

interface DireccionFormProps {
  initialData?: DireccionFormData;
  onSubmit: (data: DireccionFormData) => Promise<void>;
  onCancel: () => void;
}

const defaultData: DireccionFormData = {
  etiqueta: 'Principal',
  nombre: '',
  telefono: '',
  direccion: '',
  comuna: '',
  ciudad: '',
  region: '',
  codigo_postal: '',
  instrucciones: '',
};

export function DireccionForm({ initialData, onSubmit, onCancel }: DireccionFormProps) {
  const [formData, setFormData] = useState<DireccionFormData>(initialData || defaultData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const comunasDisponibles = useMemo(() => {
    if (formData.region) {
      return getComunasPorRegion(formData.region);
    }
    return TODAS_LAS_COMUNAS;
  }, [formData.region]);

  const handleComunaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const detectedRegion = getRegionDeComuna(val);
    const targetRegion = detectedRegion || formData.region;
    const sugerida = getSugerenciaCiudad(val, targetRegion);

    setFormData((prev) => ({
      ...prev,
      comuna: val,
      region: targetRegion,
      ciudad: sugerida || prev.ciudad,
    }));

    if (errors.comuna) setErrors((prev) => ({ ...prev, comuna: '' }));
    if (detectedRegion && errors.region) setErrors((prev) => ({ ...prev, region: '' }));
    if (sugerida && errors.ciudad) setErrors((prev) => ({ ...prev, ciudad: '' }));
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRegion = e.target.value;
    let nextComuna = formData.comuna;
    let nextCiudad = formData.ciudad;

    if (newRegion) {
      const comunasDeNuevaRegion = getComunasPorRegion(newRegion);
      if (formData.comuna && !comunasDeNuevaRegion.some((c) => c.toLowerCase() === formData.comuna.toLowerCase())) {
        nextComuna = '';
        nextCiudad = '';
      } else if (formData.comuna) {
        nextCiudad = getSugerenciaCiudad(formData.comuna, newRegion);
      }
    }

    setFormData((prev) => ({
      ...prev,
      region: newRegion,
      comuna: nextComuna,
      ciudad: nextCiudad,
    }));

    if (errors.region) setErrors((prev) => ({ ...prev, region: '' }));
  };

  const handleSelectDestinoFrecuente = (item: { comuna: string; region: string }) => {
    const ciudadSugerida = getSugerenciaCiudad(item.comuna, item.region);
    setFormData((prev) => ({
      ...prev,
      comuna: item.comuna,
      region: item.region,
      ciudad: ciudadSugerida || item.comuna,
    }));
    setErrors((prev) => ({ ...prev, comuna: '', region: '', ciudad: '' }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const parsed = direccionSchema.parse(formData);
      startTransition(async () => {
        try {
          await onSubmit(parsed);
        } catch (error) {
          const message = friendlyError(error, 'Error al guardar');
          toast(message, { type: 'error' });
        }
      });
    } catch (err) {
      if (err instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        for (const issue of err.issues) {
          newErrors[issue.path[0] as string] = issue.message;
        }
        setErrors(newErrors);
        toast('Revisa los campos con error', { type: 'error' });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-1.5 md:col-span-2">
        <label htmlFor="etiqueta" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Etiqueta (Ej: Casa, Oficina) *
        </label>
        <input
          id="etiqueta"
          name="etiqueta"
          value={formData.etiqueta}
          onChange={handleChange}
          disabled={isPending}
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-base md:text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
            errors.etiqueta ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.etiqueta && <p className="text-xs text-destructive ml-1">{errors.etiqueta}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="nombre" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Nombre de quien recibe *
        </label>
        <input
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          disabled={isPending}
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-base md:text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
            errors.nombre ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.nombre && <p className="text-xs text-destructive ml-1">{errors.nombre}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="telefono" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Teléfono de contacto *
        </label>
        <input
          id="telefono"
          name="telefono"
          value={formData.telefono}
          onChange={handleChange}
          disabled={isPending}
          placeholder="+569"
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-base md:text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
            errors.telefono ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.telefono && <p className="text-xs text-destructive ml-1">{errors.telefono}</p>}
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <label htmlFor="direccion" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Dirección y Número *
        </label>
        <input
          id="direccion"
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
          disabled={isPending}
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-base md:text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
            errors.direccion ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.direccion && <p className="text-xs text-destructive ml-1">{errors.direccion}</p>}
      </div>

      {/* Destinos frecuentes (1 clic) */}
      <div className="space-y-1 md:col-span-2">
        <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Localidades frecuentes (clic para autocompletar)
        </span>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {DESTINOS_FRECUENTES_TIENDA.map((dest) => {
            const isSelected =
              formData.comuna.toLowerCase() === dest.comuna.toLowerCase() &&
              formData.region.toLowerCase() === dest.region.toLowerCase();
            return (
              <button
                key={`${dest.comuna}-${dest.region}`}
                type="button"
                onClick={() => handleSelectDestinoFrecuente(dest)}
                disabled={isPending}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-accent/20 border-accent text-accent font-semibold shadow-sm'
                    : 'border-border/80 bg-secondary/60 hover:border-accent/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                {dest.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Región */}
      <div className="space-y-1.5">
        <label htmlFor="region" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Región *
        </label>
        <select
          id="region"
          name="region"
          value={formData.region}
          onChange={handleRegionChange}
          disabled={isPending}
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-base md:text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
            errors.region ? 'border-destructive' : 'border-border'
          }`}
        >
          <option value="">Selecciona tu región...</option>
          {CHILE_REGIONES_DPA.map((r) => (
            <option key={r.id} value={r.nombre}>
              {r.nombreOficial} ({r.romano})
            </option>
          ))}
        </select>
        {errors.region && <p className="text-xs text-destructive ml-1">{errors.region}</p>}
      </div>

      {/* Comuna con autocompletado datalist */}
      <div className="space-y-1.5">
        <label htmlFor="comuna" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Comuna {formData.region ? `(${formData.region})` : '*'}
        </label>
        <div className="relative">
          <input
            id="comuna"
            name="comuna"
            list="tienda-comunas-list"
            value={formData.comuna}
            onChange={handleComunaChange}
            disabled={isPending}
            placeholder="Escribe o selecciona tu comuna..."
            className={`w-full bg-secondary border rounded-xl px-4 py-3 text-base md:text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
              errors.comuna ? 'border-destructive' : 'border-border'
            }`}
          />
          <datalist id="tienda-comunas-list">
            {comunasDisponibles.map((com) => (
              <option key={com} value={com} />
            ))}
          </datalist>
        </div>
        {errors.comuna && <p className="text-xs text-destructive ml-1">{errors.comuna}</p>}
      </div>

      {/* Ciudad */}
      <div className="space-y-1.5">
        <label htmlFor="ciudad" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Ciudad *
        </label>
        <input
          id="ciudad"
          name="ciudad"
          value={formData.ciudad}
          onChange={handleChange}
          disabled={isPending}
          placeholder="Ciudad o localidad"
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-base md:text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
            errors.ciudad ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.ciudad && <p className="text-xs text-destructive ml-1">{errors.ciudad}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="codigo_postal" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Código Postal (Opcional)
        </label>
        <input
          id="codigo_postal"
          name="codigo_postal"
          value={formData.codigo_postal || ''}
          onChange={handleChange}
          disabled={isPending}
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-base md:text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
            errors.codigo_postal ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.codigo_postal && <p className="text-xs text-destructive ml-1">{errors.codigo_postal}</p>}
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <label htmlFor="instrucciones" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Instrucciones adicionales para el envío (Opcional)
        </label>
        <textarea
          id="instrucciones"
          name="instrucciones"
          value={formData.instrucciones || ''}
          onChange={handleChange}
          disabled={isPending}
          rows={3}
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all resize-none ${
            errors.instrucciones ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.instrucciones && <p className="text-xs text-destructive ml-1">{errors.instrucciones}</p>}
      </div>

      <div className="md:col-span-2 flex items-center justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-5 py-2.5 rounded-xl border border-border text-xs uppercase tracking-[0.1em] text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs uppercase tracking-[0.15em] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
