import { ImageIcon } from 'lucide-react';

type Props = {
  ratio?: 'square' | 'video' | 'portrait';
  label?: string;
  className?: string;
};

const ratioClass = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
} as const;

/** Bloque listo para sustituir por <Image /> cuando tengas assets finales. */
export function ImagePlaceholder({ ratio = 'square', label, className = '' }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-zinc-900/80 ${ratioClass[ratio]} w-full border border-white/10 ${className}`}
      role="img"
      aria-label={label || 'Imagen próximamente'}
    >
      <ImageIcon className="h-10 w-10 text-zinc-600" strokeWidth={1} aria-hidden />
      {label ? <span className="mt-2 px-4 text-center text-xs text-zinc-500">{label}</span> : null}
    </div>
  );
}
