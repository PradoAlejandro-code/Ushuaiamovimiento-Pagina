import React, { useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { CircleAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";

const QuestionViewerPhoto = ({ question, onChange, value, onProcessingStatus }) => {
    // Estado interno que guarda objetos: { id, file, previewUrl }
    const [images, setImages] = useState([]);
    const [warningMsg, setWarningMsg] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // Estado para controlar la pantalla de carga general
    const [isProcessingAll, setIsProcessingAll] = useState(false);

    const fileInputRef = useRef(null);

    // 1. Sincronización Inicial (Carga URLs guardadas de tu backend)
    useEffect(() => {
        if (!value || value.length === 0) {
            setImages([]);
        } else if (images.length === 0 && value.length > 0) {
            const initialImages = value.map((val, idx) => {
                const isUrl = typeof val === 'string';
                return {
                    id: `init_${idx}_${Date.now()}`,
                    file: val,
                    previewUrl: isUrl ? val : URL.createObjectURL(val)
                };
            });
            setImages(initialImages);
        }
    }, [value]);

    // Función para actualizar al padre
    const updateParent = (currentImages) => {
        const validFiles = currentImages.map(img => img.file);
        onChange(validFiles.length > 0 ? validFiles : null);
    };

    // 2. PROCESAMIENTO ESTRICTO Y PREVIO
    const processFiles = async (filesList) => {
        const filesArray = Array.from(filesList);

        // RECHAZO TOTAL: Si la suma de las que ya hay + las nuevas supera 10, no hacemos NADA.
        if (images.length + filesArray.length > 10) {
            setWarningMsg("⚠️ Solo puedes subir un máximo de 10 fotos en total.");
            setTimeout(() => setWarningMsg(''), 4000);
            return; // Cortamos la ejecución aquí
        }

        // Activamos la pantalla de carga
        setIsProcessingAll(true);
        if (onProcessingStatus) onProcessingStatus(question.id, true);

        const processedImages = [];

        // Comprimimos todas PRIMERO antes de mostrarlas
        for (const f of filesArray) {
            try {
                let safeName = f.name || 'foto.jpg';
                if (safeName === 'blob' || safeName === 'image.blob' || !safeName.includes('.')) safeName = 'foto.jpg';

                const options = {
                    maxSizeMB: 2.0,
                    maxWidthOrHeight: 2048,
                    useWebWorker: true,
                    initialQuality: 0.90
                };

                const compressedBlob = await imageCompression(f, options);
                const compressedFile = new File([compressedBlob], `optimizado_${safeName}`, { type: compressedBlob.type });

                // Creamos la URL de preview SOLO para la imagen ya liviana
                processedImages.push({
                    id: `img_${Date.now()}_${Math.random()}`,
                    file: compressedFile,
                    previewUrl: URL.createObjectURL(compressedFile)
                });

            } catch (error) {
                console.error("Error al comprimir:", error);
            }
        }

        // Una vez que TODAS están listas y comprimidas, las sumamos al estado
        const newTotalImages = [...images, ...processedImages];
        setImages(newTotalImages);
        updateParent(newTotalImages);

        // Desactivamos la pantalla de carga
        setIsProcessingAll(false);
        if (onProcessingStatus) onProcessingStatus(question.id, false);
    };

    // 3. EVENTOS DRAG & DROP
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleRemove = (idToRemove) => {
        const removedImg = images.find(img => img.id === idToRemove);
        const updatedImages = images.filter(img => img.id !== idToRemove);

        // Limpieza de RAM
        if (removedImg && typeof removedImg.file !== 'string') {
            URL.revokeObjectURL(removedImg.previewUrl);
        }

        setImages(updatedImages);
        updateParent(updatedImages);
    };

    return (
        <Card className="mb-4 relative border border-border-base border-l-4 border-l-brand-blue dark:border-l-brand-orange shadow-sm">
            <CardHeader className="pb-3">
                <CardDescription className="text-xs font-bold text-brand-blue dark:text-brand-orange uppercase tracking-wide transition-colors">
                    {question.obligatoria ? "Foto Requerida *" : "Fotos Opcionales"}
                </CardDescription>
                <CardTitle className="text-lg font-medium text-content-primary transition-colors">
                    {question.titulo}
                </CardTitle>
                {question.obligatoria && (
                    <CardAction>
                        <div className="text-red-500 mt-1" title="Pregunta Obligatoria">
                            <CircleAlert size={20} />
                        </div>
                    </CardAction>
                )}
            </CardHeader>

            <CardContent>
                {warningMsg && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm font-semibold transition-all animate-in fade-in slide-in-from-top-2 mb-4">
                        {warningMsg}
                    </div>
                )}

                {/* PANTALLA DE CARGA GENERAL */}
                {isProcessingAll && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-primary/80 backdrop-blur-[2px] transition-all rounded-xl">
                        <div className="bg-surface-primary p-4 rounded-xl shadow-lg border border-border-base flex flex-col items-center">
                            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-2"></div>
                            <span className="text-sm font-bold text-content-primary">Optimizando fotos...</span>
                            <span className="text-xs text-content-secondary mt-1">Por favor espera</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">

                    {images.map(img => (
                        <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-border-base bg-surface-secondary/20 group shadow-sm transition-all hover:shadow-md">
                            <img
                                src={img.previewUrl}
                                alt="preview"
                                className="w-full h-full object-cover"
                            />

                            <button
                                onClick={() => handleRemove(img.id)}
                                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-500 backdrop-blur-sm"
                                title="Eliminar foto"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    ))}

                    {/* LÍMITE AHORA ES 10 */}
                    {images.length < 10 && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                                ${isDragging
                                    ? 'border-brand-blue bg-brand-blue/10 scale-105'
                                    : 'border-border-base hover:bg-surface-secondary/50 hover:border-content-secondary'
                                }
                            `}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => { processFiles(e.target.files); e.target.value = ''; }}
                                accept="image/*"
                                multiple
                                className="hidden"
                            />

                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-content-secondary mb-2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>

                            <span className="text-xs text-content-secondary text-center px-2 font-medium">
                                Arrastra o toca<br />
                                <span className="opacity-70 text-[10px]">(Máx 10)</span>
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default QuestionViewerPhoto;