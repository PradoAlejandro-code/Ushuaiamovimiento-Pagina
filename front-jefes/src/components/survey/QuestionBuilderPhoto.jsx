import { Trash2, Save } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const QuestionBuilderPhoto = ({ question, grupos = [], onChange, onDelete, onSave, naked = false, className = "" }) => {
    const handleChange = (field, value) => {
        onChange({ ...question, [field]: value });
    };

    const containerClasses = naked
        ? `w-full h-full relative group ${className}`
        : `bg-surface-primary p-6 rounded-xl shadow-sm border border-border-base mb-4 group relative hover:shadow-md border-l-4 border-l-pink-500 ${className}`;

    return (
        <div className={containerClasses}>
            {/* Actions (Save & Delete) */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${naked ? 'bg-surface-secondary/80 backdrop-blur-sm p-1 rounded-lg' : ''}`}>
                {onSave && (
                    <button onClick={onSave} className="p-1.5 text-content-secondary hover:text-pink-500 hover:bg-pink-500/10 rounded-lg" title="Guardar">
                        <Save size={14} />
                    </button>
                )}
                <button onClick={onDelete} className="p-1.5 text-content-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg" title="Eliminar">
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="space-y-3">
                {/* 1. Título de la Pregunta */}
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-1 text-pink-500">
                        Pregunta de Foto
                    </label>
                    <input
                        type="text"
                        placeholder="Escribe tu pregunta aquí..."
                        className="w-full text-base font-bold text-content-primary placeholder-content-secondary/30 border-b border-border-base/50 outline-none py-1 bg-transparent transition-colors focus:border-pink-500"
                        value={question.titulo || ''}
                        onChange={(e) => handleChange('titulo', e.target.value)}
                    />
                </div>

                {grupos.length > 0 && (
                    <div className="mt-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest mb-1 text-pink-500 opacity-80">
                            Asignar a Grupo
                        </label>
                        <Select
                            value={question.grupo_id ? String(question.grupo_id) : "none"}
                            onValueChange={(val) => handleChange('grupo_id', val === "none" ? null : val)}
                        >
                            <SelectTrigger className="w-full bg-surface-secondary/50 border-border-base/50 h-9">
                                <SelectValue placeholder="-- Sin Grupo --" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">-- Sin Grupo --</SelectItem>
                                {grupos.map(g => (
                                    <SelectItem key={g.id} value={String(g.id)}>{g.nombre || `Grupo ${g.orden}`}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* 2. Campo Ilustrativo (Preview) */}
                <div className="flex justify-center items-center p-6 bg-surface-secondary/50 border border-dashed border-border-base rounded-lg text-content-secondary">
                    <div className="text-center">
                        <span className="block text-xl mb-1">📷</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Área de captura de foto</span>
                    </div>
                </div>

                {/* 3. Checkbox Obligatoria */}
                <div className="flex items-center gap-2 pt-2 border-t border-border-base/50">
                    <label className="flex items-center gap-2 cursor-pointer group/field">
                        <Checkbox
                            id={`obligatoria-${question.id}`}
                            checked={question.obligatoria || false}
                            onCheckedChange={(val) => handleChange('obligatoria', val)}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-content-secondary group-hover/field:text-content-primary transition-colors">
                            Obligatoria
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default QuestionBuilderPhoto;
