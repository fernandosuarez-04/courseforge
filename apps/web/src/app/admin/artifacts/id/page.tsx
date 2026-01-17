
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, CheckCircle2, AlertCircle, BookOpen, Layers, 
  FileText, Clock, RotateCw, Edit3, ChevronDown, ChevronRight 
} from 'lucide-react';

export default async function ArtifactDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  // Fetch Artifact
  const { data: artifact, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !artifact) {
    notFound();
  }

  // Parse Metadata
  const structure = artifact.generation_metadata?.structure || [];
  const validation = artifact.validation_report || { results: [], all_passed: false };
  const research = artifact.generation_metadata?.research_summary || '';

  // Calculate Stats
  const moduleCount = structure.length;
  const lessonCount = structure.reduce((acc: number, mod: any) => acc + (mod.temas?.length || 0), 0);
  
  const statusColors = {
      READY_FOR_QA: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      ESCALATED: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      GENERATING: 'text-blue-400 bg-blue-500/10 border-blue-500/20 animate-pulse',
      APPROVED: 'text-green-400 bg-green-500/10 border-green-500/20'
  };
  
  const currentStatusStyle = statusColors[artifact.state as keyof typeof statusColors] || statusColors.GENERATING;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* 1. Top Navigation & Breadcrumbs */}
      <div className="flex items-center gap-4 text-sm text-[#94A3B8]">
        <Link href="/admin/artifacts" className="hover:text-white flex items-center gap-1 transition-colors">
            <ArrowLeft size={16} />
            Volver a Artefactos
        </Link>
        <span className="text-[#6C757D]">/</span>
        <span className="text-white truncate max-w-xs">{artifact.idea_central}</span>
      </div>

      {/* 2. Main Header Board */}
      <div className="bg-[#151A21] border border-[#6C757D]/10 rounded-2xl p-8 relative overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#1F5AF6]/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-1">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border mb-4 ${currentStatusStyle}`}>
                      {artifact.state === 'READY_FOR_QA' && <CheckCircle2 size={12} />}
                      {artifact.state === 'ESCALATED' && <AlertCircle size={12} />}
                      {artifact.state.replace('_', ' ')}
                  </div>
                  
                  <h1 className="text-3xl font-bold text-white mb-2 leading-tight">{artifact.idea_central}</h1>
                  <p className="text-[#94A3B8] text-lg max-w-3xl">{artifact.descripcion?.texto || artifact.descripcion?.resumen || 'Sin descripción disponible'}</p>
                 
                  {/* Metadata Row */}
                  <div className="flex items-center gap-6 mt-6 text-sm text-[#6C757D]">
                      <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>Actualizado hace momentos</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6C757D]" />
                          <span>ID: {artifact.course_id || artifact.id.slice(0,8)}</span>
                      </div>
                  </div>
              </div>

              {/* Progress/Stats Box */}
              <div className="bg-[#0F1419]/80 backdrop-blur-sm border border-[#6C757D]/20 rounded-xl p-5 min-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-[#94A3B8] text-xs uppercase tracking-wider font-bold">Progreso</span>
                      <span className="text-[#00D4B3] text-xs font-mono">STEP 1/2</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#2D333B] rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-[#00D4B3] w-1/2 rounded-full" />
                  </div>
                  <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                          <span className="text-white font-medium">Investigación</span>
                          <CheckCircle2 size={16} className="text-[#00D4B3]" />
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-white font-medium">Estructura</span>
                          <CheckCircle2 size={16} className="text-[#00D4B3]" />
                      </div>
                      <div className="flex justify-between text-sm opacity-50">
                          <span className="text-[#94A3B8]">Contenido</span>
                          <span className="text-[10px] border border-[#6C757D] rounded px-1">PEND</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* 3. Stepper Visualization */}
      <div className="hidden md:flex items-center justify-between px-10 py-6 bg-[#151A21] border border-[#6C757D]/10 rounded-2xl">
           <StepItem step={1} label="Base" status="completed" />
           <StepConnector status="completed" />
           <StepItem step={2} label="Temario" status="active" />
           <StepConnector status="pending" />
           <StepItem step={3} label="Plan" status="pending" />
           <StepConnector status="pending" />
           <StepItem step={4} label="Fuentes" status="pending" />
           <StepConnector status="pending" />
           <StepItem step={5} label="Materiales" status="pending" />
      </div>

      {/* 4. Validation Report & Structure Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Structure */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* Structure Header Card */}
              <div className="bg-[#151A21] border border-[#1F5AF6]/20 rounded-2xl p-6 flex items-center justify-between shadow-[0_0_40px_-20px_rgba(31,90,246,0.3)]">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#1F5AF6] flex items-center justify-center text-white shadow-lg shadow-[#1F5AF6]/30">
                          <BookOpen size={24} />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-white mb-0.5">Temario Estructurado</h2>
                          <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                              <span>{moduleCount} módulos</span>
                              <span>•</span>
                              <span>{lessonCount} lecciones</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2 ${artifact.state === 'READY_FOR_QA' ? 'bg-[#00D4B3]/10 text-[#00D4B3] border-[#00D4B3]/20' : 'bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/20'}`}>
                           {artifact.state === 'READY_FOR_QA' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                           {artifact.state === 'READY_FOR_QA' ? 'Validación OK' : 'Revisar Alertas'}
                      </div>
                      <button className="px-4 py-2 rounded-lg bg-[#2D333B] hover:bg-[#38414D] text-white text-sm font-medium transition-colors border border-[#6C757D]/20 flex items-center gap-2">
                          <Edit3 size={14} />
                          Modo Edición
                      </button>
                  </div>
              </div>

              {/* Modules List */}
              <div className="space-y-4">
                  {structure.map((mod: any, idx: number) => (
                      <div key={idx} className="group bg-[#151A21] border border-[#6C757D]/10 rounded-xl overflow-hidden hover:border-[#6C757D]/30 transition-all">
                          <div className="p-4 flex items-start gap-4">
                              <div className="w-8 h-8 rounded-lg bg-[#2D333B] flex items-center justify-center text-[#94A3B8] font-mono text-sm group-hover:bg-[#1F5AF6]/10 group-hover:text-[#1F5AF6] transition-colors shrink-0">
                                  {idx + 1}
                              </div>
                              <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                      <h3 className="text-white font-medium text-lg leading-snug">{mod.titulo}</h3>
                                      <span className="text-xs font-mono text-[#6C757D] bg-[#0F1419] px-2 py-1 rounded border border-[#6C757D]/10">
                                          {(mod.temas || []).length} lecciones
                                      </span>
                                  </div>
                                  
                                  {/* Themes List (Preview) */}
                                  <div className="pl-4 border-l-2 border-[#2D333B] space-y-2 mt-3">
                                      {(mod.temas || []).map((tema: string, tIdx: number) => (
                                          <div key={tIdx} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                                              <div className="w-1.5 h-1.5 rounded-full bg-[#6C757D]/50 mt-1.5 shrink-0" />
                                              <span>{tema}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}

                  {structure.length === 0 && (
                      <div className="p-10 text-center border border-dashed border-[#6C757D]/20 rounded-xl">
                          <p className="text-[#94A3B8]">No hay estructura generada aún.</p>
                      </div>
                  )}
              </div>

          </div>

          {/* Sidebar: Validation & Objectives */}
          <div className="space-y-6">
              
              {/* Validation Panel */}
              <div className="bg-[#0F1419] border border-[#6C757D]/10 rounded-2xl p-5">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#00D4B3]" />
                      Validaciones Automáticas
                  </h3>
                  
                  <div className="space-y-3">
                      {validation.results?.map((res: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#151A21] transition-colors">
                               <div className={`mt-0.5 ${res.passed ? 'text-[#00D4B3]' : 'text-[#EF4444]'}`}>
                                   {res.passed ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                               </div>
                               <div>
                                   <p className={`text-xs font-medium leading-tight ${res.passed ? 'text-[#E9ECEF]' : 'text-[#EF4444]'}`}>
                                       [{res.code}] {res.message}
                                   </p>
                                   <p className="text-[10px] text-[#6C757D] mt-0.5">Automated Check</p>
                               </div>
                          </div>
                      ))}
                      {(!validation.results || validation.results.length === 0) && (
                          <p className="text-xs text-[#6C757D]">No hay reporte de validación disponible.</p>
                      )}
                  </div>
              </div>

              {/* Research Summary Panel */}
              {research && (
                  <div className="bg-[#151A21] border border-[#6C757D]/10 rounded-2xl p-5">
                      <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Layers size={16} className="text-[#1F5AF6]" />
                          Research Context
                      </h3>
                      <div className="text-xs text-[#94A3B8] leading-relaxed max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2D333B] pr-2">
                          {research}
                      </div>
                  </div>
              )}

              {/* Bloom Objectives */}
              <div className="bg-[#151A21] border border-[#6C757D]/10 rounded-2xl p-5">
                   <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                          <TargetIcon />
                          Objetivos de Aprendizaje
                   </h3>
                   <ul className="space-y-2">
                       {(artifact.objetivos || []).map((obj: string, i: number) => (
                           <li key={i} className="text-xs text-[#E9ECEF] flex gap-2">
                               <span className="text-[#1F5AF6] font-bold">•</span>
                               {obj}
                           </li>
                       ))}
                   </ul>
              </div>

          </div>

      </div>
    </div>
  );
}

// Helper Components for Stepper
function StepItem({ step, label, status }: { step: number, label: string, status: 'completed' | 'active' | 'pending' }) {
    let bg = 'bg-[#2D333B]';
    let text = 'text-[#6C757D]';
    let icon = <span className="font-mono text-xs">{step}</span>;

    if (status === 'completed') {
        bg = 'bg-[#00D4B3]';
        text = 'text-[#0F1419]';
        icon = <CheckCircle2 size={14} />;
    } else if (status === 'active') {
        bg = 'bg-[#1F5AF6]';
        text = 'text-white';
        icon = <BookOpen size={14} />;
    }

    return (
        <div className="flex flex-col items-center gap-2 z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${bg} ${status === 'completed' ? 'text-black' : 'text-white'}`}>
                {icon}
            </div>
            <span className={`text-xs font-medium uppercase tracking-wide ${status === 'active' ? 'text-[#1F5AF6]' : 'text-[#6C757D]'}`}>{label}</span>
        </div>
    )
}

function StepConnector({ status }: { status: 'completed' | 'active' | 'pending' }) {
    const color = status === 'completed' ? 'bg-[#00D4B3]' : status === 'active' ? 'bg-[#1F5AF6]' : 'bg-[#2D333B]';
    return (
        <div className={`h-0.5 flex-1 mx-4 rounded-full ${color}`} />
    )
}

function TargetIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F59E0B]"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
    )
}
