import { ImageIcon } from 'lucide-react';
import Image from 'next/image';

type Props = {
  ratio?: 'square' | 'video' | 'portrait';
  label?: string;
  className?: string;
  src?: string;
  alt?: string;
  priority?: boolean;
  sizes?: string;
};

const ratioClass = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
} as const;

export function ImagePlaceholder({ ratio = 'square', label, className = '', src, alt, priority = false, sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' }: Props) {
  if (src) {
    return (
      <div className={`relative w-full overflow-hidden ${ratioClass[ratio]} ${className}`}>
        <Image
          src={src}
          alt={alt || label || 'Imagen'}
          fill
          className="object-cover"
          priority={priority}
          sizes={sizes}
          quality={85}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDsAB//Z"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center bg-surface-sunken/80 ${ratioClass[ratio]} w-full border border-border/10 ${className}`}
      role="img"
      aria-label={label || 'Imagen próximamente'}
    >
      <ImageIcon className="h-10 w-10 text-muted-foreground" strokeWidth={1} aria-hidden />
      {label ? <span className="mt-2 px-4 text-center text-xs text-muted-foreground">{label}</span> : null}
    </div>
  );
}
