import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createEnrollee, updateEnrollee } from '../../api/enrollments';

const EnrolleeModal = ({ isOpen, onClose, onSaved, padron, enrollee = null }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && padron) {
            if (enrollee) {
                // Modo Edición
                setFormData(enrollee.dynamic_data || {});
            } else {
                // Modo Creación
                setFormData({});
            }
            setError('');
        }
    }, [isOpen, padron, enrollee]);

    if (!isOpen || !padron) return null;

    const handleFieldChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const hasAnyValue = Object.values(formData).some(v => v && String(v).trim() !== '');
        if (!hasAnyValue) {
            setError('Debes completar al menos un campo.');
            return;
        }

        try {
            setLoading(true);
            
            const payload = {
                enrollment_list: padron.id,
                dynamic_data: formData
            };

            let response;
            if (enrollee) {
                response = await updateEnrollee(enrollee.id, payload);
            } else {
                response = await createEnrollee(payload);
            }
            
            onSaved(response);
            onClose();
        } catch (err) {
            console.error('Error guardando persona:', err);
            setError('Ocurrió un error al guardar. Verifica los datos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface-primary rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-border-base">
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-base bg-surface-secondary/50">
                    <h2 className="text-xl font-bold text-content-primary">
                        {enrollee ? 'Editar Registro' : 'Agregar Registro'}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 text-content-secondary hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Datos Dinámicos del Padrón */}
                    {padron.fields && padron.fields.length > 0 && (
                        <div className="space-y-4">
                            {padron.fields.map(f => (
                                <div key={f.id} className="space-y-1.5">
                                    <label className="text-sm font-semibold text-content-secondary">{f.name}</label>
                                    <input
                                        type={f.field_type || 'text'}
                                        value={formData[f.name] || ''}
                                        onChange={(e) => handleFieldChange(f.name, e.target.value)}
                                        className="w-full px-4 py-2.5 bg-surface-secondary border border-border-base rounded-xl text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all"
                                        autoFocus={padron.fields[0].id === f.id}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </form>

                <div className="p-4 sm:p-6 border-t border-border-base bg-surface-secondary/50 flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-content-secondary hover:bg-surface-primary border border-border-base font-medium transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-medium transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : null}
                        {enrollee ? 'Guardar Cambios' : 'Agregar Registro'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnrolleeModal;
