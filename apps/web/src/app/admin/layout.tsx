import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { LogOut } from 'lucide-react';
import Image from 'next/image';
import { logoutAction } from '../login/actions';
import SidebarNav from './SidebarNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Verificar Sesión
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 2. Verificar Rol de Admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('platform_role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.platform_role !== 'ADMIN') {
    // Si no es admin, redirigir al dashboard de usuario normal
    redirect('/dashboard?error=unauthorized');
  }

  return (
    <div className="min-h-screen bg-[#0F1419] flex font-sans text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#151A21] border-r border-[#6C757D]/10 flex flex-col fixed h-full z-20">
        <div className="p-6 flex items-center gap-3 border-b border-[#6C757D]/10">
          <div className="w-10 h-10 relative">
             <Image src="/Logo.png" alt="Admin" fill className="object-contain" />
          </div>
          <span className="font-bold text-lg tracking-tight">Admin<span className="text-[#00D4B3]">Panel</span></span>
        </div>

        {/* Dynamic Sidebar Navigation */}
        <SidebarNav />

        <div className="p-4 border-t border-[#6C757D]/10">
          <UserProfile userEmail={user.email} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

function UserProfile({ userEmail }: { userEmail?: string }) {
    return (
        <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-[#00D4B3]/20 flex items-center justify-center text-[#00D4B3] text-xs font-bold">
                AD
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="text-xs text-white truncate font-medium">Administrador</p>
                <p className="text-[10px] text-[#94A3B8] truncate">{userEmail}</p>
            </div>
            <form action={logoutAction}>
                <button type="submit" className="text-[#94A3B8] hover:text-red-400 transition-colors" title="Cerrar Sesión">
                    <LogOut size={16} />
                </button>
            </form>
        </div>
    )
}
