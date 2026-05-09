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
                { y: 50, opacity: 0, scale: 0.95 }, 
                { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power4.out' }
            );
            gsap.to(bgRef.current, { scale: 1.05, duration: 10, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        }
    }, [showForm]);

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
        <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-negro-tinta">
            {/* Immersive Background */}
            <div 
                ref={bgRef}
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ 
                    backgroundImage: 'url(/assets/auth-bg.png)',
                    filter: 'brightness(0.5) contrast(1.1)'
                }}
            />
            
            {/* Gradient Overlays */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-negro-tinta/40 to-negro-tinta" />
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

            {!showForm ? (
                <AuthHero onStart={() => setShowForm(true)} />
            ) : (
                <div 
                    ref={formRef}
                    className="relative z-10 w-full max-w-[440px] px-6 py-12"
                >
                    <div className="glass-panel p-8 md:p-10 rounded-[2rem] border border-glass-border shadow-2xl backdrop-blur-xl relative overflow-hidden">
                        {/* Shine Effect */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 bg-glass-shine" />

                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-oro-miel-glow border border-oro-miel/20 mb-6 animate-pulse">
                                <Hexagon size={28} className="text-oro-miel" />
                            </div>
                            <h2 className="text-3xl font-existencial text-crema-natural mb-2 italic">
                                {isForgotPassword ? 'Recuperar Rastro' : isLogin ? 'Acceso al Núcleo' : 'Iniciar Legado'}
                            </h2>
                            <p className="text-sm text-crema-natural/60 font-datos tracking-wide">
                                {isForgotPassword ? 'Reestablece tu conexión con el enjambre.' : isLogin ? 'Identifícate para sincronizar tus datos.' : 'Crea tu perfil en el ecosistema regenerativo.'}
                            </p>
                        </div>

                        {message && (
                            <div className="mb-6 p-4 rounded-xl bg-info/10 border border-info/20 text-info text-xs text-center animate-in">
                                {message}
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-salud-riesgo/10 border border-salud-riesgo/20 text-salud-riesgo text-xs text-center animate-in">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-5">
                            {!isLogin && !isForgotPassword && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-[0.7rem] uppercase tracking-widest font-semibold text-crema-natural/40 ml-1">Nombre Completo</label>
                                        <div className="relative group">
                                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-crema-natural/30 group-focus-within:text-oro-miel transition-colors" />
                                            <input 
                                                required 
                                                type="text" 
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-crema-natural placeholder:text-crema-natural/20 focus:outline-none focus:border-oro-miel/50 focus:bg-white/10 transition-all text-sm"
                                                placeholder="Ej. Cristina Campos" 
                                                value={fullName} 
                                                onChange={e => setFullName(e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[0.7rem] uppercase tracking-widest font-semibold text-crema-natural/40 ml-1">Rol Principal</label>
                                        <div className="relative group">
                                            <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-crema-natural/30 group-focus-within:text-oro-miel transition-colors" />
                                            <select 
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-crema-natural focus:outline-none focus:border-oro-miel/50 focus:bg-white/10 transition-all text-sm appearance-none cursor-pointer"
                                                value={role} 
                                                onChange={e => setRole(e.target.value)}
                                            >
                                                <option value="apicultor" className="bg-negro-suave">Apicultor</option>
                                                <option value="vendedor" className="bg-negro-suave">Vendedor</option>
                                                <option value="gerente" className="bg-negro-suave">Gerente</option>
                                                <option value="logistica" className="bg-negro-suave">Logística</option>
                                                <option value="marketing" className="bg-negro-suave">Marketing</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[0.7rem] uppercase tracking-widest font-semibold text-crema-natural/40 ml-1">Email</label>
                                <div className="relative group">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-crema-natural/30 group-focus-within:text-oro-miel transition-colors" />
                                    <input 
                                        required 
                                        type="email" 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-crema-natural placeholder:text-crema-natural/20 focus:outline-none focus:border-oro-miel/50 focus:bg-white/10 transition-all text-sm"
                                        placeholder="correo@ejemplo.com" 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                    />
                                </div>
                            </div>

                            {!isForgotPassword && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <label className="text-[0.7rem] uppercase tracking-widest font-semibold text-crema-natural/40 ml-1">Contraseña</label>
                                        {isLogin && (
                                            <button 
                                                type="button" 
                                                onClick={() => setIsForgotPassword(true)} 
                                                className="text-[0.65rem] text-oro-miel/60 hover:text-oro-miel transition-colors font-medium"
                                            >
                                                ¿Olvidaste tu clave?
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-crema-natural/30 group-focus-within:text-oro-miel transition-colors" />
                                        <input 
                                            required 
                                            type="password" 
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-crema-natural placeholder:text-crema-natural/20 focus:outline-none focus:border-oro-miel/50 focus:bg-white/10 transition-all text-sm"
                                            placeholder="••••••••" 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                            minLength={6} 
                                        />
                                    </div>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-4 bg-oro-miel hover:bg-oro-miel-light text-bosque-ulmo-dark font-bold text-sm rounded-xl shadow-lg shadow-oro-miel/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
                            >
                                {loading ? 'Sincronizando...' : (
                                    <>
                                        <span>{isForgotPassword ? 'Enviar Enlace' : isLogin ? 'Entrar al Enjambre' : 'Crear Cuenta'}</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>

                            {isForgotPassword && (
                                <button 
                                    type="button" 
                                    onClick={() => setIsForgotPassword(false)} 
                                    className="w-full text-[0.75rem] text-crema-natural/40 hover:text-crema-natural transition-colors flex items-center justify-center gap-2 mt-2"
                                >
                                    <ArrowLeft size={14} />
                                    Volver al login
                                </button>
                            )}
                        </form>

                        <div className="mt-10 pt-8 border-t border-white/5 text-center">
                            <p className="text-xs text-crema-natural/40 mb-4">
                                {isLogin ? '¿Aún no tienes registro?' : '¿Ya eres parte del enjambre?'}
                            </p>
                            <button 
                                onClick={() => { setIsLogin(!isLogin); setPendingConfirmation(false); }}
                                className="px-6 py-2 rounded-full border border-oro-miel/20 text-oro-miel text-[0.7rem] font-bold uppercase tracking-widest hover:bg-oro-miel/10 transition-all"
                            >
                                {isLogin ? 'Crear Legado' : 'Iniciar Sesión'}
                            </button>
                        </div>

                        {/* Ecosystem Links */}
                        <div className="mt-8 flex justify-center gap-6 opacity-30 hover:opacity-60 transition-opacity duration-500">
                            {getUrlTienda() && (
                                <a href={getUrlTienda()} target="_blank" rel="noopener noreferrer" className="text-[0.6rem] uppercase tracking-widest font-bold text-crema-natural hover:text-oro-miel transition-colors">Tienda</a>
                            )}
                            {getUrlCampo() && (
                                <a href={getUrlCampo()} target="_blank" rel="noopener noreferrer" className="text-[0.6rem] uppercase tracking-widest font-bold text-crema-natural hover:text-oro-miel transition-colors">POS</a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .glass-panel {
                    background: rgba(10, 61, 47, 0.4);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                }
                .animate-in {
                    animation: fadeIn 0.8s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
}
