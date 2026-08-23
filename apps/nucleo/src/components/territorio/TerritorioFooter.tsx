import Link from 'next/link';
import { TerritorioLogo } from './TerritorioLogo';

/**
 * Footer público del territorio.
 * Municipalidades / carta / FAQ van aquí — no en el hero.
 */
export function TerritorioFooter() {
  return (
    <footer className="print:hidden border-t border-border/60 bg-background">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-14 sm:py-16 flex flex-col items-center gap-8 text-center">
        <div className="flex items-center gap-2">
          <TerritorioLogo className="w-9 h-9 text-primary" />
          <span className="font-existencial text-base font-semibold tracking-tight text-foreground">
            Registro Apícola Chiloé
          </span>
        </div>

        <nav
          className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground"
          aria-label="Enlaces del pie"
        >
          <Link href="/mapa-chiloe" className="min-h-9 inline-flex items-center hover:text-foreground transition-colors">
            Mapa
          </Link>
          <Link href="/planes-territoriales" className="min-h-9 inline-flex items-center hover:text-foreground transition-colors">
            Planes
          </Link>
          {process.env.NEXT_PUBLIC_URL_TIENDA && (
            <a
              href={`${process.env.NEXT_PUBLIC_URL_TIENDA}/impacto`}
              className="min-h-9 inline-flex items-center hover:text-foreground transition-colors"
            >
              Impacto
            </a>
          )}
          <Link href="/carta" className="min-h-9 inline-flex items-center hover:text-foreground transition-colors">
            Carta territorial
          </Link>
          <Link href="/privacidad" className="min-h-9 inline-flex items-center hover:text-foreground transition-colors">
            Privacidad
          </Link>
          <Link href="/terminos" className="min-h-9 inline-flex items-center hover:text-foreground transition-colors">
            Términos
          </Link>
          <Link href="/municipalidades" className="min-h-9 inline-flex items-center hover:text-foreground transition-colors">
            Instituciones / Municipios
          </Link>
          <Link href="/comuna" className="min-h-9 inline-flex items-center hover:text-foreground transition-colors">
            Informes comunales
          </Link>
          <Link href="/municipalidades/kit" className="min-h-9 inline-flex items-center hover:text-foreground transition-colors">
            Kit
          </Link>
          <Link href="/#faq" className="min-h-9 inline-flex items-center hover:text-foreground transition-colors">
            Preguntas
          </Link>
        </nav>

        <div className="space-y-2 max-w-md">
          <p className="text-sm text-muted-foreground">Hecho por La Obrera y el Zángano, en Chiloé.</p>
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            La red es un bien común. La Obrera y el Zángano es su proveedor tecnológico.
          </p>
          <p className="text-xs text-muted-foreground/60 pt-2">
            © {new Date().getFullYear()} Registro Territorial Apícola de Chiloé
          </p>
        </div>
      </div>
    </footer>
  );
}
