import React from 'react';
import { Trash2, Save, Calendar, Plus, X } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// DICCIONARIO DE CONFIGURACIÓN
const CONFIG = {
    texto: {
        label: 'Pregunta de Texto',
        titlePlaceholder: 'Escribe tu pregunta aquí...',
        preview: 'Texto de respuesta breve',
        previewType: 'text',
        css: { border: 'border-indigo-500', text: 'text-indigo-500', focus: 'focus:border-indigo-500', bgHover: 'hover:bg-indigo-500/10', accent: 'accent-indigo-500 text-indigo-500' }
    },
    celular: {
        label: 'Pregunta de Celular',
        titlePlaceholder: 'Ej: Celular de contacto',
        preview: '+54 9 11 ...',
        previewType: 'text',
        css: { border: 'border-green-600', text: 'text-green-600', focus: 'focus:border-green-600', bgHover: 'hover:bg-green-600/10', accent: 'accent-green-600 text-green-600' }
    },
    fecha: {
        label: 'Fecha / Hora',
        titlePlaceholder: 'Ej: ¿Cuándo ocurrió el evento?',
        preview: 'dd/mm/aaaa',
        previewType: 'date',
        css: { border: 'border-brand-blue', text: 'text-brand-blue', focus: 'focus:border-brand-blue', bgHover: 'hover:bg-brand-blue/10', accent: 'accent-brand-blue text-brand-blue' }
    },
    dni: {
        label: 'Pregunta de DNI',
        titlePlaceholder: 'Ej: DNI o Documento',
        preview: '12.345.678',
        previewType: 'text',
        css: { border: 'border-cyan-600', text: 'text-cyan-600', focus: 'focus:border-cyan-600', bgHover: 'hover:bg-cyan-600/10', accent: 'accent-cyan-600 text-cyan-600' }
    },
    mail: {
        label: 'Pregunta de Email',
        titlePlaceholder: 'Ej: Correo Electrónico',
        preview: 'usuario@ejemplo.com',
        previewType: 'text',
        css: { border: 'border-yellow-500', text: 'text-yellow-500', focus: 'focus:border-yellow-500', bgHover: 'hover:bg-yellow-500/10', accent: 'accent-yellow-500 text-yellow-500' }
    },
    nombre: {
        label: 'Pregunta de Nombre',
        titlePlaceholder: 'Ej: Nombre Completo',
        preview: 'Nombre y Apellido',
        previewType: 'text',
        css: { border: 'border-blue-500', text: 'text-blue-500', focus: 'focus:border-blue-500', bgHover: 'hover:bg-blue-500/10', accent: 'accent-blue-500 text-blue-500' }
    },
    numero: {
        label: 'Pregunta Numérica',
        titlePlaceholder: 'Ej: ¿Cuántas personas viven aquí?',
        preview: '123',
        previewType: 'number',
        css: { border: 'border-emerald-500', text: 'text-emerald-500', focus: 'focus:border-emerald-500', bgHover: 'hover:bg-emerald-500/10', accent: 'accent-emerald-500 text-emerald-500' }
    },
    opciones: {
        label: 'Pregunta de Opciones',
        titlePlaceholder: 'Ej: ¿Tipo de vivienda?',
        previewType: 'options',
        css: { border: 'border-purple-500', text: 'text-purple-500', focus: 'focus:border-purple-500', bgHover: 'hover:bg-purple-500/10', accent: 'accent-purple-500 text-purple-500' }
    }
};

const QuestionBuilder = ({ question, grupos = [], onChange, onDelete, onSave, autoFocus = false, naked = false, className = "" }) => {
    const tipoDato = question.tipo || 'texto';
    const config = CONFIG[tipoDato] || CONFIG['texto'];
    const { css, label, titlePlaceholder, preview, previewType } = config;

    const handleChange = (field, value) => {
        onChange({ ...question, [field]: value });
    };

    const options = question.opciones || ["Si", "No"];

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        handleChange('opciones', newOptions);
    };

    const addOption = () => {
        handleChange('opciones', [...options, `Opción ${options.length + 1}`]);
    };

    const removeOption = (index) => {
        handleChange('opciones', options.filter((_, i) => i !== index));
    };

    const containerClasses = naked
        ? `w-full h-full relative group ${className}`
        : `bg-surface-primary p-6 rounded-xl shadow-sm border-2 mb-4 group relative hover:shadow-md transition-all duration-300 ${css.border} ${className}`;

    return (
        <div className={containerClasses}>

            <div className={`absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${naked ? 'bg-surface-secondary/80 backdrop-blur-sm p-1 rounded-lg' : ''}`}>
                {onSave && (
                    <button onClick={onSave} className={`p-1.5 text-content-secondary hover:${css.text} ${css.bgHover} rounded-lg`} title="Guardar">
                        <Save size={14} />
                    </button>
                )}
                <button onClick={onDelete} className="p-1.5 text-content-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg" title="Eliminar">
                    <Trash2 size={14} />
                </button>
            </div>

            <div className={`space-y-3 ${naked ? '' : ''}`}>
                <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-1 ${css.text}`}>
                        {label}
                    </label>
                    <input
                        type="text"
                        placeholder={titlePlaceholder}
                        className={`w-full text-base font-bold text-content-primary placeholder-content-secondary/30 border-b border-border-base/50 outline-none py-1 bg-transparent transition-colors ${css.focus}`}
                        value={question.titulo || ''}
                        onChange={(e) => handleChange('titulo', e.target.value)}
                        autoFocus={autoFocus}
                    />
                </div>

                {grupos.length > 0 && (
                    <div className="mt-2">
                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1 ${css.text} opacity-80`}>
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

                <div>
                    {previewType === 'options' ? (
                        <div className="space-y-2 mt-4">
                            <p className="text-xs font-medium text-content-secondary uppercase">Opciones Disponibles:</p>
                            {options.map((op, idx) => (
                                <div key={idx} className="flex items-center gap-2 group/opt">
                                    <div className={`w-4 h-4 rounded-full border-2 ${css.border} opacity-50`}></div>
                                    <input
                                        type="text"
                                        value={op}
                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                        className="flex-1 text-sm text-content-primary bg-transparent border-b border-transparent focus:border-border-base focus:outline-none py-1 hover:border-border-base/50 transition-all"
                                    />
                                    <button onClick={() => removeOption(idx)} className="text-content-secondary hover:text-red-400 p-1 opacity-0 group-hover/opt:opacity-100 transition-opacity">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={addOption} className={`flex items-center gap-2 text-sm font-medium mt-2 px-3 py-1.5 rounded-lg transition-colors ${css.text} ${css.bgHover} w-fit`}>
                                <Plus size={16} /> Agregar Opción
                            </button>
                        </div>
                    ) : previewType === 'date' ? (
                        <div className="p-4 bg-surface-secondary/50 rounded-lg border border-border-base flex items-center gap-3 text-content-secondary select-none w-fit">
                            <Calendar size={18} />
                            <span className="font-mono text-sm">{preview}</span>
                        </div>
                    ) : (
                        <input
                            type={previewType}
                            placeholder={preview}
                            disabled
                            className={`p-3 bg-surface-secondary/50 border border-border-base rounded-lg text-sm text-content-secondary cursor-not-allowed select-none ${previewType === 'number' ? 'w-32' : 'w-full md:w-2/3'}`}
                        />
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border-base mt-2">
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

                    {previewType === 'options' && (
                        <label className="flex items-center gap-2 cursor-pointer group/field">
                            <Checkbox
                                id={`multiple-${question.id}`}
                                checked={question.permite_multiple || false}
                                onCheckedChange={(val) => handleChange('permite_multiple', val)}
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest text-content-secondary group-hover/field:text-content-primary transition-colors">
                                Múltiple
                            </span>
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestionBuilder;