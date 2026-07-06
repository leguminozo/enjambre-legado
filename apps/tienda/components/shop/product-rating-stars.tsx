import { Star } from 'lucide-react';

type Props = {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md';
  showCount?: boolean;
};

export function ProductRatingStars({
  rating,
  reviewCount,
  size = 'sm',
  showCount = false,
}: Props) {
  const iconSize = size === 'sm' ? 12 : 14;
  const rounded = Math.round(rating * 2) / 2;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.floor(rounded);
          const half = !filled && i + 0.5 === rounded;
          return (
            <Star
              key={i}
              size={iconSize}
              className={
                filled || half
                  ? 'fill-accent text-accent'
                  : 'text-muted-foreground/30'
              }
            />
          );
        })}
      </div>
      {showCount && reviewCount != null && reviewCount > 0 && (
        <span className="text-[10px] text-muted-foreground tabular-nums">({reviewCount})</span>
      )}
    </div>
  );
}