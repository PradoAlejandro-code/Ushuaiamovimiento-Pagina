import React from 'react';
import { Plus, Trash2, GripVertical, Layers } from 'lucide-react';
import MyButton from '../ui/MyButton';

const SurveyGroupManager = ({ grupos, setGrupos, naked = false, className = "" }) => {
    const addGrupo = () => {
        const newGrupo = {
            id: `temp-${Date.now()}`,
            nombre: '',
            orden: grupos.length + 1
        };
        setGrupos([...grupos, newGrupo]);
    };

    const updateGrupo = (id, nombre) => {
        setGrupos(grupos.map(g => g.id === id ? { ...g, nombre } : g));
    };

    const deleteGrupo = (id) => {
        setGrupos(grupos.filter(g => g.id !== id));
    };

    if (grupos.length === 0) {
        return (
            <div className={`${naked ? '' : 'mb-6 p-4 rounded-xl border-2 border-dashed border-brand-purple/30 bg-brand-purple/5'} flex flex-col items-center justify-center gap-4 ${className}`}>
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-brand-purple text-lg">Agrupar Preguntas</h4>
                        {!naked && <p className="text-xs text-content-secondary mt-0.5 max-w-[200px]">Organiza tu encuesta con secciones desplegables.</p>}
                    </div>
                </div>
                <button 
                    onClick={addGrupo} 
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-purple text-white rounded-xl text-sm font-bold shadow-sm hover:bg-purple-700 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={18} />
                    {naked ? 'Añadir Primer Grupo' : 'Añadir Grupo'}
                </button>
            </div>
        );
    }

    return (
        <div className={`${naked ? '' : 'mb-6 bg-surface-primary border border-border-base rounded-xl p-4 shadow-sm ring-1 ring-brand-purple/10'} ${className}`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-base">
                <div className="flex items-center gap-2">
                    <Layers size={18} className="text-brand-purple" />
                    <h4 className="font-bold text-content-primary">Grupos de Preguntas</h4>
                </div>
                <button 
                    onClick={addGrupo} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 rounded-lg text-xs font-bold transition-colors"
                >
                    <Plus size={14} />
                    Añadir
                </button>
            </div>
            
            <div className="space-y-3">
                {grupos.map((g, idx) => (
                    <div key={g.id} className="flex items-center gap-2 group bg-surface-secondary/50 p-2 rounded-lg border border-border-base/50">
                        <span className="text-xs font-black text-brand-purple/60 w-6 text-center">{idx + 1}.</span>
                        <input
                            type="text"
                            value={g.nombre}
                            onChange={(e) => updateGrupo(g.id, e.target.value)}
                            placeholder="Ej. Datos Personales, Observaciones..."
                            className="flex-1 bg-surface-primary text-content-primary border border-border-base rounded-lg px-3 py-2 text-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/30 outline-none font-medium transition-all placeholder:text-content-tertiary"
                        />
                        <button
                            onClick={() => deleteGrupo(g.id)}
                            className="p-2 text-content-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar grupo"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <p className="text-[11px] text-brand-orange mt-4 font-semibold flex items-center gap-1 bg-brand-orange/10 px-3 py-2 rounded-lg">
                <span className="text-brand-orange">⚠️</span> Si borras un grupo, las preguntas asignadas a él quedarán sueltas.
            </p>
        </div>
    );
};

export default SurveyGroupManager;
