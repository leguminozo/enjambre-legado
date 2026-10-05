'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SocialSlideStudioModal } from '@/components/marketing/SocialSlideStudioModal';
import { ViewShell } from '@/components/layout/ViewShell';
import { Sparkles } from 'lucide-react';

export default function ComunidadEstudioPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    router.push('/comunidad');
  };

  return (
    <div className="space-y-6">
      <ViewShell
        title="Estudio Editorial RRSS"
        subtitle="Diseñador y exportador de láminas institucionales en formato 4:5 (1080×1350)"
      />
      <div className="card p-8 text-center space-y-4 max-w-xl mx-auto border-amber-500/20 bg-gradient-to-br from-card via-card to-amber-950/15">
        <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto">
          <Sparkles size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-lg text-foreground">
            Láminas Editoriales de Alta Gama
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Módulo interactivo para componer, verificar con reglas anti-slop y descargar piezas de Instagram y X en alta resolución (1080×1350 px).
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-primary btn-sm px-6"
            onClick={() => setOpen(true)}
          >
            Abrir Estudio Editorial
          </button>
        </div>
      </div>

      <SocialSlideStudioModal open={open} onClose={handleClose} />
    </div>
  );
}
