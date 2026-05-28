import React, { useState, useEffect } from 'react';
import { X, Info, Edit2, Check, Layout, Trash2 } from 'lucide-react';
import { useUpdateEnrollmentList, useUpdateListField, useDeleteListField } from '@/queries/useEnrollments';

const EnrollmentInfoModal = ({ isOpen, onClose, enrollment }) => {
    const [name, setName] = useState(enrollment?.name || '');
    const [fieldLabels, setFieldLabels] = useState({});
    const [editingFieldId, setEditingFieldId] = useState(null);
    const [tempLabel, setTempLabel] = useState('');

    const { mutate: updatePadron, isLoading: updatingPadron } = useUpdateEnrollmentList();
    const { mutate: updateField } = useUpdateListField();
    const { mutate: deleteField } = useDeleteListField();

    const handleDeleteField = (fieldId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta columna? Los datos asociados en este padrón se perderán.')) {
            deleteField(fieldId);
        }
    };

    useEffect(() => {
        if (enrollment) {
            setName(enrollment.name);
            const labels = {};
            enrollment.fields?.forEach(f => {
                labels[f.id] = f.label;
            });
            setFieldLabels(labels);
        }
    }, [enrollment]);

    if (!isOpen || !enrollment) return null;

    const handleSaveName = () => {
        if (!name.trim() || name === enrollment.name) return;
        updatePadron({ id: enrollment.id, data: { name: name.trim() } });
    };

    const handleStartEditField = (field) => {
        setEditingFieldId(field.id);
        setTempLabel(field.label);
    };

    const handleSaveField = (fieldId) => {
        if (!tempLabel.trim()) return;
        updateField({ id: fieldId, data: { label: tempLabel.trim() } });
        setEditingFieldId(null);
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-primary rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col border border-border-base max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-border-base">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">
                            <Info size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-content-primary">Información del Padrón</h2>
                    </div>
                    <button onClick={onClose} className="text-content-secondary hover:text-content-primary transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-8">
                    {/* Sección: Nombre del Padrón */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-content-tertiary uppercase tracking-wider">Nombre del Padrón</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flex-1 bg-surface-secondary border border-border-base rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue/20 text-content-primary font-medium"
                            />
                            <button 
                                onClick={handleSaveName}
                                disabled={name === enrollment.name || !name.trim()}
                                className="px-4 py-2.5 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                <Check size={18} /> Guardar
                            </button>
                        </div>
                    </div>

                    {/* Sección: Gestión de Columnas */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-content-tertiary uppercase tracking-wider">Gestión de Columnas</label>
                            <span className="text-xs text-content-tertiary">{enrollment.fields?.length} columnas totales</span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                            {enrollment.fields?.sort((a,b) => a.order - b.order).map(field => (
                                <div key={field.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl border border-border-base group">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="p-1.5 bg-surface-primary text-content-tertiary rounded-lg">
                                            <Layout size={14} />
                                        </div>
                                        
                                        {editingFieldId === field.id ? (
                                            <input 
                                                autoFocus
                                                value={tempLabel}
                                                onChange={(e) => setTempLabel(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveField(field.id)}
                                                className="flex-1 bg-surface-primary border border-brand-blue rounded-lg px-2 py-1 text-sm outline-none"
                                            />
                                        ) : (
                                            <div className="flex flex-col truncate">
                                                <span className="text-sm font-bold text-content-primary truncate">{field.label}</span>
                                                <span className="text-[10px] text-content-tertiary font-mono uppercase tracking-tight">{field.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {editingFieldId === field.id ? (
                                            <button 
                                                onClick={() => handleSaveField(field.id)}
                                                className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                                            >
                                                <Check size={18} />
                                            </button>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={() => handleStartEditField(field)}
                                                    className="p-2 text-content-tertiary hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Renombrar columna"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteField(field.id)}
                                                    className="p-2 text-content-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Eliminar columna"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border-base flex justify-between items-center bg-surface-secondary/30">
                    <p className="text-xs text-content-tertiary">
                        Creado el {new Date(enrollment.created_at).toLocaleDateString()}
                    </p>
                    <button onClick={onClose} className="px-6 py-2 bg-surface-primary border border-border-base rounded-xl font-bold text-content-primary hover:bg-surface-secondary transition-all">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnrollmentInfoModal;
