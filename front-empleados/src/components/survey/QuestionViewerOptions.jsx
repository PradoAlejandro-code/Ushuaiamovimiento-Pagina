import { ChevronDown } from 'lucide-react';

const QuestionViewerOptions = ({ question, value, onChange }) => {
    return (
        <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-base mb-4 hover:shadow-md transition-all border-l-4 border-l-purple-500 dark:border-l-purple-400">
            <div className="space-y-4">
                {/* 1. Título */}
                <div>
                    <label className="block text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
                        {question.obligatoria
                            ? (question.permite_multiple ? "Selección Múltiple *" : "Selección Única *")
                            : (question.permite_multiple ? "Selección Múltiple" : "Selección Única")}
                    </label>
                    <h3 className="text-lg font-medium text-content-primary">
                        {question.titulo}
                    </h3>
                </div>

                {/* 2. Opciones */}
                {question.permite_multiple ? (
                    <div className="space-y-2">
                        {question.opciones && question.opciones.map((op, idx) => {
                            const currentValues = value ? String(value).split(',').map(s => s.trim()) : [];
                            const isChecked = currentValues.includes(op);

                            const handleCheckboxChange = (optionValue, checked) => {
                                let newValues;
                                if (checked) {
                                    newValues = [...currentValues, optionValue];
                                } else {
                                    newValues = currentValues.filter(v => v !== optionValue);
                                }
                                onChange(newValues.join(', '));
                            };

                            return (
                                <label key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border-base bg-surface-secondary cursor-pointer hover:bg-surface-primary transition-colors">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 text-purple-500 rounded border-gray-300 focus:ring-purple-500 accent-purple-500"
                                        checked={isChecked}
                                        onChange={(e) => handleCheckboxChange(op, e.target.checked)}
                                    />
                                    <span className="text-content-primary text-base">{op}</span>
                                </label>
                            );
                        })}
                    </div>
                ) : (
                    <div className="relative">
                        <select
                            className="w-full text-base p-3 pr-10 rounded-lg border border-border-base bg-surface-secondary text-content-primary focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all appearance-none cursor-pointer placeholder-content-secondary"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            required={question.obligatoria}
                        >
                            <option value="" className="text-content-secondary">Seleccione una opción...</option>
                            {question.opciones && question.opciones.map((op, idx) => (
                                <option key={idx} value={op} className="bg-surface-primary text-content-primary">
                                    {op}
                                </option>
                            ))}
                        </select>

                        {/* Flecha personalizada */}
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-content-secondary">
                            <ChevronDown size={20} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionViewerOptions;