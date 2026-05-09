'use client';

import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { LogOut, User, ShoppingBag, LayoutGrid } from 'lucide-react';

export function PosHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const navItems = [
    { name: 'Catálogo', href: '/pos/catalogo', icon: LayoutGrid },
    { name: 'Carrito', href: '/pos/carrito', icon: ShoppingBag },
  ];

  return (
    <header className="border-b border-stone-900 bg-black/80 backdrop-blur-md px-8 py-5 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-12">
        <Link href="/" className="group flex items-center gap-3">
          <div className="w-8 h-8 bg-[#D4A017] rounded-full flex items-center justify-center font-serif text-black font-bold">O</div>
          <span className="font-serif text-xl tracking-tight text-white group-hover:text-[#D4A017] transition-colors">Campo</span>
        </Link>

        <nav className="hidden md:flex gap-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center gap-2 text-sm font-medium tracking-widest uppercase transition-all ${
                  isActive ? 'text-[#D4A017]' : 'text-stone-500 hover:text-stone-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-6">
        {email ? (
          <div className="flex items-center gap-4 pl-6 border-l border-stone-800">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-tighter text-stone-500 font-bold">Vendedor</span>
              <span className="text-xs text-stone-300 font-medium">{email}</span>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="p-2 text-stone-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link 
            href="/login" 
            className="px-6 py-2 bg-stone-900 text-stone-300 text-sm font-medium rounded-full border border-stone-800 hover:border-[#D4A017]/30 transition-all"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}

