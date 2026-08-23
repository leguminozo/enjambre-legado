import Image from 'next/image';

/**
 * Bloque de identidad territorial de La Obrera y el Zángano (2ª posición
 * tras el hero). Estructura del bloque "Hecho en Chiloé" del registro
 * territorial, adaptada al lenguaje y la identidad de la tienda: la casa
 * productora es la protagonista — sin referencias a la red comunal.
 */
export function IdentidadOyzSection() {
  return (
    <section
      id="identidad"
      className="editorial-section bg-surface-sunken"
      aria-labelledby="identidad-title"
    >
      <div className="editorial-container grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center max-w-5xl">
        <div className="lg:col-span-5 relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] rounded-lg overflow-hidden ring-1 ring-border/50 shadow-md">
          <Image
            src="/assets/editorial/honey-jar.png"
            alt="Frasco de miel cruda del bosque nativo de Chiloé"
            fill
            priority={false}
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/40 to-transparent flex items-start justify-start p-6 sm:p-8">
            <p className="font-display italic text-2xl sm:text-3xl text-foreground leading-snug max-w-[16ch] drop-shadow-sm">
              Chiloé, bosque nativo.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 max-w-xl">
          <span className="editorial-kicker mb-4 block">
            Identidad territorial
          </span>
          <h2
            id="identidad-title"
            className="font-display text-[clamp(2rem,5vw,3.5rem)] font-light text-foreground text-balance leading-tight mb-6"
          >
            Hecho en Chiloé
          </h2>
          <p className="text-muted-foreground leading-relaxed text-base sm:text-lg mb-5">
            Nuestra apicultura real de la isla: La Obrera y el Zángano, más de veinte años con
            bosque nativo en Pureo y Queilén. Lo que el bosque nos enseña llega a tu mesa tal como
            nace: crudo, sin filtrar y trazado desde el apiario.
          </p>
          <p className="text-foreground font-medium leading-relaxed">
            Lo que el bosque nos comparte, directo desde el sol, no se mejora: se honra.
            Que la miel de Chiloé se disfrute en Chile y el planeta, y que cada frasco siga
            sembrando el bosque que nos sobrevivirá.
          </p>
        </div>
      </div>
    </section>
  );
}