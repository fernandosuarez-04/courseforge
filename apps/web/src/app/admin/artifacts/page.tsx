import { createClient } from '@/utils/supabase/server';
import ArtifactsList from './ArtifactsList';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function ArtifactsPage() {
  const supabase = await createClient();

  // 1. Fetch Artifacts
  const { data: artifacts } = await supabase
    .from('artifacts')
    .select('*, syllabus(state), instructional_plans(state)')
    .order('created_at', { ascending: false });

  // 2. Fetch Profiles related to these artifacts
  const userIds = artifacts ? [...new Set(artifacts.map((a: any) => a.created_by))] : [];
  let profiles: any[] = [];
  
  if (userIds.length > 0) {
    const { data } = await supabase
        .from('profiles')
        .select('id, username, email')
        .in('id', userIds);
    profiles = data || [];
  }

  // 3. Merge data
  const artifactsWithProfiles = artifacts?.map((art: any) => {
      // Supabase returns 1:N relations as arrays
      const syllabus = Array.isArray(art.syllabus) ? art.syllabus[0] : art.syllabus;
      const instructional_plan = Array.isArray(art.instructional_plans) ? art.instructional_plans[0] : art.instructional_plans;

      return {
        ...art,
        syllabus_state: syllabus?.state,
        plan_state: instructional_plan?.state,
        profiles: profiles.find((p: any) => p.id === art.created_by)
      };
  }) || [];

  return (
    <div className="space-y-6">
       {/* Featured Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0A2540] to-[#151A21] p-6 rounded-2xl border border-[#1F5AF6]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#1F5AF6]/10 rounded-full blur-[60px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
          
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white mb-1">Artefactos</h1>
            <p className="text-[#94A3B8] text-sm">Gestiona y supervisa todos los artefactos generados por los usuarios.</p>
          </div>
          <Link href="/admin/artifacts/new" className="relative z-10 bg-[#1F5AF6] hover:bg-[#1a4bd6] text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-[#1F5AF6]/20 group">
             <Plus size={18} className="group-hover:rotate-90 transition-transform" />
             Nuevo Artefacto
          </Link>
       </div>

       {/* Client List Component */}
       <ArtifactsList initialArtifacts={artifactsWithProfiles} currentUserId={(await supabase.auth.getUser()).data.user?.id} />
    </div>
  )
}
