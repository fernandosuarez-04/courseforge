import { createClient } from '@/utils/supabase/server';
import { ArrowUpRight, Users, Code, Activity, Server, UserPlus } from 'lucide-react';

export default async function AdminPage() {
  const supabase = await createClient();

  // Fetch Stats
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  // Mock data for unimplemented features
  const artifactsCount = 0; 

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Visión General</h1>
        <p className="text-[#94A3B8]">Bienvenido al centro de control de CourseGen.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Usuarios Totales" 
          val={totalUsers?.toLocaleString() || "0"} 
          trend="Actualizado" 
          icon={<Users className="text-[#00D4B3]" size={24} />} 
        />
        <StatCard 
          title="Artefactos Generados" 
          val={artifactsCount.toLocaleString()} 
          trend="--%" 
          positive={true}
          icon={<Code className="text-[#1F5AF6]" size={24} />} 
        />
        <StatCard 
          title="Actividad del Sistema" 
          val="100%" 
          trend="Stable" 
          icon={<Activity className="text-purple-400" size={24} />} 
        />
        <StatCard 
          title="Carga de Servidor" 
          val="Baja" 
          trend="Optimo" 
          positive={true} 
          icon={<Server className="text-orange-400" size={24} />} 
        />
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity (Wide) */}
        <div className="lg:col-span-2 bg-[#151A21] border border-[#6C757D]/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Usuarios Recientes</h3>
            <button className="text-sm text-[#00D4B3] hover:underline">Ver todo</button>
          </div>
          <div className="space-y-4">
            {recentUsers?.map((user) => (
              <div key={user.id} className="flex items-center gap-4 p-3 hover:bg-[#1E2329] rounded-xl transition-colors cursor-default group">
                <div className="w-10 h-10 rounded-full bg-[#00D4B3]/10 flex items-center justify-center text-[#00D4B3]">
                  <UserPlus size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white group-hover:text-[#00D4B3] transition-colors">
                    {user.first_name} {user.last_name_father} ({user.username || 'Sin usuario'})
                  </p>
                  <p className="text-xs text-[#94A3B8]">{user.email}</p>
                </div>
                <div className="text-xs text-[#6C757D]">{timeAgo(user.created_at)}</div>
              </div>
            ))}
            
            {recentUsers?.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No hay usuarios registrados.</p>
            )}
          </div>
        </div>

        {/* Quick Actions / System Status */}
        <div className="space-y-6">
             {/* Create Artifact Widget */}
            <div className="bg-[#0A2540] border border-[#1F5AF6]/30 rounded-2xl p-6 relative overflow-hidden group hover:border-[#1F5AF6] transition-all cursor-pointer">
                <div className="absolute top-[-20%] right-[-20%] w-[150px] h-[150px] bg-[#1F5AF6]/20 rounded-full blur-[40px]" />
                <h3 className="text-lg font-bold text-white mb-2 relative z-10">Nuevo Artefacto</h3>
                <p className="text-sm text-[#94A3B8] mb-4 relative z-10">Crear un nuevo componente o curso manualmente.</p>
                <div className="w-10 h-10 bg-[#1F5AF6] rounded-full flex items-center justify-center text-white relative z-10 group-hover:scale-110 transition-transform">
                     <ArrowUpRight size={20} />
                </div>
            </div>

            {/* System Health */}
            <div className="bg-[#151A21] border border-[#6C757D]/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Estado de Servicios</h3>
                <div className="space-y-3">
                    <StatusItem label="Base de Datos (Supabase)" status="active" />
                    <StatusItem label="API Gateway" status="active" />
                    <StatusItem label="Generación IA (Gemini)" status="active" />
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `Hace ${seconds} seg`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} días`;
}

function StatCard({ title, val, trend, icon, positive = true }: any) {
    return (
        <div className="bg-[#151A21] border border-[#6C757D]/10 rounded-2xl p-5 hover:border-[#6C757D]/30 transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-[#0F1419] rounded-lg border border-[#6C757D]/10">
                    {icon}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${positive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {trend}
                </span>
            </div>
            <div>
                <p className="text-sm text-[#94A3B8] mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-white">{val}</h3>
            </div>
        </div>
    )
}

function StatusItem({ label, status }: { label: string, status: 'active' | 'down' }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-[#94A3B8]">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-green-400">Operativo</span>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
        </div>
    )
}
