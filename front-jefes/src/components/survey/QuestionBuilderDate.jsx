import { Calendar, Trash2 } from 'lucide-react';

const QuestionBuilderDate = ({ question, onChange, onDelete, active = true }) => {

    const handleChange = (e) => {
        onChange({ ...question, [e.target.name]: e.target.value });
    };

    const handleToggleReq = () => {
        onChange({ ...question, obligatoria: !question.obligatoria });
    };

    return (
        // 1. Quité 'transition-all duration-300' del wrapper principal
        <div className={`
            p-6 rounded-xl border mb-6 relative group
            ${active
                ? 'bg-surface-primary border-brand-blue/30 shadow-sm border-l-4 border-l-brand-blue'
                : 'bg-surface-secondary border-border-base opacity-90'}
        `}>
            {/* Header / Toolbar */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-brand-blue">
                    <Calendar size={20} />
                    <span className="text-xs font-bold uppercase tracking-wider">Fecha / Hora</span>
                </div>

                <div className="flex gap-2">
                    {/* 2. Quité 'transition-colors' del botón */}
                    <button
                        onClick={handleToggleReq}
                        className={`text-xs font-bold px-3 py-1 rounded-full border
                            ${question.obligatoria
                                ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                                : 'bg-surface-secondary text-content-secondary border-border-base hover:bg-surface-secondary/80'}`}
                        title="Marcar como obligatoria"
                    >
                        {question.obligatoria ? 'Obligatoria *' : 'Opcional'}
                    </button>

                    {/* 3. Quité 'transition-colors' del botón eliminar */}
                    <button
                        onClick={onDelete}
                        className="text-content-secondary hover:text-red-500 p-1 rounded-md hover:bg-red-500/10"
                        title="Eliminar pregunta"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Content Editor */}
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-content-secondary uppercase">Título de la Pregunta</label>
                    {/* 4. Quité 'transition-colors' del input para que use la global de 300ms */}
                    <input
                        type="text"
                        name="titulo"
                        value={question.titulo}
                        onChange={handleChange}
                        placeholder="Ej: ¿Cuándo ocurrió el evento?"
                        className="w-full text-lg font-medium p-2 border-b-2 border-border-base focus:border-brand-blue outline-none bg-transparent text-content-primary placeholder-content-secondary/50"
                        autoFocus
                    />
                </div>

                {/* Preview Dummy */}
                <div className="p-4 bg-surface-secondary rounded-lg border border-border-base flex items-center gap-3 text-content-secondary select-none">
                    <Calendar size={18} />
                    <span className="font-mono text-sm">dd/mm/aaaa</span>
                </div>
            </div>
        </div>
    );
};

export default QuestionBuilderDate;