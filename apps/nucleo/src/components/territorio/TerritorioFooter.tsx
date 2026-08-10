import Link from 'next/link';

/**
 * Footer público del territorio. La línea "La Red es un bien común; La Obrera
 * y el Zángano es su proveedor tecnológico" separa los roles del playbook
 * (commons vs. proveedor) y va siempre, en todas las páginas públicas.
 */
export function TerritorioFooter() {
  return (
    <footer className="bg-background py-12 sm:py-14 print:hidden border-t border-border">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-col items-center gap-5 text-center">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-xs text-muted-foreground">
          <Link href="/mapa-chiloe" className="min-h-9 inline-flex items-center hover:text-foreground transition-colors">
            Mapa público
          </Link>
          <Link href="/carta" className="min-h-9 inline-flex items-center hover:text-foreground transition-colors">
            Carta Territorial
          </Link>
          <Link href="/municipalidades" className="min-h-9 inline-flex items-center hover:text-foreground transition-colors">
            Municipalidades / prensa
          </Link>
          <Link href="/#faq" className="min-h-9 inline-flex items-center hover:text-foreground transition-colors">
            Preguntas frecuentes
          </Link>
          <Link href="/login" className="min-h-9 inline-flex items-center hover:text-foreground transition-colors">
            Entrar
          </Link>
          <Link href="/login?mode=signup" className="min-h-9 inline-flex items-center text-primary hover:text-primary/80 transition-colors font-medium">
            Inscribirse
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">Hecho por La Obrera y el Zángano, en Chiloé.</p>
        <p className="text-[11px] text-muted-foreground/70 max-w-md leading-relaxed">
          La Red es un bien común; La Obrera y el Zángano es su proveedor tecnológico.
        </p>
        <p className="text-xs text-muted-foreground/80">
          &copy; {new Date().getFullYear()} Registro Territorial Apícola de Chiloé.
        </p>
      </div>
    </footer>
  );
}
