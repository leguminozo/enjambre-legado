'use client';

import React, { useState } from 'react';
import {
  Calendar,
  X,
  Share2,
  Clock,
  Sparkles,
  Send,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast, cn, friendlySupabaseError } from '@enjambre/ui';
import { supabase } from '@/lib/supabase';
import { type SlideData, generateCarouselCaption } from './slide-studio-core';

export interface ScheduleMarketingPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideData[];
}

export function ScheduleMarketingPostModal({
  isOpen,
  onClose,
  slides,
}: ScheduleMarketingPostModalProps) {
  const [postDate, setPostDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [postTime, setPostTime] = useState('19:00');
  const [platform, setPlatform] = useState<'IG' | 'TikTok' | 'Web' | 'LinkedIn'>('IG');
  const [status, setStatus] = useState<'Planificado' | 'Borrador'>('Planificado');
  const [caption, setCaption] = useState(() => generateCarouselCaption(slides));
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSchedule = async () => {
    if (!caption.trim()) {
      toast.error('El contenido o caption no puede estar vacío.');
      return;
    }

    try {
      setIsSubmitting(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const combinedDate = `${postDate} ${postTime}`;

      const { error } = await supabase.from('marketing_posts').insert({
        user_id: user?.id || null,
        post_date: combinedDate,
        type: `Carrusel (${slides.length} láminas)`,
        platform,
        status,
        content: caption.trim(),
      });

      if (error) {
        toast.error(friendlySupabaseError(error));
        return;
      }

      toast.success(
        `Carrusel agendado exitosamente para el ${postDate} a las ${postTime} hrs en ${platform}.`,
      );
      onClose();
    } catch (err: unknown) {
      toast.error('Error al registrar la publicación en el calendario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col justify-between">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-foreground">
                Agendar en Calendario de Marketing
              </h3>
              <p className="text-[11px] text-muted-foreground font-mono">
                Programa este carrusel ({slides.length} láminas) en la planificación editorial de Núcleo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost h-8 w-8 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulario */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 text-xs font-mono">
          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">
                Fecha de Publicación *
              </label>
              <input
                type="date"
                value={postDate}
                onChange={(e) => setPostDate(e.target.value)}
                className="input-field w-full text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">
                Hora de Publicación *
              </label>
              <input
                type="time"
                value={postTime}
                onChange={(e) => setPostTime(e.target.value)}
                className="input-field w-full text-xs font-mono"
              />
            </div>
          </div>

          {/* Plataforma y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">
                Canal / Plataforma *
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="input-field w-full text-xs font-mono"
              >
                <option value="IG">Instagram (@obrerayzangano)</option>
                <option value="TikTok">TikTok (Formato 9:16)</option>
                <option value="Web">Catálogo & Blog Tienda</option>
                <option value="LinkedIn">LinkedIn Corporativo B2B</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">
                Estado Inicial *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="input-field w-full text-xs font-mono"
              >
                <option value="Planificado">Planificado (Programado)</option>
                <option value="Borrador">Borrador Editorial</option>
              </select>
            </div>
          </div>

          {/* Caption Autogenerado y Editable */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-muted-foreground uppercase block">
                Texto / Caption de la Publicación
              </label>
              <button
                type="button"
                onClick={() => setCaption(generateCarouselCaption(slides))}
                className="text-[10px] text-primary hover:underline flex items-center gap-1"
              >
                <Sparkles size={11} />
                <span>Regenerar desde Láminas</span>
              </button>
            </div>
            <textarea
              rows={6}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input-field w-full text-xs font-sans leading-relaxed"
              placeholder="Escribe o revisa el caption para acompañar las láminas..."
            />
          </div>

          <div className="p-3 rounded-xl border border-border/70 bg-surface-sunken/40 flex items-start gap-2 text-[11px] text-muted-foreground">
            <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Al guardar, este carrusel quedará visible en la vista de{' '}
              <span className="text-foreground font-semibold">Marketing</span> de Núcleo para seguimiento del calendario y métricas de campaña.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline btn-sm text-xs px-3"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSchedule}
            disabled={isSubmitting || !caption.trim()}
            className="btn btn-primary btn-sm text-xs px-4 flex items-center gap-1.5 shadow-sm"
          >
            <Send size={13} />
            <span>{isSubmitting ? 'Guardando...' : 'Agendar Publicación'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
