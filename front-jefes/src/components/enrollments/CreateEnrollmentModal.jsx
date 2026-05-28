import React, { useState } from 'react';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import { createEnrollmentList } from '../../api/enrollments';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CreateEnrollmentModal = ({ isOpen, onClose, onCreated }) => {
    const [name, setName] = useState('');
    const [fields, setFields] = useState([{ name: '', field_type: 'text' }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const [headerInput, setHeaderInput] = useState('');
    const [isImportingHeaders, setIsImportingHeaders] = useState(false);

    if (!isOpen) return null;

    const handleImportHeaders = () => {
        if (!headerInput.trim()) return;
        
        const separators = /[;,]/;
        const imported = headerInput
            .split(separators)
            .map(h => h.trim())
            .filter(h => h.length > 0);
        
        if (imported.length > 0) {
            const newFields = imported.map(name => ({ name, field_type: 'text' }));
            setFields(prev => {
                const existing = prev.filter(f => f.name.trim() !== '');
                return [...existing, ...newFields];
            });
            setHeaderInput('');
            setIsImportingHeaders(false);
        }
    };

    const handleAddField = () => {
        setFields([...fields, { name: '', field_type: 'text' }]);
    };

    const handleRemoveField = (index) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const handleFieldChange = (index, key, value) => {
        const newFields = [...fields];
        newFields[index][key] = value;
        setFields(newFields);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!name.trim()) {
            setError('El nombre del padrón es obligatorio');
            return;
        }

        setIsConfirmOpen(true);
    };

    const confirmSubmit = async () => {
        setIsConfirmOpen(false);
        const validFields = fields.filter(f => f.name.trim() !== '');

        try {
            setLoading(true);
            const data = {
                name: name.trim(),
                fields: validFields.map((f, index) => ({ 
                    name: f.name.trim(), 
                    label: f.name.trim(),
                    field_type: f.field_type,
                    order: index
                }))
            };
            const response = await createEnrollmentList(data);
            onCreated(response);
            setName('');
            setFields([{ name: '', field_type: 'text' }]);
            onClose();
        } catch (err) {
            console.error('Error creando enrollment:', err);
            let errorMessage = 'Hubo un error al crear el enrollment.';
            
            if (err.response?.data) {
                const data = err.response.data;
                if (typeof data === 'string') {
                    errorMessage = data;
                } else if (data.error) {
                    errorMessage = data.error;
                } else if (data.detail) {
                    errorMessage = data.detail;
                } else {
                    // Si es un objeto de errores de validación, formatearlo
                    const details = Object.entries(data)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                        .join(' | ');
                    if (details) errorMessage = `Error de validación: ${details}`;
                }
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface-primary rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-border-base">
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-base bg-surface-secondary/50">
                    <h2 className="text-xl font-bold text-content-primary">Nuevo Padrón</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 text-content-secondary hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-content-secondary">Nombre del Padrón</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Comerciantes"
                            className="w-full px-4 py-2.5 bg-surface-secondary border border-border-base rounded-xl text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all"
                            autoFocus
                        />
                    </div>
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
                        Guardar Padrón
                    </button>
                </div>
            </div>
        </div>

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Guardar Cambios</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro que deseas guardar este padrón?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSubmit} className="bg-brand-blue hover:bg-blue-600 shadow-blue-500/20">Sí, guardar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default CreateEnrollmentModal;
