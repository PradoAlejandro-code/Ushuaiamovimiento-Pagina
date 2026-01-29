import { Trash2, Camera, Save } from 'lucide-react';

const QuestionBuilderPhoto = ({ question, onChange, onDelete, onSave }) => {

    const handleChange = (field, value) => {
        onChange({ ...question, [field]: value });
    };

    return (
        // 1. Quité 'transition-all'
        <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-base mb-4 group relative hover:shadow-md border-l-4 border-l-pink-500">

            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {onSave && (
                    // 2. Quité 'transition-colors'
                    <button
                        onClick={onSave}
                        className="p-2 text-content-secondary hover:text-pink-500 hover:bg-pink-500/10 rounded-lg"
                        title="Guardar cambios"
                    >
                        <Save size={18} />
                    </button>
                )}
                {/* 3. Quité 'transition-colors' */}
                <button
                    onClick={onDelete}
                    className="p-2 text-content-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                    title="Eliminar pregunta"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="space-y-4">
                {/* 1. Título */}
                <div>
                    <label className="block text-xs font-semibold text-pink-500 uppercase tracking-wide mb-1">
                        Pregunta de Foto
                    </label>
                    {/* 4. Quité 'transition-colors' */}
                    <input
                        type="text"
                        placeholder="Ej: Foto del frente de la casa"
                        className="w-full text-lg font-medium text-content-primary placeholder-content-secondary/50 border-b border-border-base focus:border-pink-500 focus:outline-none py-2 bg-transparent"
                        value={question.titulo || ''}
                        onChange={(e) => handleChange('titulo', e.target.value)}
                    />
                </div>

                {/* 2. Preview de Carga de Foto */}
                <div className="border-2 border-dashed border-border-base rounded-lg p-6 flex flex-col items-center justify-center text-content-secondary bg-surface-secondary">
                    <Camera size={32} className="mb-2 opacity-50" />
                    <span className="text-sm font-medium">Subir Foto (Vista Previa)</span>
                </div>

                {/* 3. Checkbox Obligatoria */}
                <div className="flex items-center gap-2 pt-2 border-t border-border-base">
                    {/* 5. Quité 'transition-colors' */}
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-content-secondary hover:text-content-primary">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-pink-500 rounded border-gray-300 focus:ring-pink-500 accent-pink-500"
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

export default QuestionBuilderPhoto;