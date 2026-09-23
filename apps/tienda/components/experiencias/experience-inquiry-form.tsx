'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Send, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { useAuth } from '@/components/providers/auth-context';

export interface ExperienceFormatChoice {
  id: string;
  title: string;
  subtitle: string;
  defaultAttendees?: string;
  attendeeOptions?: string[];
}

export interface ExperienceInquiryFormProps {
  initialFormat?: string;
  experienceName?: string;
  formatChoices?: ExperienceFormatChoice[];
  inquiryTitle?: string;
  inquirySubtitle?: string;
  notesPlaceholder?: string;
}

const DEFAULT_CHOICES: ExperienceFormatChoice[] = [
  {
    id: 'corporativo',
    title: 'Corporativo & Directorios',
    subtitle: '10 a 20 personas · Oficinas / Salón',
    defaultAttendees: '10 a 15 asistentes',
    attendeeOptions: [
      '10 a 12 asistentes',
      '12 a 16 asistentes',
      '16 a 20 asistentes',
      'Más de 20 asistentes (requiere evaluación)',
    ],
  },
  {
    id: 'intimo',
    title: 'Íntimo & Residencia',
    subtitle: '6 a 10 personas · Domicilio privado',
    defaultAttendees: '6 a 8 asistentes',
    attendeeOptions: ['6 asistentes', '8 asistentes', '10 asistentes'],
  },
];

export function ExperienceInquiryForm({
  initialFormat = 'corporativo',
  experienceName = 'Floraciones del Bosque Austral',
  formatChoices = DEFAULT_CHOICES,
  inquiryTitle = 'Solicitar fecha o propuesta formal',
  inquirySubtitle,
  notesPlaceholder,
}: ExperienceInquiryFormProps) {
  const { contact } = useStoreChrome();
  const { user } = useAuth();

  const phoneDisplay =
    typeof contact.phone_display === 'string' && contact.phone_display.trim()
      ? contact.phone_display
      : '+56 9 4083 1358';
  const whatsappDigits = phoneDisplay.replace(/\D/g, '') || '56940831358';
  const contactEmail =
    typeof contact.email === 'string' && contact.email.trim()
      ? contact.email
      : 'obrerayzangano@gmail.com';

  const choices = formatChoices.length > 0 ? formatChoices : DEFAULT_CHOICES;
  const initialChoice = choices.find((c) => c.id === initialFormat) ?? choices[0];

  const [format, setFormat] = useState<string>(initialChoice?.id ?? 'corporativo');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [attendees, setAttendees] = useState(initialChoice?.defaultAttendees ?? '10 a 15 asistentes');
  const [timeframe, setTimeframe] = useState('');
  const [notes, setNotes] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  // Pre-completar desde sesión activa si el visitante está autenticado
  useEffect(() => {
    if (!user) return;
    if (user.email && !email) {
      setEmail(user.email);
    }
    if (user.name && !name) {
      setName(user.name);
    }
  }, [user]);

  const activeChoice = choices.find((c) => c.id === format) ?? choices[0];
  const formatTitle = activeChoice ? `${activeChoice.title} (${activeChoice.subtitle})` : format;

  const buildMessageBody = () => {
    const lines = [
      'SOLICITUD DE EXPERIENCIA · LA OBRERA Y EL ZÁNGANO',
      `Experiencia: ${experienceName}`,
      `Modalidad: ${formatTitle}`,
      `Anfitrión / Organización: ${organization.trim() ? `${organization.trim()} (${name.trim()})` : name.trim() || 'No especificado'}`,
      `Asistentes estimados: ${attendees}`,
      `Fecha o mes tentativo: ${timeframe.trim() || 'A coordinar'}`,
      `Contacto: ${phone.trim() || 'No indicado'} | ${email.trim() || 'No indicado'}`,
    ];

    if (notes.trim()) {
      lines.push('', `Requerimientos adicionales: ${notes.trim()}`);
    }

    return lines.join('\n');
  };

  const backupToCRM = async () => {
    try {
      await fetch('/api/experiencias/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          experienceName,
          name,
          organization,
          email,
          phone,
          attendees,
          timeframe,
          notes,
          honeypot,
        }),
      });
    } catch {
      // Fail-soft: no bloquear la coordinación inmediata con el cliente
    }
  };

  const handleWhatsApp = async (e: FormEvent) => {
    e.preventDefault();
    void backupToCRM();
    const body = buildMessageBody();
    const url = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSentNotice('Solicitud respaldada en agenda. Abriendo WhatsApp institucional...');
  };

  const handleEmail = async () => {
    void backupToCRM();
    const body = buildMessageBody();
    const subject = `Solicitud de Experiencia: ${experienceName} (${formatTitle}) — ${organization || name || 'Reserva'}`;
    const url = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    setSentNotice('Solicitud respaldada en agenda. Abriendo cliente de correo...');
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-surface-raised/40 p-6 sm:p-8 backdrop-blur-sm">
      <div className="mb-6 border-b border-border/20 pb-4">
        <span className="block text-[0.65rem] uppercase tracking-[0.3em] text-accent-text mb-1">
          Coordinación directa
        </span>
        <h3 className="font-display text-2xl font-light text-foreground">
          {inquiryTitle}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          {inquirySubtitle ??
            'Sin registro de usuario ni claves. Tu requerimiento llega directamente a la coordinación de agenda de Cristina Miranda.'}
        </p>
      </div>

      <form onSubmit={handleWhatsApp} className="space-y-5">
        {/* Campo trampa anti-bot */}
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        {/* Selector de formato */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Tipo de encuentro / modalidad
          </label>
          <div className={`grid grid-cols-1 ${choices.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
            {choices.map((choice) => {
              const isSelected = format === choice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => {
                    setFormat(choice.id);
                    if (choice.defaultAttendees) {
                      setAttendees(choice.defaultAttendees);
                    }
                  }}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-border/30 bg-background/50 text-muted-foreground hover:border-border'
                  }`}
                >
                  <div className="text-xs font-semibold text-foreground">{choice.title}</div>
                  <div className="text-[0.7rem] text-muted-foreground mt-0.5">{choice.subtitle}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Datos de contacto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Nombre del solicitante *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Constanza Silva"
              className="w-full rounded-xl border border-border/30 bg-background px-3.5 py-2.5 text-base md:text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Empresa u Organización (opcional)
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Ej. Estudio Jurídico / Family Office"
              className="w-full rounded-xl border border-border/30 bg-background px-3.5 py-2.5 text-base md:text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Teléfono WhatsApp *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+56 9 9123 4567"
              className="w-full rounded-xl border border-border/30 bg-background px-3.5 py-2.5 text-base md:text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Correo corporativo o personal *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@organizacion.cl"
              className="w-full rounded-xl border border-border/30 bg-background px-3.5 py-2.5 text-base md:text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Asistentes y Fecha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Asistentes estimados
            </label>
            <select
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              className="w-full rounded-xl border border-border/30 bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
            >
              {activeChoice?.attendeeOptions && activeChoice.attendeeOptions.length > 0 ? (
                activeChoice.attendeeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))
              ) : format === 'corporativo' ? (
                <>
                  <option value="10 a 12 asistentes">10 a 12 asistentes</option>
                  <option value="12 a 16 asistentes">12 a 16 asistentes</option>
                  <option value="16 a 20 asistentes">16 a 20 asistentes</option>
                  <option value="Más de 20 asistentes (requiere evaluación)">Más de 20 asistentes</option>
                </>
              ) : (
                <>
                  <option value="6 asistentes">6 asistentes</option>
                  <option value="8 asistentes">8 asistentes</option>
                  <option value="10 asistentes">10 asistentes</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Fecha o mes deseado
            </label>
            <input
              type="text"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              placeholder="Ej. Fines de octubre / fecha exacta"
              className="w-full rounded-xl border border-border/30 bg-background px-3.5 py-2.5 text-base md:text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Notas adicionales */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Contexto del encuentro o requerimientos particulares
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              notesPlaceholder ??
              'Ej. Retiro de directorio anual en Las Condes; requerimos factura exenta/afecta y coordinación técnica de horarios.'
            }
            className="w-full rounded-xl border border-border/30 bg-background px-3.5 py-2.5 text-base md:text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none resize-none"
          />
        </div>

        {sentNotice && (
          <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-xs text-foreground">
            <CheckCircle2 className="w-4 h-4 text-accent-text shrink-0" />
            <span>{sentNotice}</span>
          </div>
        )}

        {/* Acciones principales */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            className="flex-1 inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-primary px-6 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Enviar vía WhatsApp Institucional</span>
          </button>

          <button
            type="button"
            onClick={handleEmail}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border/40 bg-surface-raised/60 px-5 text-xs font-medium uppercase tracking-wider text-foreground hover:border-accent transition-colors"
          >
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>Solicitar vía Correo</span>
          </button>
        </div>

        <p className="text-[0.7rem] text-muted-foreground text-center">
          Canal oficial: {phoneDisplay} · {contactEmail} · Respuesta estimada en menos de 24 horas hábiles.
        </p>
      </form>
    </div>
  );
}
