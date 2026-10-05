'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Gift,
  Users,
  Award,
  Leaf,
  ShoppingBag,
  Building2,
  Crown,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import type { OyzRole } from '@/lib/shop/role';

interface EnjambreWelcomeClientProps {
  status: string;
  puntos: number | null;
  rol: OyzRole;
  config: Record<string, number>;
  hasClubActivo: boolean;
}

function pct(mult: number): number {
  return Math.round((1 - mult) * 100);
}

export function EnjambreWelcomeClient({
  status,
  puntos,
  rol,
  config,
  hasClubActivo,
}: EnjambreWelcomeClientProps) {
  const t = useTranslations('perfil.enjambre');

  const welcomePoints = config['welcome_points'] ?? 100;
  const multSuscriptor = config['mult_suscriptor'] ?? 0.9;
  const multRevendedor = config['mult_revendedor'] ?? 0.8;
  const multEmbajador = config['mult_embajador'] ?? 0.7;
  const multVolumen = config['mult_volumen'] ?? 0.95;
  const volumenPedidos = config['volumen_pedidos'] ?? 10;

  const isJoined = status === 'joined';

  return (
    <div className="space-y-12">
      {/* Hero: momento de bienvenida (joined) o estado de miembro */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-secondary/30 px-6 py-10 sm:px-10 sm:py-12 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/10 via-transparent to-transparent" aria-hidden />
        <div className="relative">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 border border-accent/30 mb-6">
            <Users className="h-7 w-7 text-accent-text" />
          </span>
          <h2 className="font-display text-[clamp(1.75rem,4.5vw,2.75rem)] font-light text-foreground mb-3 text-balance">
            {isJoined ? t('heroJoinedTitle') : t('heroMemberTitle')}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed text-pretty">
            {isJoined
              ? t('heroJoinedDesc', { points: welcomePoints })
              : t('heroMemberDesc')}
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent-text tabular-nums">
            {puntos !== null ? `${puntos} pts` : `${welcomePoints} pts`}
          </p>
        </div>
      </section>

      {/* Beneficios base: toda instancia del enjambre */}
      <section>
        <h3 className="editorial-kicker mb-2 text-xs sm:text-sm font-semibold tracking-widest">{t('baseTitle')}</h3>
        <p className="text-sm sm:text-base text-muted-foreground mb-6">{t('baseDesc')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <BenefitCard
            icon={<Gift size={20} />}
            title={t('canjeTitle')}
            description={t('canjeDesc')}
            href="/perfil/canje"
            cta={t('canjeCta')}
          />
          <BenefitCard
            icon={<Users size={20} />}
            title={t('redTitle')}
            description={t('redDesc')}
            href="/perfil/circular"
            cta={t('redCta')}
          />
          <BenefitCard
            icon={<Award size={20} />}
            title={t('sellosTitle')}
            description={t('sellosDesc')}
            href="/perfil/billetera"
            cta={t('sellosCta')}
          />
          <BenefitCard
            icon={<Leaf size={20} />}
            title={t('logrosTitle')}
            description={t('logrosDesc')}
            href="/perfil/logros"
            cta={t('logrosCta')}
          />
        </div>
      </section>

      {/* Ascensos: suscriptor / revendedor / embajador con % reales de la config */}
      <section>
        <h3 className="editorial-kicker mb-2 text-xs sm:text-sm font-semibold tracking-widest">{t('ascensoTitle')}</h3>
        <p className="text-sm sm:text-base text-muted-foreground mb-6">{t('ascensoDesc')}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <AscensoCard
            icon={<ShoppingBag size={20} />}
            title={t('clubTitle')}
            description={t('clubDesc', { descuento: pct(multSuscriptor) })}
            href="/club-legado-del-bosque"
            cta={t('clubCta')}
            activo={rol === 'suscriptor'}
            activoLabel={t('activo')}
          />
          <AscensoCard
            icon={<Building2 size={20} />}
            title={t('aliadoTitle')}
            description={t('aliadoDesc', {
              descuento: pct(multRevendedor),
              volumen: pct(multVolumen),
              pedidos: volumenPedidos,
            })}
            href="/perfil/mayorista"
            cta={t('aliadoCta')}
            activo={rol === 'revendedor'}
            activoLabel={t('activo')}
          />
          <AscensoCard
            icon={<Crown size={20} />}
            title={t('embajadorTitle')}
            description={t('embajadorDesc', { descuento: pct(multEmbajador) })}
            href="/perfil/creador"
            cta={t('embajadorCta')}
            activo={rol === 'embajador'}
            activoLabel={t('activo')}
          />
        </div>
      </section>

      {/* Pasaporte: solo si hay club activo (suscriptor_config es huérfano) */}
      {hasClubActivo ? (
        <section>
          <BenefitCard
            icon={<MapPin size={20} />}
            title={t('pasaporteTitle')}
            description={t('pasaporteDesc')}
            href="/perfil/pasaporte"
            cta={t('pasaporteCta')}
          />
        </section>
      ) : null}

      <p className="text-center text-xs text-muted-foreground/80 leading-relaxed max-w-md mx-auto">
        {t('note')}
      </p>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
  href,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-accent/50 hover:bg-surface-raised"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent-text">
        {icon}
      </span>
      <div>
        <h4 className="font-display text-xl text-foreground font-medium mb-1.5">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent-text group-hover:text-foreground transition-colors pt-2">
        {cta} <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function AscensoCard({
  icon,
  title,
  description,
  href,
  cta,
  activo,
  activoLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
  activo: boolean;
  activoLabel: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col gap-3 rounded-2xl border p-6 transition-colors ${
        activo
          ? 'border-accent/50 bg-accent/5'
          : 'border-border bg-card hover:border-accent/50 hover:bg-surface-raised'
      }`}
    >
      {activo ? (
        <span className="absolute right-4 top-4 rounded-full bg-accent/15 border border-accent/40 px-2.5 py-1 text-xs uppercase tracking-[0.14em] text-accent-text font-semibold">
          {activoLabel}
        </span>
      ) : null}
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent-text">
        {icon}
      </span>
      <div>
        <h4 className="font-display text-xl text-foreground font-medium mb-1.5">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent-text group-hover:text-foreground transition-colors pt-2">
        {cta} <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
