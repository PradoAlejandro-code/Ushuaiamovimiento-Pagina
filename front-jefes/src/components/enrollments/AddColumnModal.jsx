import React, { useState } from 'react';
import { X, Layout, Plus } from 'lucide-react';
import apiClient from '../../api/client';

const AddColumnModal = ({ isOpen, onClose, enrollmentId, onColumnAdded }) => {
    const [label, setLabel] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!label.trim()) return;

        try {
            setLoading(true);
            setError('');
            
            // Generar un nombre técnico basado en el label
            const name = label.toLowerCase()
                .trim()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '');

            await apiClient.post('/api/enrollments/fields/', {
                enrollment_list: enrollmentId,
                name: name,
                label: label.trim(),
                field_type: 'text',
                is_visible: true
            });

            setLabel('');
            onColumnAdded();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al agregar la columna');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-primary rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-border-base">
                <div className="flex items-center justify-between p-5 border-b border-border-base">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-orange/10 text-brand-orange rounded-lg">
                            <Layout size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-content-primary">Agregar Nueva Columna</h2>
                    </div>
                    <button onClick={onClose} className="text-content-secondary hover:text-content-primary transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-content-tertiary uppercase tracking-wider">
                            Nombre de la Columna
                        </label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Ej: Estado, Activo, Observaciones..."
                            className="w-full bg-surface-secondary border border-border-base rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-orange/20 text-content-primary"
                            autoFocus
                        />
                        <p className="text-[10px] text-content-tertiary">
                            Esta columna será exclusiva de este padrón y no afectará la tabla general de personas.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-medium">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-content-secondary hover:bg-surface-secondary transition-colors text-sm font-semibold"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !label.trim()}
                            className="px-6 py-2.5 bg-brand-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50 text-sm shadow-lg shadow-orange-500/20"
                        >
                            {loading ? 'Agregando...' : <><Plus size={18} /> Agregar</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddColumnModal;
