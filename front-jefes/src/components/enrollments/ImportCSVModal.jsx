import React, { useState } from 'react';
import { X, Upload, CheckCircle, AlertCircle, Table as TableIcon, Loader2, Info } from 'lucide-react';
// Asegurate de que confirmImport en tu api/enrollments.js envíe FormData a la ruta /confirm
import { previewImport, confirmImport, getImportStatus } from '../../api/enrollments';

const ImportCSVModal = ({ isOpen, onClose, enrollment, padron, onImported }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); 
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [importing, setImporting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [totalRows, setTotalRows] = useState(0);
    const [importStats, setImportStats] = useState(null);
    const [mapping, setMapping] = useState({}); // { csvHeader: { personField: '...', keepInPadron: true } }
    
    // Compatibilidad por si el prop sigue llamándose padron en algún lado
    const currentEnrollment = enrollment || padron;

    if (!isOpen || !currentEnrollment) return null;

    const personFields = [
        { id: 'dni', label: 'DNI / Documento' },
        { id: 'first_name', label: 'Nombre' },
        { id: 'last_name', label: 'Apellido' },
        { id: 'email', label: 'Email' },
        { id: 'phone', label: 'Teléfono' },
        { id: 'profession', label: 'Profesión' },
        { id: 'address', label: 'Domicilio' },
        { id: 'city', label: 'Ciudad' },
        { id: 'birth_date', label: 'Fecha Nac.' },
        { id: 'is_affiliate', label: 'Es Afiliado' },
        { id: 'gender', label: 'Género' },
        { id: 'employment_status', label: 'Estado Empleado' },
        { id: 'workplace', label: 'Lugar de Trabajo' },
    ];

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        try {
            setFile(selectedFile);
            setLoading(true);
            setError('');
            
            const formData = new FormData();
            const chunk = selectedFile.slice(0, 1024 * 1024);
            formData.append('file', new File([chunk], selectedFile.name, { type: selectedFile.type }));
            formData.append('total_size', selectedFile.size);
            
            const response = await previewImport(currentEnrollment.id, formData);
            setPreview(response);
            setTotalRows(response.total_rows);
            
            const initialMapping = {};
            response.headers.forEach(h => {
                const hUpper = h.toUpperCase();
                let personField = '';
                if (hUpper.includes('DNI') || hUpper.includes('DOCUMENTO')) personField = 'dni';
                else if (hUpper.includes('NOMBRE')) personField = 'first_name';
                else if (hUpper.includes('APELLIDO')) personField = 'last_name';
                else if (hUpper.includes('MAIL')) personField = 'email';
                else if (hUpper.includes('TEL')) personField = 'phone';
                
                initialMapping[h] = {
                    personField: personField,
                    keepInPadron: personField === '',
                    overwrite: false
                };
            });
            setMapping(initialMapping);
            setStep(2);
        } catch (err) {
            console.error('Error al cargar cabeceras:', err);
            setError(err.response?.data?.error || 'Error al procesar el archivo. Verifica el formato.');
            setFile(null);
        } finally {
            setLoading(false);
        }
    };

    const handleMapChange = (header, field, value) => {
        setMapping(prev => {
            const nextCell = { ...prev[header], [field]: value };
            if (field === 'personField' && !value) {
                nextCell.overwrite = false;
            }
            return {
                ...prev,
                [header]: nextCell
            };
        });
    };

    const handleConfirm = async () => {
        try {
            setImporting(true);
            setUploadProgress(0);
            setError('');

            const CHUNK_SIZE = 20 * 1024 * 1024;
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            const uploadId = `${Date.now()}_${file.size}`;

            for (let i = 0; i < totalChunks; i++) {
                // ... (lógica de subida igual)
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                const formData = new FormData();
                formData.append('file', chunk);
                formData.append('upload_id', uploadId);
                formData.append('chunk_index', i);
                formData.append('total_chunks', totalChunks);
                formData.append('mapping', JSON.stringify(mapping));

                setUploadProgress(Math.round((i / totalChunks) * 100));

                const response = await confirmImport(currentEnrollment.id, formData);
                
                if (response.status === 'success' || response.status === 'processing') {
                    setUploadProgress(100);
                    
                    if (response.status === 'success' && response.stats) {
                        setImportStats(response.stats);
                        setSuccess(response.message || 'Importación completada.');
                        setStep(3);
                    } else {
                        // Es procesamiento de fondo, empezamos polling
                        setSuccess('Archivo subido. Procesando datos...');
                        setStep(3);
                        
                        const pollInterval = setInterval(async () => {
                            try {
                                const statusRes = await getImportStatus(currentEnrollment.id);
                                if (statusRes.status === 'completed') {
                                    setImportStats(statusRes.stats);
                                    setSuccess('¡Procesamiento completado!');
                                    clearInterval(pollInterval);
                                } else if (statusRes.status === 'error') {
                                    setError('Error durante el procesamiento de fondo.');
                                    clearInterval(pollInterval);
                                }
                            } catch (pollErr) {
                                console.error('Error polling:', pollErr);
                            }
                        }, 2000);
                    }
                    return;
                }
            }
        } catch (err) {
            console.error('Error en importación:', err);
            setError(err.response?.data?.error || 'Error crítico en el servidor durante la importación.');
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        if (importing) return; 
        setFile(null);
        setPreview(null);
        setMapping({});
        setStep(1);
        setError('');
        setSuccess('');
        setTotalRows(0);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface-primary rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col border border-border-base max-h-[90vh]">
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-base bg-surface-secondary/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-orange/10 text-brand-orange rounded-lg">
                            <Upload size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-content-primary">Importar Datos a {currentEnrollment.name}</h2>
                            <p className="text-xs text-content-tertiary">Sube un archivo CSV</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        disabled={importing}
                        className="p-2 text-content-secondary hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-3 animate-in shake duration-300">
                            <AlertCircle size={20} />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl flex items-center gap-3 animate-in zoom-in duration-300">
                            <CheckCircle size={20} />
                            <p className="text-sm font-medium">{success}</p>
                        </div>
                    )}

                    {importing && (
                        <div className="mb-8 p-8 bg-brand-blue/5 rounded-2xl border border-brand-blue/10 flex flex-col items-center text-center">
                            <Loader2 className="text-brand-blue animate-spin mb-4" size={40} />
                            <h3 className="text-xl font-bold text-content-primary mb-2">Procesando Importación en el Servidor</h3>
                            <div className="w-full max-w-xs bg-surface-secondary rounded-full h-2 mb-4 overflow-hidden border border-border-base">
                                <div 
                                    className="bg-brand-blue h-full transition-all duration-300" 
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="text-content-secondary mb-2">
                                {uploadProgress < 100 
                                    ? `Subiendo archivo: ${uploadProgress}%` 
                                    : 'Procesando datos en el servidor...'}
                            </p>
                            <p className="text-xs font-bold text-brand-blue uppercase tracking-widest">
                                Por favor, no cierres esta ventana.
                            </p>
                        </div>
                    )}

                    {step === 1 && !importing && (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border-base rounded-2xl bg-surface-secondary/30">
                            <Upload className="text-content-tertiary mb-4" size={48} />
                            <h3 className="text-lg font-semibold text-content-primary mb-2">Selecciona tu archivo CSV</h3>
                            <p className="text-sm text-content-secondary mb-6 text-center max-w-xs">
                                El archivo será procesado directamente por el servidor.
                            </p>
                            
                            <label className="relative cursor-pointer">
                                <span className="px-6 py-3 bg-brand-blue hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                                    {file ? file.name : 'Elegir Archivo'}
                                </span>
                                <input 
                                    type="file" 
                                    accept=".csv,.txt" 
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </label>

                        </div>
                    )}

                    {step === 2 && !importing && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-surface-secondary p-4 rounded-xl border border-border-base">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-surface-primary rounded-lg flex items-center justify-center border border-border-base">
                                        <TableIcon className="text-brand-blue" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-content-primary">Configurar Importación</p>
                                        <p className="text-xs text-content-tertiary">Mapea las columnas del CSV a los campos del sistema.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-xs font-semibold text-brand-blue hover:underline"
                                >
                                    Cambiar archivo
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-bold text-content-tertiary uppercase tracking-wider">
                                    <div className="col-span-3">Columna CSV</div>
                                    <div className="col-span-4">Campo en Personas</div>
                                    <div className="col-span-2 text-center">En Padrón</div>
                                    <div className="col-span-3 text-center">Sobrescribir si existe</div>
                                </div>
                                
                                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {preview.headers.map((header, i) => (
                                        <div key={i} className="grid grid-cols-12 gap-4 items-center p-3 bg-surface-secondary/50 rounded-xl border border-border-base hover:border-brand-blue/30 transition-colors">
                                            <div className="col-span-3 truncate font-bold text-sm text-content-primary" title={header}>
                                                {header}
                                            </div>
                                            
                                            <div className="col-span-4">
                                                <select 
                                                    className="w-full bg-surface-primary border border-border-base rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-blue/20"
                                                    value={mapping[header]?.personField || ''}
                                                    onChange={(e) => handleMapChange(header, 'personField', e.target.value)}
                                                >
                                                    <option value="">-- No vincular --</option>
                                                    {personFields.map(pf => (
                                                        <option key={pf.id} value={pf.id}>{pf.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="col-span-2 flex justify-center">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer"
                                                        checked={mapping[header]?.keepInPadron || false}
                                                        onChange={(e) => handleMapChange(header, 'keepInPadron', e.target.checked)}
                                                    />
                                                    <div className="w-9 h-5 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-blue"></div>
                                                </label>
                                            </div>

                                            <div className="col-span-3 flex justify-center">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer"
                                                        checked={mapping[header]?.overwrite || false}
                                                        onChange={(e) => handleMapChange(header, 'overwrite', e.target.checked)}
                                                        disabled={!mapping[header]?.personField} 
                                                    />
                                                    <div className="w-9 h-5 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-blue peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-brand-blue/5 rounded-xl border border-brand-blue/10 flex items-start gap-3">
                                <Info className="text-brand-blue shrink-0 mt-0.5" size={16} />
                                <p className="text-[11px] text-content-secondary leading-relaxed">
                                    Las columnas mapeadas a <strong>Personas</strong> actualizarán la base central. 
                                    Si marcas <strong>En Padrón</strong>, el dato se guardará específicamente en este listado.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                                <CheckCircle size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-content-primary mb-2">¡Importación Procesada!</h3>
                            <p className="text-content-secondary max-w-sm mb-8">
                                El servidor ha recibido los datos y los está integrando al listado.
                            </p>

                            {importStats && (
                                <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-8">
                                    <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl text-center">
                                        <p className="text-[10px] font-bold text-green-500 uppercase mb-1">Nuevos</p>
                                        <p className="text-2xl font-black text-green-500">{importStats.new}</p>
                                    </div>
                                    <div className="p-4 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl text-center">
                                        <p className="text-[10px] font-bold text-brand-blue uppercase mb-1">Vinculados</p>
                                        <p className="text-2xl font-black text-brand-blue">{importStats.linked}</p>
                                    </div>
                                    <div className="p-4 bg-surface-secondary border border-border-base rounded-2xl text-center">
                                        <p className="text-[10px] font-bold text-content-tertiary uppercase mb-1">Duplicados</p>
                                        <p className="text-2xl font-black text-content-tertiary">{importStats.duplicates}</p>
                                    </div>
                                </div>
                            )}

                            {!importStats && (
                                <div className="p-4 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl flex items-center gap-3 mb-8">
                                    <Info className="text-brand-blue" size={20} />
                                    <p className="text-xs text-content-secondary font-medium">
                                        Al ser un archivo grande, las estadísticas finales se reflejarán en la tabla en unos segundos.
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    onImported();
                                    handleClose();
                                }}
                                className="px-8 py-3 bg-brand-blue hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                            >
                                <CheckCircle size={20} />
                                Entendido, finalizar
                            </button>
                        </div>
                    )}
                </div>

                {step !== 3 && (
                    <div className="p-4 sm:p-6 border-t border-border-base bg-surface-secondary/50 flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-2.5 rounded-xl text-content-secondary hover:bg-surface-primary border border-border-base font-medium transition-colors"
                            disabled={loading || importing}
                        >
                            Cancelar
                        </button>
                        {step === 2 && (
                            <button
                                onClick={handleConfirm}
                                disabled={loading || importing}
                                className="px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {importing ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : <CheckCircle size={20} />}
                                {importing ? 'Procesando...' : 'Confirmar e Importar'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportCSVModal;
