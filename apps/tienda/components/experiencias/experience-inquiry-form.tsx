'use client';

import { useState, type FormEvent } from 'react';
import { Send, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';

const OYZ_WHATSAPP_NUMBER = '56940831358';
const OYZ_CONTACT_EMAIL = 'obrerayzangano@gmail.com';

export interface ExperienceInquiryFormProps {
  initialFormat?: 'corporativo' | 'intimo';
}

export function ExperienceInquiryForm({ initialFormat = 'corporativo' }: ExperienceInquiryFormProps) {
  const [format, setFormat] = useState<'corporativo' | 'intimo'>(initialFormat);
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [attendees, setAttendees] = useState(format === 'corporativo' ? '10 a 15 asistentes' : '6 a 8 asistentes');
  const [timeframe, setTimeframe] = useState('');
  const [notes, setNotes] = useState('');
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  const formatTitle =
    format === 'corporativo'
      ? 'Encuentro Corporativo & Directorios (10–20 personas)'
      : 'Encuentro Íntimo & Residencia (6–10 personas)';

  const buildMessageBody = () => {
    const lines = [
      'SOLICITUD DE EXPERIENCIA · LA OBRERA Y EL ZÁNGANO',
      'Formato: Floraciones del Bosque Austral',
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

  const handleWhatsApp = (e: FormEvent) => {
    e.preventDefault();
    const body = buildMessageBody();
    const url = `https://wa.me/${OYZ_WHATSAPP_NUMBER}?text=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSentNotice('Abriendo WhatsApp institucional de La Obrera y el Zángano...');
  };

  const handleEmail = () => {
    const body = buildMessageBody();
    const subject = `Solicitud de Sesión: ${formatTitle} — ${organization || name || 'Reserva'}`;
    const url = `mailto:${OYZ_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    setSentNotice('Abriendo cliente de correo...');
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-surface-raised/40 p-6 sm:p-8 backdrop-blur-sm">
      <div className="mb-6 border-b border-border/20 pb-4">
        <span className="block text-[0.65rem] uppercase tracking-[0.3em] text-accent-text mb-1">
          Coordinación directa
        </span>
        <h3 className="font-display text-2xl font-light text-foreground">
          Solicitar fecha o propuesta formal
        </h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Sin registro de usuario ni claves. Tu requerimiento llega directamente a la coordinación de
          agenda de Cristina Miranda.
        </p>
      </div>

      <form onSubmit={handleWhatsApp} className="space-y-5">
        {/* Selector de formato */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Tipo de encuentro
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setFormat('corporativo');
                setAttendees('10 a 15 asistentes');
              }}
              className={`rounded-xl border p-3 text-left transition-colors ${
                format === 'corporativo'
                  ? 'border-accent bg-accent/10 text-foreground'
                  : 'border-border/30 bg-background/50 text-muted-foreground hover:border-border'
              }`}
            >
              <div className="text-xs font-semibold text-foreground">Corporativo & Directorios</div>
              <div className="text-[0.7rem] text-muted-foreground mt-0.5">10 a 20 personas · Oficinas / Salón</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormat('intimo');
                setAttendees('6 a 8 asistentes');
              }}
              className={`rounded-xl border p-3 text-left transition-colors ${
                format === 'intimo'
                  ? 'border-accent bg-accent/10 text-foreground'
                  : 'border-border/30 bg-background/50 text-muted-foreground hover:border-border'
              }`}
            >
              <div className="text-xs font-semibold text-foreground">Íntimo & Residencia</div>
              <div className="text-[0.7rem] text-muted-foreground mt-0.5">6 a 10 personas · Domicilio privado</div>
            </button>
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
              className="w-full rounded-xl border border-border/30 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
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
              className="w-full rounded-xl border border-border/30 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
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
              placeholder="+56 9 1234 5678"
              className="w-full rounded-xl border border-border/30 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
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
              className="w-full rounded-xl border border-border/30 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
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
              {format === 'corporativo' ? (
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
              className="w-full rounded-xl border border-border/30 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
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
            placeholder="Ej. Retiro de directorio anual en Las Condes; requerimos factura exenta/afecta y coordinación técnica de horarios."
            className="w-full rounded-xl border border-border/30 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none resize-none"
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
          Canal oficial: +56 9 4083 1358 · obrerayzangano@gmail.com · Respuesta estimada en menos de 24 horas hábiles.
        </p>
      </form>
    </div>
  );
}
