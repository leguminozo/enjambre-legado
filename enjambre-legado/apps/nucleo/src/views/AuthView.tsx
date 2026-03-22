import { useState } from 'react';
import { supabase } from '../lib/supabase';
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
            } else {
                const { error } = await supabase.auth.signUp({
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
                // Auto login might happen, or they might need to confirm email depending on Supabase settings
                if (error) throw error;
                setMessage('¡Registro exitoso! Por favor revisa tu correo o inicia sesión.');
                setIsLogin(true);
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

                {!isForgotPassword && (
                    <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes una cuenta? '}
                        </span>
                        <button className="btn btn-ghost btn-sm" onClick={() => setIsLogin(!isLogin)} style={{ padding: 4, height: 'auto', fontWeight: 600, color: 'var(--oro-miel-dark)' }}>
                            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
