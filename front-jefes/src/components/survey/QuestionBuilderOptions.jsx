import { Trash2, Plus, X, Save } from 'lucide-react';

const QuestionBuilderOptions = ({ question, onChange, onDelete, onSave }) => {

    // Inicializar opciones si no existen
    const options = question.opciones || ["Si", "No"];

    const handleChange = (field, value) => {
        onChange({ ...question, [field]: value });
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        handleChange('opciones', newOptions);
    };

    const addOption = () => {
        handleChange('opciones', [...options, `Opción ${options.length + 1}`]);
    };

    const removeOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        handleChange('opciones', newOptions);
    };

    return (
        // 1. Quité 'transition-all' del contenedor principal
        <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-base mb-4 group relative hover:shadow-md border-l-4 border-l-purple-500">

            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {onSave && (
                    // 2. Quité 'transition-colors'
                    <button
                        onClick={onSave}
                        className="p-2 text-content-secondary hover:text-purple-500 hover:bg-purple-500/10 rounded-lg"
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
                    <label className="block text-xs font-semibold text-purple-500 uppercase tracking-wide mb-1">
                        Pregunta de Opciones
                    </label>
                    {/* 4. Quité 'transition-colors' */}
                    <input
                        type="text"
                        placeholder="Ej: ¿Tipo de vivienda?"
                        className="w-full text-lg font-medium text-content-primary placeholder-content-secondary/50 border-b border-border-base focus:border-purple-500 focus:outline-none py-2 bg-transparent"
                        value={question.titulo || ''}
                        onChange={(e) => handleChange('titulo', e.target.value)}
                    />
                </div>

                {/* 2. Editor de Opciones */}
                <div className="space-y-2">
                    <p className="text-xs font-medium text-content-secondary uppercase">Opciones Disponibles:</p>
                    {options.map((op, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-border-base"></div>
                            {/* 5. Quité 'transition-colors' */}
                            <input
                                type="text"
                                value={op}
                                onChange={(e) => handleOptionChange(idx, e.target.value)}
                                className="flex-1 text-sm text-content-primary bg-transparent border-b border-transparent focus:border-border-base focus:outline-none py-1 hover:border-border-base/50"
                            />
                            {/* 6. Quité 'transition-colors' */}
                            <button
                                onClick={() => removeOption(idx)}
                                className="text-content-secondary hover:text-red-400 p-1"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}

                    {/* 7. Quité 'transition-colors' */}
                    <button
                        onClick={addOption}
                        className="flex items-center gap-2 text-sm text-purple-500 hover:text-purple-400 font-medium mt-2 px-2 py-1 rounded hover:bg-purple-500/10 w-fit"
                    >
                        <Plus size={16} /> Agregar Opción
                    </button>
                </div>

                <div className="flex items-center gap-6 pt-2 border-t border-border-base">
                    {/* 8. Checkbox Obligatoria */}
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-content-secondary hover:text-content-primary">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-purple-500 rounded border-gray-300 focus:ring-purple-500 accent-purple-500"
                            checked={question.obligatoria || false}
                            onChange={(e) => handleChange('obligatoria', e.target.checked)}
                        />
                        <span>Respuesta obligatoria</span>
                    </label>

                    {/* 9. Checkbox Múltiple */}
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-content-secondary hover:text-content-primary">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-purple-500 rounded border-gray-300 focus:ring-purple-500 accent-purple-500"
                            checked={question.permite_multiple || false}
                            onChange={(e) => handleChange('permite_multiple', e.target.checked)}
                        />
                        <span>Permitir selección múltiple</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default QuestionBuilderOptions;