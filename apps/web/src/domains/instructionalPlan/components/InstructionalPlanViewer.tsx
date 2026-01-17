import { useState, useEffect } from 'react';
import { InstructionalPlanRow, LessonPlan } from '../../types/instructionalPlan.types';
import { instructionalPlanService } from '../../services/instructionalPlan.service';

interface InstructionalPlanViewerProps {
    artifactId: string;
}

export function InstructionalPlanViewer({ artifactId }: InstructionalPlanViewerProps) {
    const [plan, setPlan] = useState<InstructionalPlanRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedLessons, setExpandedLessons] = useState<string[]>([]);

    useEffect(() => {
        loadPlan();
    }, [artifactId]);

    const loadPlan = async () => {
        setLoading(true);
        const data = await instructionalPlanService.getPlan(artifactId);
        setPlan(data);
        setLoading(false);
    };

    const toggleLesson = (lessonId: string) => {
        setExpandedLessons(prev => 
            prev.includes(lessonId) 
                ? prev.filter(id => id !== lessonId) 
                : [...prev, lessonId]
        );
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-400">Cargando plan instruccional...</div>;
    }

    if (!plan || plan.lesson_plans.length === 0) {
        return (
            <div className="p-8 text-center border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/50">
                <p className="text-gray-400 mb-4">No hay plan instruccional generado aún.</p>
                <button 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                    onClick={() => console.log("Generate Trigger")}
                >
                    Generar Plan Instruccional
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                <div>
                    <h2 className="text-xl font-bold text-white">Plan Instruccional</h2>
                    <p className="text-sm text-gray-400">
                        {plan.lesson_plans.length} lecciones planificadas • Estado: <span className="text-blue-400">{plan.state}</span>
                    </p>
                </div>
                <div>
                   {/* Actions placeholder */}
                </div>
            </header>

            <div className="space-y-4">
                {plan.lesson_plans.map((lesson) => (
                    <div key={lesson.lesson_id} className="bg-[#151A21] border border-gray-800 rounded-xl overflow-hidden">
                        <button 
                            onClick={() => toggleLesson(lesson.lesson_id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                        >
                            <div>
                                <h3 className="text-lg font-semibold text-gray-200">
                                    {lesson.lesson_title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                    OA: {lesson.oa_text}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex gap-2">
                                    {lesson.components.map((comp, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-gray-800 text-xs text-gray-400 rounded border border-gray-700 font-mono">
                                            {comp.type}
                                        </span>
                                    ))}
                                </div>
                                <svg 
                                    className={`w-5 h-5 text-gray-500 transition-transform ${expandedLessons.includes(lesson.lesson_id) ? 'rotate-180' : ''}`} 
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        {expandedLessons.includes(lesson.lesson_id) && (
                            <div className="p-4 border-t border-gray-800 bg-black/20 space-y-4">
                                {/* Detalle del OA */}
                                <div className="bg-blue-900/10 border border-blue-500/20 p-3 rounded-lg">
                                    <p className="text-xs font-bold text-blue-400 uppercase mb-1">Objetivo de Aprendizaje</p>
                                    <p className="text-gray-300 italic">"{lesson.oa_text}"</p>
                                    <div className="flex gap-4 mt-2 text-xs">
                                        <span className="text-blue-300">Verbo Bloom: <strong className="text-white">{lesson.oa_bloom_verb || 'N/A'}</strong></span>
                                        <span className="text-blue-300">Criterio: <strong className="text-white">{lesson.measurable_criteria || 'N/A'}</strong></span>
                                    </div>
                                </div>

                                {/* Componentes Detallados */}
                                <div className="grid gap-3">
                                    {lesson.components.map((comp, idx) => (
                                        <div key={idx} className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded border ${
                                                    ['DIALOGUE', 'READING', 'QUIZ'].includes(comp.type) 
                                                        ? 'bg-purple-900/20 text-purple-400 border-purple-500/30' 
                                                        : 'bg-green-900/20 text-green-400 border-green-500/30'
                                                }`}>
                                                    {comp.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-300">{comp.summary}</p>
                                            {comp.notes && <p className="text-xs text-gray-500 mt-2 border-t border-gray-700 pt-2">Nota: {comp.notes}</p>}
                                        </div>
                                    ))}
                                </div>
                                
                                {lesson.alignment_notes && (
                                     <div className="p-3 bg-gray-800/20 rounded-lg border border-gray-700/30 text-xs text-gray-400">
                                         <strong className="block text-gray-500 mb-1">Notas de Alineación:</strong>
                                         {lesson.alignment_notes}
                                     </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
