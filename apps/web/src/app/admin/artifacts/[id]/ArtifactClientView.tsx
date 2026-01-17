'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, AlertCircle, BookOpen, Layers, 
  FileText, Clock, Edit3, ChevronDown, ChevronRight, Target, Layout, List, RotateCw,
  Save, X, Plus, Trash2, Edit2
} from 'lucide-react';
import Link from 'next/link';
import { regenerateArtifactAction, updateArtifactContentAction } from '../actions';
import { useRouter } from 'next/navigation';

// ... imports

export default function ArtifactClientView({ artifact }: { artifact: any }) {
  const [activeTab, setActiveTab] = useState<'content' | 'validation'>('content');
  const [currentStep, setCurrentStep] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [reviewState, setReviewState] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' });
  const router = useRouter();

  // EDITING STATE
  const [editingSection, setEditingSection] = useState<'nombres' | 'objetivos' | 'descripcion' | null>(null);
  const [editedContent, setEditedContent] = useState({
      nombres: artifact.nombres || [],
      objetivos: artifact.objetivos || [],
      descripcion: {
          texto: artifact.descripcion?.texto || artifact.descripcion?.resumen || '',
          publico_objetivo: artifact.descripcion?.publico_objetivo || '',
          beneficios: artifact.descripcion?.beneficios || ''
      }
  });

  // Sync with server artifact on load/refresh
  useEffect(() => {
      setEditedContent({
          nombres: artifact.nombres || [],
          objetivos: artifact.objetivos || [],
          descripcion: {
              texto: artifact.descripcion?.texto || artifact.descripcion?.resumen || '',
              publico_objetivo: artifact.descripcion?.publico_objetivo || '',
              beneficios: artifact.descripcion?.beneficios || ''
          }
      });
  }, [artifact]);

  const structure = artifact.generation_metadata?.structure || [];
  const validation = artifact.validation_report || { results: [], all_passed: false };
  const research = artifact.generation_metadata?.research_summary || '';
  
  const statusColors: any = {
      READY_FOR_QA: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      ESCALATED: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      GENERATING: 'text-blue-400 bg-blue-500/10 border-blue-500/20 animate-pulse',
      APPROVED: 'text-green-400 bg-green-500/10 border-green-500/20'
  };
  const currentStatusStyle = statusColors[artifact.state] || statusColors.GENERATING;

  // Auto-refresh polling when generating
  useEffect(() => {
      if (artifact.state === 'GENERATING' || isRegenerating) {
          const interval = setInterval(() => {
              console.log('Polling artifact status...');
              router.refresh();
          }, 3000);
          return () => clearInterval(interval);
      }
  }, [artifact.state, isRegenerating, router]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const handleRegenerate = async () => {
      setIsRegenerating(true);
      try {
          await regenerateArtifactAction(artifact.id, feedback);
          showToast('Regeneración iniciada. El contenido se actualizará en breve.', 'info');
          setReviewState('pending');
          setFeedback('');
          router.refresh();
      } catch (e) {
          showToast('Error al regenerar el contenido.', 'error');
      } finally {
          setIsRegenerating(false);
      }
  };

  const handleSaveContent = async () => {
      if (!editingSection) return;
      
      const updates: any = {};
      if (editingSection === 'nombres') updates.nombres = editedContent.nombres;
      if (editingSection === 'objetivos') updates.objetivos = editedContent.objetivos;
      if (editingSection === 'descripcion') updates.descripcion = editedContent.descripcion;

      try {
          const res = await updateArtifactContentAction(artifact.id, updates);
          if (res.success) {
              showToast('Cambios guardados correctamente', 'success');
              setEditingSection(null);
              router.refresh();
          } else {
              showToast('Error al guardar cambios', 'error');
          }
      } catch (e) {
          showToast('Error de conexión', 'error');
      }
  };

  const HeaderAction = ({ section }: { section: 'nombres' | 'objetivos' | 'descripcion' }) => {
      if (editingSection === section) {
          return (
              <div className="flex items-center gap-2">
                  <button onClick={() => setEditingSection(null)} className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors"><X size={18} /></button>
                  <button onClick={handleSaveContent} className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg transition-colors"><Save size={18} /></button>
              </div>
          );
      }
      return (
          <button onClick={() => setEditingSection(section)} className="p-2 bg-[#1F5AF6]/10 hover:bg-[#1F5AF6]/20 text-[#1F5AF6] border border-[#1F5AF6]/20 rounded-lg transition-colors group" title="Editar sección">
              <Edit2 size={16} className="group-hover:scale-110 transition-transform" />
          </button>
      );
  };

  return (
    <div className="space-y-8 relative">
       {/* TOAST COMPONENT */}
       {toast.show && (
           <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
               <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
                   toast.type === 'success' ? 'bg-[#00D4B3]/10 border-[#00D4B3]/20 text-[#00D4B3]' :
                   toast.type === 'error' ? 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]' :
                   'bg-[#151A21] border-[#6C757D]/20 text-white'
               }`}>
                   {toast.type === 'success' && <CheckCircle2 size={18} />}
                   {toast.type === 'error' && <AlertCircle size={18} />}
                   {toast.type === 'info' && <RotateCw size={18} className="animate-spin" />}
                   <span className="text-sm font-medium">{toast.message}</span>
                   <button onClick={() => setToast(t => ({ ...t, show: false }))} className="ml-2 opacity-50 hover:opacity-100"><X size={14} /></button>
               </div>
           </div>
       )}

       {/* 1. Header (Compact) */}
       <div className="bg-[#151A21] border border-[#6C757D]/10 rounded-2xl p-6 relative overflow-hidden flex items-center justify-between gap-4">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#1F5AF6]/5 rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
          
          <div className="relative z-10 flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-white truncate" title={artifact.idea_central}>
                    {(artifact.idea_central || 'Artefacto sin nombre')
                        .replace(/(TEMA:|IDEA PRINCIPAL:|PÚBLICO:|RESULTADOS:)/g, '')
                        .split('.')[0] // Take first sentence usually containing the topic
                        .trim()}
                </h1>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 uppercase tracking-wider ${currentStatusStyle}`}>
                    {artifact.state === 'READY_FOR_QA' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                    {artifact.state.replace('_', ' ')}
                </div>
              </div>
              <p className="text-[#6C757D] text-xs font-mono">{artifact.course_id || artifact.id} • Creado hace {new Date(artifact.created_at).toLocaleDateString()}</p>
          </div>
       </div>

       {/* 2. Stepper */}
       <div className="px-6 py-6 bg-[#151A21] border border-[#6C757D]/10 rounded-2xl flex items-center justify-between overflow-x-auto">
           <StepItem step={1} label="Base" active={currentStep === 1} onClick={() => setCurrentStep(1)} icon={<Target size={16} />} />
           <div className={`h-0.5 flex-1 mx-4 rounded-full transition-colors ${currentStep >= 2 ? 'bg-[#1F5AF6]' : 'bg-[#2D333B]'}`} />
           <StepItem step={2} label="Temario" active={currentStep === 2} onClick={() => setCurrentStep(2)} icon={<BookOpen size={16} />} disabled={reviewState !== 'approved'} />
       </div>

       {/* 3. Tabs */}
       <div className="flex items-center gap-4">
           {['content', 'validation'].map((tab) => (
             <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-[#1F5AF6] text-white' : 'bg-[#151A21] text-[#94A3B8] hover:text-white border border-[#6C757D]/10'}`}
             >
               {tab === 'content' ? 'Contenido' : 'Validación'}
             </button>
           ))}
       </div>

       {/* 4. Content */}
       {activeTab === 'content' ? (
           <div className="space-y-6">
               {currentStep === 1 && (
                   <>
                       <SectionCard title="Nombres del Curso" icon={<FileText size={18} className="text-[#00D4B3]" />}>
                           <div className="space-y-3">
                               {(artifact.nombres || []).map((nombre: string, idx: number) => (
                                   <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-[#0F1419] border border-[#6C757D]/10 text-white text-sm">
                                       <span className="text-[#6C757D] font-mono">{idx + 1}.</span> {nombre}
                                   </div>
                               ))}
                           </div>
                       </SectionCard>

                       <SectionCard title="Objetivos" icon={<Target size={18} className="text-[#F59E0B]" />}>
                            <ul className="space-y-3">
                               {(artifact.objetivos || []).map((obj: string, idx: number) => (
                                   <li key={idx} className="flex gap-3 text-sm text-[#E9ECEF] bg-[#0F1419] p-3 rounded-lg border border-[#6C757D]/10">
                                       <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mt-2 shrink-0" /> {obj}
                                   </li>
                               ))}
                            </ul>
                       </SectionCard>

                       <SectionCard title="Descripción" icon={<Layers size={18} className="text-[#1F5AF6]" />}>
                            <p className="text-sm text-[#E9ECEF] bg-[#0F1419] p-4 rounded-xl border border-[#6C757D]/10">{artifact.descripcion?.texto || 'N/A'}</p>
                       </SectionCard>

                       {/* REVISION PANEL */}
                       <div className="bg-[#151A21] border border-[#6C757D]/10 rounded-2xl p-6 mt-8">
                           <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                               <Edit3 size={18} /> Revisión Fase 1
                           </h3>
                           
                           <textarea
                               className="w-full bg-[#0F1419] border border-[#6C757D]/20 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[#00D4B3]/50 min-h-[100px]"
                               placeholder="Escribe tus comentarios o feedback para la IA..."
                               value={feedback}
                               onChange={(e) => setFeedback(e.target.value)}
                               disabled={reviewState === 'approved' || isRegenerating}
                           />

                           <div className="flex items-center gap-4 mt-4">
                               {reviewState === 'pending' && (
                                   <>
                                       <button 
                                           onClick={() => setReviewState('approved')}
                                           className="flex-1 bg-[#00D4B3]/10 hover:bg-[#00D4B3]/20 text-[#00D4B3] border border-[#00D4B3]/20 py-3 rounded-xl font-medium transition-all"
                                       >
                                           Aprobar Fase 1
                                       </button>
                                       <button 
                                           onClick={() => setReviewState('rejected')}
                                           className="flex-1 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/20 py-3 rounded-xl font-medium transition-all"
                                       >
                                           Rechazar Fase 1
                                       </button>
                                   </>
                               )}

                               {reviewState === 'rejected' && (
                                   <button 
                                       onClick={handleRegenerate}
                                       disabled={isRegenerating}
                                       className="w-full bg-[#EF4444] hover:bg-[#cc3a3a] text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                   >
                                       {isRegenerating ? <RotateCw className="animate-spin" /> : <RotateCw />}
                                       {isRegenerating ? 'Regenerando...' : 'Regenerar Contenido con IA'}
                                   </button>
                               )}

                               {reviewState === 'approved' && (
                                   <div className="w-full bg-[#00D4B3]/20 text-[#00D4B3] py-3 rounded-xl font-bold text-center flex items-center justify-center gap-2">
                                       <CheckCircle2 /> Fase 1 Aprobada.
                                   </div>
                               )}
                           </div>
                       </div>
                   </>
               )}
               {currentStep === 2 && (
                   <div className="text-center py-20 text-[#6C757D]">
                       <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                       <p>El Temario se generará en la siguiente fase.</p>
                   </div>
               )}
           </div>
       ) : (
           <div className="space-y-6">
                {/* Search Queries Section */}
                {artifact.generation_metadata?.search_queries && artifact.generation_metadata.search_queries.length > 0 && (
                    <div className="bg-[#151A21] border border-[#6C757D]/10 rounded-xl p-5">
                       <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                           <Layers size={16} className="text-[#1F5AF6]" />
                           Búsquedas de Investigación Realizadas
                       </h3>
                       <div className="flex flex-wrap gap-2">
                           {artifact.generation_metadata.search_queries.map((q: string, idx: number) => (
                               <span key={idx} className="text-xs text-[#E9ECEF] bg-[#0F1419] px-3 py-1.5 rounded-full border border-[#6C757D]/20">
                                   🔍 {q}
                               </span>
                           ))}
                       </div>
                    </div>
                )}
                
                {/* Validation Results */}
                <div className="space-y-2">
                    {validation.results?.map((res: any, idx: number) => (
                        <div key={idx} className={`p-4 rounded-xl border flex items-start gap-4 ${res.passed ? 'bg-[#00D4B3]/5 border-[#00D4B3]/20' : 'bg-[#EF4444]/5 border-[#EF4444]/20'}`}>
                            {res.passed ? <CheckCircle2 className="text-[#00D4B3]" /> : <AlertCircle className="text-[#EF4444]" />}
                            <p className="text-sm text-white mt-1">{res.message}</p>
                        </div>
                    ))}
                </div>
           </div>
       )}
    </div>
  )
}

function SectionCard({ title, icon, action, children }: any) {
    return (
        <div className="bg-[#151A21] border border-[#6C757D]/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#6C757D]/10 flex justify-between items-center bg-[#1A2027]">
                <h3 className="text-white font-bold flex items-center gap-2">{icon} {title}</h3>
                {action && <div>{action}</div>}
            </div>
            <div className="p-6">{children}</div>
        </div>
    )
}

function StepItem({ step, label, active, onClick, icon, disabled }: any) {
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center gap-2 group ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all bg-[#0F1419] border-2 ${active ? 'border-[#1F5AF6] text-[#1F5AF6]' : 'border-[#2D333B] text-[#6C757D]'}`}>
                {icon}
            </div>
            <span className={`text-xs font-medium uppercase ${active ? 'text-[#1F5AF6]' : 'text-[#6C757D]'}`}>{label}</span>
        </button>
    )
}
