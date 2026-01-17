
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ArtifactClientView from './ArtifactClientView';

export default async function ArtifactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Fetch Artifact
  const { data: artifact, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !artifact) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-4 text-sm text-[#94A3B8]">
        <Link href="/admin/artifacts" className="hover:text-white flex items-center gap-1 transition-colors">
            <ArrowLeft size={16} />
            Volver a Artefactos
        </Link>
        <span className="text-[#6C757D]">/</span>
        <span className="text-white truncate max-w-xs">{artifact.idea_central}</span>
      </div>

      {/* Interactive Client View */}
      <ArtifactClientView artifact={artifact} />

    </div>
  );
}
