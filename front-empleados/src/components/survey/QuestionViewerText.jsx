import React from 'react';

const QuestionViewerText = ({ question, value, onChange }) => {
    return (
        <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-base mb-4 hover:shadow-md transition-all border-l-4 border-l-indigo-500 dark:border-l-indigo-400">

            <div className="space-y-4">
                {/* 1. Título */}
                <div>
                    <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
                        {question.obligatoria ? "Texto Requerido *" : "Texto Opcional"}
                    </label>
                    <h3 className="text-lg font-medium text-content-primary">
                        {question.titulo}
                    </h3>
                </div>

                {/* 2. Campo de Respuesta */}
                <div>
                    <input
                        type="text"
                        placeholder="Escribe tu respuesta aquí..."
                        className="w-full text-base p-3 rounded-lg border border-border-base bg-surface-secondary text-content-primary placeholder-content-secondary focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        required={question.obligatoria}
                    />
                </div>
            </div>
        </div>
    );
};

export default QuestionViewerText;