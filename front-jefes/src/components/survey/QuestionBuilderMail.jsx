import { Trash2, Save } from 'lucide-react';

const QuestionBuilderMail = ({ question, onChange, onDelete, onSave }) => {

    const handleChange = (field, value) => {
        onChange({ ...question, [field]: value });
    };

    return (
        <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-base mb-4 group relative hover:shadow-md border-l-4 border-l-yellow-500">

            {/* Actions (Save & Delete) */}
            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {onSave && (
                    <button
                        onClick={onSave}
                        className="p-2 text-content-secondary hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg"
                        title="Guardar cambios"
                    >
                        <Save size={18} />
                    </button>
                )}
                <button
                    onClick={onDelete}
                    className="p-2 text-content-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                    title="Eliminar pregunta"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="space-y-4">
                {/* 1. Título de la Pregunta */}
                <div>
                    <label className="block text-xs font-semibold text-yellow-500 uppercase tracking-wide mb-1">
                        Pregunta de Email
                    </label>
                    <input
                        type="text"
                        placeholder="Escribe tu pregunta aquí (ej: Correo Electrónico)"
                        className="w-full text-lg font-medium text-content-primary placeholder-content-secondary/50 border-b border-border-base focus:border-yellow-500 focus:outline-none py-2 bg-transparent"
                        value={question.titulo || ''}
                        onChange={(e) => handleChange('titulo', e.target.value)}
                    />
                </div>

                {/* 2. Campo Ilustrativo (Preview) */}
                <div>
                    <input
                        type="text"
                        placeholder="usuario@ejemplo.com"
                        disabled
                        className="w-full p-3 bg-surface-secondary border border-border-base rounded-lg text-sm text-content-secondary cursor-not-allowed select-none"
                    />
                </div>

                {/* 3. Checkbox Obligatoria */}
                <div className="flex items-center gap-2 pt-2 border-t border-border-base">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-content-secondary hover:text-content-primary">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-yellow-500 rounded border-gray-300 focus:ring-yellow-500 accent-yellow-500"
                            checked={question.obligatoria || false}
                            onChange={(e) => handleChange('obligatoria', e.target.checked)}
                        />
                        <span>Respuesta obligatoria</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default QuestionBuilderMail;
