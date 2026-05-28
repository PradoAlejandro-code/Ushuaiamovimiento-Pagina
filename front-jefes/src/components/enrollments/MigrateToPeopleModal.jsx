import React, { useState } from 'react';
import { X, Users, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import apiClient from '../../api/client';

const MigrateToPeopleModal = ({ isOpen, onClose, enrollment, onMigrated }) => {
    const [mapping, setMapping] = useState({});
    const [createNew, setCreateNew] = useState(true);
    const [newName, setNewName] = useState(`${enrollment?.name} (Limpio)`);
    const [includeExtraColumns, setIncludeExtraColumns] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const personFields = [
        { id: 'first_name', label: 'Nombre' },
        { id: 'last_name', label: 'Apellido' },
        { id: 'dni', label: 'DNI / Documento' },
        { id: 'email', label: 'Email' },
        { id: 'phone', label: 'Teléfono' },
        { id: 'profession', label: 'Profesión' },
        { id: 'is_affiliate', label: 'Es Afiliado' },
        { id: 'address', label: 'Domicilio' },
        { id: 'city', label: 'Ciudad' },
        { id: 'birth_date', label: 'Fecha Nac.' },
        { id: 'gender', label: 'Género' },
        { id: 'employment_status', label: 'Estado Empleado' },
        { id: 'workplace', label: 'Lugar de Trabajo' },
    ];

    if (!isOpen || !enrollment) return null;

    const handleMapChange = (columnId, personField) => {
        setMapping(prev => {
            const newMap = { ...prev };
            if (personField === '') {
                delete newMap[columnId];
            } else {
                newMap[columnId] = personField;
            }
            return newMap;
        });
    };

    const handleMigrate = async () => {
        if (Object.keys(mapping).length === 0) {
            setError('Debes mapear al menos un campo.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const response = await apiClient.post(`/api/enrollments/lists/${enrollment.id}/migrate-to-people/`, {
                mapping,
                create_new: createNew,
                new_name: newName,
                include_extra_columns: includeExtraColumns
            });
            setResult(response);
            if (onMigrated) onMigrated();
        } catch (err) {
            setError(err.response?.data?.error || 'Error durante la migración');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-primary rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col border border-border-base">
                <div className="flex items-center justify-between p-6 border-b border-border-base">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">
                            <Users size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-content-primary">Migrar a Base de Personas</h2>
                    </div>
                    <button onClick={onClose} className="text-content-secondary hover:text-content-primary transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                    {result ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="flex justify-center">
                                <div className="p-4 bg-green-500/10 text-green-500 rounded-full">
                                    <CheckCircle size={48} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-content-primary">¡Migración Exitosa!</h3>
                            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                                <div className="p-4 bg-surface-secondary rounded-xl border border-border-base">
                                    <div className="text-2xl font-bold text-brand-blue">{result.created_people}</div>
                                    <div className="text-xs text-content-tertiary uppercase font-bold">Nuevas Personas</div>
                                </div>
                                <div className="p-4 bg-surface-secondary rounded-xl border border-border-base">
                                    <div className="text-2xl font-bold text-green-500">{result.linked_records}</div>
                                    <div className="text-xs text-content-tertiary uppercase font-bold">Registros Vinculados</div>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="mt-6 px-8 py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-all"
                            >
                                Entendido
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 bg-brand-blue/5 border border-brand-blue/10 rounded-xl space-y-4">
                                <p className="text-sm text-content-secondary">
                                    Selecciona qué columnas de este padrón corresponden a los campos de la base central de personas.
                                </p>
                                
                                <div className="space-y-3 pt-2 border-t border-brand-blue/10">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={createNew} 
                                            onChange={(e) => setCreateNew(e.target.checked)}
                                            className="w-4 h-4 rounded border-border-base text-brand-blue focus:ring-brand-blue"
                                        />
                                        <span className="text-sm font-bold text-content-primary group-hover:text-brand-blue transition-colors">
                                            Crear nuevo padrón limpio con estos datos
                                        </span>
                                    </label>

                                    {createNew && (
                                        <div className="pl-7 space-y-1.5">
                                            <label className="text-xs font-bold text-content-tertiary uppercase">Nombre del nuevo padrón</label>
                                            <input 
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="w-full bg-surface-primary border border-border-base rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue/20"
                                                placeholder="Ej: Afiliados Limpio"
                                            />
                                        </div>
                                    )}

                                    <label className="flex items-center gap-3 cursor-pointer group pt-1">
                                        <input 
                                            type="checkbox" 
                                            checked={includeExtraColumns} 
                                            onChange={(e) => setIncludeExtraColumns(e.target.checked)}
                                            className="w-4 h-4 rounded border-border-base text-brand-blue focus:ring-brand-blue"
                                        />
                                        <span className="text-sm font-medium text-content-secondary group-hover:text-brand-blue transition-colors">
                                            Traer también columnas que no sean de Personas
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 px-2 text-xs font-bold text-content-tertiary uppercase">
                                    <span>Columna del Padrón</span>
                                    <span>Campo en Personas</span>
                                </div>
                                
                                {enrollment.fields?.map(f => (
                                    <div key={f.id} className="grid grid-cols-2 gap-4 items-center p-3 bg-surface-secondary rounded-xl border border-border-base">
                                        <span className="text-sm font-semibold text-content-primary truncate">{f.label || f.name}</span>
                                        <div className="flex items-center gap-2">
                                            <ArrowRight size={14} className="text-content-tertiary" />
                                            <select 
                                                className="flex-1 bg-surface-primary border border-border-base rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue/20"
                                                value={mapping[f.name] || ''}
                                                onChange={(e) => handleMapChange(f.name, e.target.value)}
                                            >
                                                <option value="">-- No migrar --</option>
                                                {personFields.map(pf => (
                                                    <option key={pf.id} value={pf.id}>{pf.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex items-center gap-2">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!result && (
                    <div className="p-6 border-t border-border-base flex justify-end gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-content-secondary hover:bg-surface-secondary transition-colors">
                            Cancelar
                        </button>
                        <button 
                            onClick={handleMigrate}
                            disabled={loading}
                            className="px-6 py-2.5 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Migrando...' : 'Iniciar Migración'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MigrateToPeopleModal;
