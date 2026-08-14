/**
 * Wordmark canónico del ecosistema para superficies centradas (loading, auth, empty states).
 * Tipografía display + tracking amplio; solo tokens semánticos.
 * `ecosystem` es la línea pequeña que agrupa la marca bajo el ecosistema (p. ej. Enjambre Legado).
 */
export function BrandWordmark({
  name = 'Enjambre Legado',
  tagline,
  ecosystem,
}: {
  name?: string;
  tagline?: string;
  ecosystem?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5" aria-hidden>
      <span className="font-display text-[0.72rem] uppercase tracking-[0.35em] text-foreground/90">
        {name}
      </span>
      {ecosystem ? (
        <span className="text-[0.5rem] uppercase tracking-[0.3em] text-muted-foreground/60">
          {ecosystem}
        </span>
      ) : null}
      {tagline ? (
        <span className="text-[0.55rem] uppercase tracking-[0.3em] text-muted-foreground/70">
          {tagline}
        </span>
      ) : null}
    </div>
  );
}
