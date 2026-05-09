import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUrlCampo, getUrlTienda } from '../lib/publicUrls';
import { Hexagon, Lock, Mail, User, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { AuthHero } from '../components/auth/AuthHero';
import gsap from 'gsap';

export default function AuthView() {
    const [showForm, setShowForm] = useState(false);
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

    const formRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (showForm) {
            gsap.fromTo(formRef.current, 
                { y: 30, opacity: 0, scale: 0.98 }, 
                { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }
            );
        }
    }, [showForm]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isForgotPassword) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin
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
                    setMessage('Revisa tu correo para confirmar la cuenta.');
                } else {
                    setMessage('¡Registro exitoso!');
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
        <div className="relative min-h-screen w-full flex items-center justify-center bg-negro-tinta overflow-hidden">
            {/* Immersive Background */}
            <div 
                ref={bgRef}
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ 
                    backgroundImage: 'url(/assets/auth-bg.png)',
                    filter: 'brightness(0.4) contrast(1.1)'
                }}
            />
            
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-negro-tinta" style={{ background: 'linear-gradient(to bottom, transparent, var(--negro-tinta))' }} />

            {!showForm ? (
                <AuthHero onStart={() => setShowForm(true)} />
            ) : (
                <div 
                    ref={formRef}
                    className="relative z-10 w-full px-6"
                    style={{ maxWidth: '440px' }}
                >
                    <div className="glass-panel text-center">
                        <div className="mb-8">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-oro-miel-glow mb-6 border border-oro-miel opacity-80" style={{ borderColor: 'rgba(212, 160, 23, 0.3)' }}>
                                <Hexagon size={28} className="text-oro-miel" />
                            </div>
                            <h2 className="font-existencial text-crema-natural mb-2 italic m-0" style={{ fontSize: '2.4rem', lineHeight: 1.1 }}>
                                {isForgotPassword ? 'Recuperar Rastro' : isLogin ? 'Acceso al Núcleo' : 'Iniciar Legado'}
                            </h2>
                            <p className="font-datos text-crema-natural m-0" style={{ opacity: 0.6, fontSize: '0.9rem', letterSpacing: '0.02em', marginTop: '0.5rem' }}>
                                {isForgotPassword ? 'Reestablece tu conexión.' : isLogin ? 'Identifícate para sincronizar.' : 'Crea tu perfil regenerativo.'}
                            </p>
                        </div>

                        {message && (
                            <div className="mb-6 p-4 rounded-xl bg-info/10 border border-info/20 text-info text-center animate-in">
                                {message}
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-salud-riesgo/10 border border-salud-riesgo/20 text-salud-riesgo text-center animate-in">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="flex flex-col gap-6">
                            {!isLogin && !isForgotPassword && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label className="uppercase tracking-widest font-semibold text-crema-natural m-0 text-left" style={{ fontSize: '0.65rem', opacity: 0.7 }}>Nombre Completo</label>
                                        <div className="relative text-left">
                                            <User size={16} className="absolute left-4 top-1/2" style={{ transform: 'translateY(-50%)', opacity: 0.5, color: 'var(--crema-natural)' }} />
                                            <input 
                                                required 
                                                type="text" 
                                                className="input-field"
                                                placeholder="Ej. Cristina Campos" 
                                                value={fullName} 
                                                onChange={e => setFullName(e.target.value)} 
                                                style={{ paddingLeft: '2.8rem' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="uppercase tracking-widest font-semibold text-crema-natural m-0 text-left" style={{ fontSize: '0.65rem', opacity: 0.7 }}>Rol Principal</label>
                                        <div className="relative text-left">
                                            <ShieldCheck size={16} className="absolute left-4 top-1/2" style={{ transform: 'translateY(-50%)', opacity: 0.5, color: 'var(--crema-natural)' }} />
                                            <select 
                                                className="input-field"
                                                value={role} 
                                                onChange={e => setRole(e.target.value)}
                                                style={{ paddingLeft: '2.8rem', appearance: 'none' }}
                                            >
                                                <option value="apicultor" style={{ background: 'var(--negro-tinta)' }}>Apicultor</option>
                                                <option value="vendedor" style={{ background: 'var(--negro-tinta)' }}>Vendedor</option>
                                                <option value="gerente" style={{ background: 'var(--negro-tinta)' }}>Gerente</option>
                                                <option value="logistica" style={{ background: 'var(--negro-tinta)' }}>Logística</option>
                                                <option value="marketing" style={{ background: 'var(--negro-tinta)' }}>Marketing</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="uppercase tracking-widest font-semibold text-crema-natural m-0 text-left" style={{ fontSize: '0.65rem', opacity: 0.7 }}>Email</label>
                                <div className="relative text-left">
                                    <Mail size={16} className="absolute left-4 top-1/2" style={{ transform: 'translateY(-50%)', opacity: 0.5, color: 'var(--crema-natural)' }} />
                                    <input 
                                        required 
                                        type="email" 
                                        className="input-field"
                                        placeholder="correo@ejemplo.com" 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        style={{ paddingLeft: '2.8rem' }}
                                    />
                                </div>
                            </div>

                            {!isForgotPassword && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center mb-1 text-left">
                                        <label className="uppercase tracking-widest font-semibold text-crema-natural m-0" style={{ fontSize: '0.65rem', opacity: 0.7 }}>Contraseña</label>
                                        {isLogin && (
                                            <button 
                                                type="button" 
                                                onClick={() => setIsForgotPassword(true)} 
                                                className="m-0 p-0 bg-transparent border-none text-oro-miel transition-opacity cursor-pointer"
                                                style={{ fontSize: '0.65rem', opacity: 0.8 }}
                                            >
                                                ¿Olvidaste tu clave?
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative text-left">
                                        <Lock size={16} className="absolute left-4 top-1/2" style={{ transform: 'translateY(-50%)', opacity: 0.5, color: 'var(--crema-natural)' }} />
                                        <input 
                                            required 
                                            type="password" 
                                            className="input-field"
                                            placeholder="••••••••" 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                            style={{ paddingLeft: '2.8rem' }}
                                            minLength={6} 
                                        />
                                    </div>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="btn btn-gold w-full py-4 mt-4"
                            >
                                {loading ? 'Procesando...' : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>{isForgotPassword ? 'Enviar Enlace' : isLogin ? 'Entrar al Enjambre' : 'Crear Cuenta'}</span>
                                        <ArrowRight size={18} />
                                    </div>
                                )}
                            </button>

                            {isForgotPassword && (
                                <button 
                                    type="button" 
                                    onClick={() => setIsForgotPassword(false)} 
                                    className="btn btn-ghost text-center text-crema-natural opacity-30"
                                    style={{ fontSize: '0.75rem' }}
                                >
                                    <ArrowLeft size={14} className="mr-2" />
                                    Volver al login
                                </button>
                            )}
                        </form>

                        <div className="mt-8 pt-8 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                            <p className="font-datos text-crema-natural mb-5 m-0" style={{ opacity: 0.5, fontSize: '0.8rem' }}>
                                {isLogin ? '¿Aún no tienes registro?' : '¿Ya eres parte del enjambre?'}
                            </p>
                            <button 
                                onClick={() => { setIsLogin(!isLogin); setPendingConfirmation(false); }}
                                className="btn btn-outline"
                                style={{ borderRadius: '99px', fontSize: '0.75rem', letterSpacing: '0.08em', padding: '0.6rem 2rem', color: 'var(--oro-miel)', borderColor: 'rgba(212, 160, 23, 0.4)' }}
                            >
                                {isLogin ? 'Crear Legado' : 'Iniciar Sesión'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
