import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUrlCampo, getUrlTienda } from '../lib/publicUrls';
import { Hexagon, Lock, Mail, User, ShieldCheck } from 'lucide-react';

export default function AuthView() {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('apicultor');
    const [pendingConfirmation, setPendingConfirmation] = useState(false);

    const handleResendConfirmation = async () => {
        if (!email.trim()) {
            setError('Ingresa el correo con el que te registraste.');
            return;
        }
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
            if (error) throw error;
            setMessage('Te enviamos de nuevo el correo de confirmación.');
        } catch (err: unknown) {
            const e = err as { message?: string };
            setError(e?.message || 'No se pudo reenviar el correo.');
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isForgotPassword) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin // Ensure they come back to the app
                });
                if (error) throw error;
                setMessage('Te hemos enviado un enlace para recuperar tu contraseña.');
                setIsForgotPassword(false);
            } else if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                setPendingConfirmation(false);
            } else {
                if (password.length < 8) {
                    setError('La contraseña debe tener al menos 8 caracteres.');
                    setLoading(false);
                    return;
                }
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            role: role,
                        }
                    }
                });
                if (error) throw error;
                if (data.user && !data.session) {
                    setPendingConfirmation(true);
                    setMessage('Revisa tu correo para confirmar la cuenta antes de iniciar sesión.');
                } else {
                    setMessage('¡Registro exitoso! Ya puedes iniciar sesión.');
                    setIsLogin(true);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Error de autenticación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-app)',
            padding: 'var(--space-md)'
        }}>
            <div className="card animate-in delay-2" style={{ maxWidth: 420, width: '100%', padding: 'var(--space-xl)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <div style={{
                        width: 50, height: 50, borderRadius: 16, background: 'var(--oro-miel-glow)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-md)'
                    }}>
                        <Hexagon size={28} style={{ color: 'var(--oro-miel-dark)' }} />
                    </div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--bosque-ulmo)', marginBottom: 8 }}>
                        {isForgotPassword ? 'Recuperar Acceso' : isLogin ? 'Acceso al Bosque' : 'Tu Legado Inicia Aquí'}
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {isForgotPassword ? 'Ingresa tu correo para recibir un enlace seguro.' : isLogin ? 'Ingresa tus credenciales para continuar.' : 'Crea una cuenta para registrar tu rastro.'}
                    </p>
                </div>

                {message && (
                    <div style={{ padding: 'var(--space-sm) var(--space-md)', background: 'rgba(52,152,219,0.1)', color: '#2980b9', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', marginBottom: 'var(--space-md)', textAlign: 'center' }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={{ padding: 'var(--space-sm) var(--space-md)', background: 'rgba(231,76,60,0.1)', color: 'var(--salud-riesgo)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', marginBottom: 'var(--space-md)', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {!isLogin && (
                        <>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Nombre Completo</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                                    <input required type="text" className="input-field" placeholder="Ej. Cristina Campos" value={fullName} onChange={e => setFullName(e.target.value)} style={{ paddingLeft: 38 }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Rol Principal</label>
                                <div style={{ position: 'relative' }}>
                                    <ShieldCheck size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                                    <select className="input-field" value={role} onChange={e => setRole(e.target.value)} style={{ paddingLeft: 38 }}>
                                        <option value="apicultor">Apicultor (Producción)</option>
                                        <option value="vendedor">Vendedor (Distribución)</option>
                                        <option value="gerente">Gerente Ejecutivo</option>
                                        <option value="logistica">Logística y Rutas</option>
                                        <option value="marketing">Marketing y Comunidad</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                            <input required type="email" className="input-field" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} style={{ paddingLeft: 38 }} />
                        </div>
                    </div>

                    {!isForgotPassword && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Contraseña</label>
                                {isLogin && (
                                    <button type="button" onClick={() => setIsForgotPassword(true)} style={{ background: 'none', border: 'none', fontSize: '0.7rem', color: 'var(--oro-miel-dark)', cursor: 'pointer', padding: 0 }}>
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                )}
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                                <input required type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: 38 }} minLength={6} />
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-sm)', width: '100%', justifyContent: 'center' }} disabled={loading}>
                        {loading ? 'Procesando...' : isForgotPassword ? 'Enviar Enlace' : isLogin ? 'Entrar al Enjambre' : 'Crear Cuenta'}
                    </button>

                    {isForgotPassword && (
                        <button type="button" onClick={() => setIsForgotPassword(false)} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '-8px' }}>
                            Volver al login
                        </button>
                    )}

                </form>

                {pendingConfirmation && (
                    <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
                        <button type="button" className="btn btn-outline btn-sm" disabled={loading} onClick={handleResendConfirmation}>
                            Reenviar correo de confirmación
                        </button>
                    </div>
                )}

                {!isForgotPassword && (
                    <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes una cuenta? '}
                        </span>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setIsLogin(!isLogin); setPendingConfirmation(false); }} style={{ padding: 4, height: 'auto', fontWeight: 600, color: 'var(--oro-miel-dark)' }}>
                            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                        </button>
                    </div>
                )}

                {(getUrlTienda() || getUrlCampo()) && (
                    <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid rgba(10,61,47,0.08)', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <div style={{ marginBottom: 8, fontWeight: 600, color: 'var(--bosque-ulmo)', fontSize: '0.72rem', letterSpacing: '0.06em' }}>ECOSISTEMA</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--space-md)' }}>
                            {getUrlTienda() && (
                                <a href={getUrlTienda()} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--oro-miel-dark)', fontWeight: 500 }}>
                                    Tienda web
                                </a>
                            )}
                            {getUrlCampo() && (
                                <a href={getUrlCampo()} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--oro-miel-dark)', fontWeight: 500 }}>
                                    Terminal Campo (POS)
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
