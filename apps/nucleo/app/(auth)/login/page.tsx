'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hexagon, Lock, Mail, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { AuthHero } from '@/components/auth/AuthHero';
import { friendlyError } from '@enjambre/ui';
import { supabase } from '@/lib/supabase';
import { useAuthStore, logSecurityEvent, getRoleRedirectPath } from '@enjambre/auth';

export default function LoginPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showForm && formRef.current) {
      import('gsap').then(({ default: gsap }) => {
        gsap.fromTo(formRef.current, { y: 30, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' });
      });
    }
  }, [showForm]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
        if (error) throw error;
        await logSecurityEvent(supabase, { eventType: 'password_reset_requested', email, appSource: 'nucleo' });
        setMessage('Te hemos enviado un enlace para recuperar tu contraseña.');
        setIsForgotPassword(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          await logSecurityEvent(supabase, { eventType: 'login_failed', email, appSource: 'nucleo', details: { code: error.status } });
          throw error;
        }
        await useAuthStore.getState().checkUser();
        const userId = useAuthStore.getState().user?.id;
        await logSecurityEvent(supabase, { eventType: 'login_success', email, userId, appSource: 'nucleo' });
        const userRole = useAuthStore.getState().user?.role ?? 'cliente';
        router.replace(getRoleRedirectPath(userRole));
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        await logSecurityEvent(supabase, {
          eventType: 'signup_success',
          email,
          userId: data.user?.id ?? null,
          appSource: 'nucleo',
          details: { role: 'cliente' },
        });
        if (data.user && !data.session) {
          setMessage('Revisa tu correo para confirmar la cuenta. El acceso al núcleo requiere invitación de un administrador.');
        } else {
          setMessage('Cuenta creada como cliente. El acceso al núcleo requiere que un administrador asigne tu rol.');
          setIsLogin(true);
        }
      }
    } catch (err: unknown) {
      setError(friendlyError(err, 'Error de autenticación'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background overflow-hidden">
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/assets/auth-bg.png)', filter: 'brightness(0.4) contrast(1.1)' }} />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {!showForm ? (
        <AuthHero onStart={() => setShowForm(true)} />
      ) : (
        <div ref={formRef} className="relative z-10 w-full px-6" style={{ maxWidth: '440px' }}>
          <div className="glass-panel text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/15 mb-6 border border-accent/30">
                <Hexagon size={28} className="text-accent" />
              </div>
              <h2 className="font-existencial text-primary-foreground mb-2 italic m-0" style={{ fontSize: '2.4rem', lineHeight: 1.1 }}>
                {isForgotPassword ? 'Recuperar Rastro' : isLogin ? 'Acceso al Núcleo' : 'Iniciar Legado'}
              </h2>
              <p className="font-datos text-muted-foreground m-0" style={{ opacity: 0.6, fontSize: '0.9rem', letterSpacing: '0.02em', marginTop: '0.5rem' }}>
                {isForgotPassword ? 'Reestablece tu conexión.' : isLogin ? 'Identifícate para sincronizar.' : 'Crea tu perfil regenerativo.'}
              </p>
            </div>

            {message && <div className="mb-6 p-4 rounded-xl bg-info/10 border border-info/20 text-info text-center animate-in">{message}</div>}
            {error && <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-center animate-in">{error}</div>}

            <form onSubmit={handleAuth} className="flex flex-col gap-6">
              {!isLogin && !isForgotPassword && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="uppercase tracking-widest font-semibold text-muted-foreground m-0 text-left" style={{ fontSize: '0.65rem', opacity: 0.7 }}>Nombre Completo</label>
                    <div className="relative text-left">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ opacity: 0.5 }} />
                      <input required type="text" className="input-field" placeholder="Ej. Cristina Campos" value={fullName} onChange={e => setFullName(e.target.value)} style={{ paddingLeft: '2.8rem' }} />
                    </div>
                  </div>
                  <p className="text-left text-xs text-muted-foreground leading-relaxed m-0">
                    Las cuentas del núcleo se crean como <strong>cliente</strong>. Un administrador debe asignar tu rol operativo después del registro.
                  </p>
                </>
              )}

              <div className="flex flex-col gap-2">
                <label className="uppercase tracking-widest font-semibold text-muted-foreground m-0 text-left" style={{ fontSize: '0.65rem', opacity: 0.7 }}>Email</label>
                <div className="relative text-left">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ opacity: 0.5 }} />
                  <input required type="email" className="input-field" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} style={{ paddingLeft: '2.8rem' }} />
                </div>
              </div>

              {!isForgotPassword && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-1 text-left">
                    <label className="uppercase tracking-widest font-semibold text-muted-foreground m-0" style={{ fontSize: '0.65rem', opacity: 0.7 }}>Contraseña</label>
                    {isLogin && <button type="button" onClick={() => setIsForgotPassword(true)} className="m-0 p-0 bg-transparent border-none text-accent transition-opacity cursor-pointer" style={{ fontSize: '0.65rem', opacity: 0.8 }}>¿Olvidaste tu clave?</button>}
                  </div>
                  <div className="relative text-left">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ opacity: 0.5 }} />
                    <input required type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: '2.8rem' }} minLength={6} />
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-gold w-full py-4 mt-4">
                {loading ? 'Procesando...' : (
                  <div className="flex items-center justify-center gap-2">
                    <span>{isForgotPassword ? 'Enviar Enlace' : isLogin ? 'Entrar al Enjambre' : 'Crear Cuenta'}</span>
                    <ArrowRight size={18} />
                  </div>
                )}
              </button>

              {isForgotPassword && (
                <button type="button" onClick={() => setIsForgotPassword(false)} className="btn btn-ghost text-center text-muted-foreground opacity-70" style={{ fontSize: '0.75rem' }}>
                  <ArrowLeft size={14} className="mr-2" />Volver al login
                </button>
              )}
            </form>

            <div className="mt-8 pt-8 border-t text-center" style={{ borderColor: 'hsl(var(--border))' }}>
              <p className="font-datos text-muted-foreground mb-5 m-0" style={{ opacity: 0.5, fontSize: '0.8rem' }}>
                {isLogin ? '¿Aún no tienes registro?' : '¿Ya eres parte del enjambre?'}
              </p>
              <button onClick={() => { setIsLogin(!isLogin); }} className="btn btn-outline rounded-full" style={{ fontSize: '0.75rem', letterSpacing: '0.08em', padding: '0.6rem 2rem' }}>
                {isLogin ? 'Crear Legado' : 'Iniciar Sesión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}