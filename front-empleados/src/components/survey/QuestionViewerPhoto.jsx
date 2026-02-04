import { useState, useEffect, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const QuestionViewerPhoto = ({ question, onChange, value, onProcessingStatus }) => {
    const [previews, setPreviews] = useState([]);
    const [processingCount, setProcessingCount] = useState(0);
    const abortControllerRef = useRef(null);

    // Notificar al padre sobre el estado de procesamiento
    useEffect(() => {
        if (onProcessingStatus) {
            onProcessingStatus(question.id, processingCount > 0);
        }
    }, [processingCount, question.id, onProcessingStatus]);

    // 1. Sincronización de Previsualizaciones
    useEffect(() => {
        if (value && Array.isArray(value)) {
            const newPreviews = value.map(file => {
                if (typeof file === 'string') return file;
                if (file instanceof Blob) return URL.createObjectURL(file);
                return null;
            }).filter(Boolean);

            setPreviews(newPreviews);

            return () => {
                newPreviews.forEach(url => {
                    if (typeof url === 'string' && url.startsWith('blob:')) URL.revokeObjectURL(url);
                });
            };
        } else {
            setPreviews([]);
        }
    }, [value]);

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);

            // 2. Iniciamos el contador de carga con el total
            setProcessingCount(selectedFiles.length);

            const options = {
                maxSizeMB: 0.8,
                maxWidthOrHeight: 1280,
                useWebWorker: true
            };

            try {
                let currentFiles = Array.isArray(value) ? [...value] : [];

                // 3. PROCESO SECUENCIAL: Actualizamos tras CADA foto
                for (const file of selectedFiles) {
                    let fileToSave = file;

                    if (file.type.startsWith('image/')) {
                        try {
                            fileToSave = await imageCompression(file, options);
                        } catch (err) {
                            console.error("Error comprimiendo:", err);
                        }
                    }

                    currentFiles = [...currentFiles, fileToSave];

                    // Notificamos al padre INMEDIATAMENTE
                    onChange(currentFiles);

                    // Bajamos el contador para que desaparezca un "Cargando" y aparezca la foto
                    setProcessingCount(prev => Math.max(0, prev - 1));
                }
            } catch (error) {
                console.error("Error general:", error);
                setProcessingCount(0);
            } finally {
                e.target.value = '';
            }
        }
    };

    const removeFile = (indexToRemove, e) => {
        e.preventDefault();
        e.stopPropagation();
        const updatedFiles = value.filter((_, idx) => idx !== indexToRemove);
        onChange(updatedFiles.length > 0 ? updatedFiles : null);
    };

    return (
        <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-base mb-4 border-l-4 border-l-brand-blue dark:border-l-brand-orange transition-all duration-300">
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <label className="block text-xs font-bold text-brand-blue dark:text-brand-orange uppercase tracking-wide mb-1 transition-colors">
                            {question.obligatoria ? "Foto Requerida *" : "Fotos Opcionales"}
                        </label>
                        <h3 className="text-lg font-medium text-content-primary transition-colors">
                            {question.titulo}
                        </h3>
                    </div>
                    {previews.length > 0 && processingCount === 0 && (
                        <button onClick={() => onChange(null)} className="text-xs text-red-500 font-bold hover:underline">
                            Borrar todas
                        </button>
                    )}
                </div>

                <div className="relative">
                    <div className={`border-2 border-dashed border-border-base rounded-lg p-4 min-h-[140px] flex items-center justify-center transition-all ${processingCount > 0 ? 'bg-surface-secondary/60' : 'bg-surface-secondary/20'}`}>

                        {(previews.length > 0 || processingCount > 0) ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full">
                                {previews.map((src, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border-base group">
                                        <img src={src} alt="preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeFile(idx)}
                                            className="absolute top-1 right-1 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm transition-all z-10"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}

                                {/* Cuadros de carga individuales según el remanente */}
                                {processingCount > 0 && Array.from({ length: processingCount }).map((_, i) => (
                                    <div key={`loading-${i}`} className="aspect-square rounded-lg border border-dashed border-brand-blue/30 dark:border-brand-orange/30 bg-brand-blue/5 dark:bg-brand-orange/10 flex flex-col items-center justify-center animate-pulse">
                                        <Loader2 className="animate-spin text-brand-blue dark:text-brand-orange mb-1" size={24} />
                                        <span className="text-[10px] text-brand-blue dark:text-brand-orange font-black uppercase text-center px-1">Cargando</span>
                                    </div>
                                ))}

                                {processingCount === 0 && (
                                    <div className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border-base rounded-lg text-content-secondary hover:text-brand-blue dark:hover:text-brand-orange hover:border-brand-blue dark:hover:border-brand-orange transition-all cursor-pointer group">
                                        <Camera size={20} className="group-hover:scale-110 transition-transform text-brand-blue dark:text-brand-orange" />
                                        <span className="text-[10px] font-bold mt-1">Añadir</span>
                                        <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-4 cursor-pointer relative w-full group">
                                <div className="bg-brand-blue/10 dark:bg-brand-orange/10 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                    <Camera size={24} className="text-brand-blue dark:text-brand-orange" />
                                </div>
                                <span className="text-sm font-medium text-content-secondary group-hover:text-brand-blue dark:group-hover:text-brand-orange transition-colors">Toca para subir o tomar fotos</span>
                                <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionViewerPhoto; 2