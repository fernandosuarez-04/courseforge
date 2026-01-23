'use client';

import { useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface IterationPanelProps {
    currentIteration: number;
    maxIterations: number;
    onStartIteration: (instructions: string) => void;
    className?: string;
}

export function IterationPanel({
    currentIteration,
    maxIterations,
    onStartIteration,
    className = '',
}: IterationPanelProps) {
    const [instructions, setInstructions] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canIterate = currentIteration < maxIterations;
    const remainingIterations = maxIterations - currentIteration;

    const handleSubmit = async () => {
        if (!instructions.trim() || !canIterate) return;

        setIsSubmitting(true);
        try {
            await onStartIteration(instructions);
            setInstructions('');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!canIterate) {
        return (
            <div className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
                <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">
                            Máximo de iteraciones alcanzado ({maxIterations})
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Esta lección requiere revisión manual o debe registrarse un bloqueador.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-orange-800 dark:text-orange-300">Iteración Dirigida</h5>
                <span className="text-xs text-orange-600 dark:text-orange-400">
                    {remainingIterations} intento{remainingIterations !== 1 ? 's' : ''} restante{remainingIterations !== 1 ? 's' : ''}
                </span>
            </div>

            <p className="text-xs text-orange-700 dark:text-orange-400 mb-3">
                Describe los problemas específicos que la IA debe corregir. Sé lo más específico posible.
            </p>

            <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ej: El quiz solo tiene 2 preguntas, necesita al menos 3. Faltan explicaciones en las opciones B y D."
                className="w-full p-3 text-sm border border-orange-200 dark:border-orange-700 rounded-lg bg-white dark:bg-[#1E2329] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                rows={3}
                disabled={isSubmitting}
            />

            <div className="flex justify-end mt-3">
                <button
                    onClick={handleSubmit}
                    disabled={!instructions.trim() || isSubmitting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSubmitting ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    Ejecutar Iteración
                </button>
            </div>
        </div>
    );
}
