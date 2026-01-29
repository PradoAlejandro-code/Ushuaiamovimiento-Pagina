import React from 'react';
import { Phone } from 'lucide-react';

const QuestionViewerPhone = ({ question, value, onChange }) => {

    // Si el valor está vacío, podemos sugerir el prefijo, 
    // pero permitimos que el usuario lo borre completamente si quiere.
    const handleChange = (e) => {
        let val = e.target.value;
        // Permitir números, espacios y el signo +
        val = val.replace(/[^\d+ ]/g, '');
        onChange(val);
    };

    const initialValue = value || '+54 ';

    return (
        <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-base mb-4 hover:shadow-md transition-all border-l-4 border-l-green-500 dark:border-l-green-400">

            <div className="space-y-4">
                {/* 1. Título */}
                <div>
                    <label className="block text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Phone size={12} />
                        {question.obligatoria ? "Teléfono Requerido *" : "Teléfono Opcional"}
                    </label>
                    <h3 className="text-lg font-medium text-content-primary">
                        {question.titulo}
                    </h3>
                </div>

                {/* 2. Campo de Respuesta Flexible */}
                <div className="flex gap-2">
                    <input
                        type="tel"
                        placeholder="+54 2901 123456"
                        className="flex-1 text-base p-3 rounded-lg border border-border-base bg-surface-secondary text-content-primary placeholder-content-secondary focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-mono"
                        value={initialValue}
                        onChange={handleChange}
                        required={question.obligatoria}
                    />
                </div>
            </div>
        </div>
    );
};

export default QuestionViewerPhone;
