/**
 * Wordmark canónico del ecosistema para superficies centradas (loading, auth, empty states).
 * Tipografía display + tracking amplio; solo tokens semánticos.
 */
export function BrandWordmark({
  name = 'Enjambre Legado',
  tagline,
}: {
  name?: string;
  tagline?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5" aria-hidden>
      <span className="font-display text-[0.72rem] uppercase tracking-[0.35em] text-foreground/90">
        {name}
      </span>
      {tagline ? (
        <span className="text-[0.55rem] uppercase tracking-[0.3em] text-muted-foreground/70">
          {tagline}
        </span>
      ) : null}
    </div>
  );
}
