import { useState, useEffect } from 'react';
import { Camera, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const QuestionViewerPhoto = ({ question, onChange, value }) => {
    const [previews, setPreviews] = useState([]);
    const [compressingCount, setCompressingCount] = useState(0);

    // Sincronizar previsualizaciones con el estado global de respuestas
    useEffect(() => {
        if (value && Array.isArray(value)) {
            const newPreviews = value
                .filter(f => f instanceof File)
                .map(file => URL.createObjectURL(file));

            setPreviews(newPreviews);

            return () => {
                newPreviews.forEach(url => URL.revokeObjectURL(url));
            };
        } else {
            setPreviews([]);
        }
    }, [value]);

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);

            // Establecemos cuántos archivos se están procesando para mostrar los loaders
            setCompressingCount(selectedFiles.length);

            const options = {
                maxSizeMB: 0.8, // 800KB max size
                maxWidthOrHeight: 1280,
                useWebWorker: true
            };

            try {
                // Comprimir todas las imágenes seleccionadas
                const compressedFiles = await Promise.all(
                    selectedFiles.map(async (file) => {
                        // Solo intentamos comprimir si es imagen
                        if (file.type.startsWith('image/')) {
                            try {
                                console.log(`Comprimiendo ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
                                const compressedFile = await imageCompression(file, options);
                                console.log(`Resultado ${file.name}: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
                                return compressedFile;
                            } catch (error) {
                                console.error("Error al comprimir imagen:", error);
                                // Si falla, devolvemos el original para no bloquear al usuario
                                return file;
                            }
                        }
                        return file;
                    })
                );

                // LÓGICA ACUMULATIVA: 
                // Si ya hay archivos previos (value), los combinamos con los nuevos seleccionados
                const previousFiles = Array.isArray(value) ? value : [];
                const combinedFiles = [...previousFiles, ...compressedFiles];

                // Notificar al padre con la lista completa aumentada
                onChange(combinedFiles);
            } catch (error) {
                console.error("Error procesando archivos:", error);
            } finally {
                // Terminó el proceso (éxito o error), quitamos los loaders
                setCompressingCount(0);
                // Limpiamos el input para permitir subir el mismo archivo si se desea (aunque es raro en uso normal)
                e.target.value = '';
            }
        }
    };

    const removeFile = (indexToRemove, e) => {
        e.preventDefault();
        e.stopPropagation();

        // Filtrar la lista de archivos para quitar solo el que el usuario eligió
        const updatedFiles = value.filter((_, idx) => idx !== indexToRemove);

        // Si no quedan archivos, mandamos null, si no, la lista actualizada
        onChange(updatedFiles.length > 0 ? updatedFiles : null);
    };

    const clearAll = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(null);
    };

    return (
        <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-base mb-4 hover:shadow-md transition-all border-l-4 border-l-pink-500 dark:border-l-pink-400">
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <label className="block text-xs font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-wide mb-1">
                            {question.obligatoria ? "Foto Requerida *" : "Fotos Opcionales"}
                        </label>
                        <h3 className="text-lg font-medium text-content-primary">
                            {question.titulo}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                            <ImageIcon size={12} className="text-content-secondary" />
                            <p className="text-xs text-content-secondary">Toca para agregar más fotos.</p>
                        </div>
                    </div>
                    {previews.length > 0 && !compressingCount && (
                        <button onClick={clearAll} className="text-xs text-red-500 font-bold hover:underline">
                            Borrar todas
                        </button>
                    )}
                </div>

                <div className="relative">
                    <div className={`border-2 border-dashed border-border-base rounded-lg p-4 flex flex-col items-center justify-center transition-colors min-h-[120px] ${compressingCount > 0 ? 'bg-gray-100 cursor-wait' : 'bg-surface-secondary/30 hover:bg-surface-secondary/50 cursor-pointer'}`}>

                        {(previews.length > 0 || compressingCount > 0) ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full">
                                {previews.map((src, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border-base group/item">
                                        <img src={src} alt="preview" className="w-full h-full object-cover" />
                                        {/* Botón individual para borrar una foto específica */}
                                        <button
                                            onClick={(e) => removeFile(idx, e)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity z-20"
                                            disabled={compressingCount > 0}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}

                                {/* Renderizamos los placeholders de carga si hay archivos comprimiéndose */}
                                {compressingCount > 0 && Array.from({ length: compressingCount }).map((_, idx) => (
                                    <div key={`loading-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-border-base bg-surface-secondary flex items-center justify-center animate-pulse">
                                        <Loader2 className="animate-spin text-pink-500" size={24} />
                                    </div>
                                ))}

                                {/* Botón "Añadir más" solo si NO estamos comprimiendo */}
                                {!compressingCount && (
                                    <div className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border-base rounded-lg text-content-secondary hover:text-pink-500 transition-colors">
                                        <Camera size={20} />
                                        <span className="text-[10px] font-bold mt-1">Añadir</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-full mb-2">
                                    <Camera size={24} className="text-pink-500 dark:text-pink-400" />
                                </div>
                                <span className="text-sm font-medium text-content-secondary text-center">Toca para subir o tomar fotos</span>
                            </>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 disabled:cursor-wait disabled:pointer-events-none"
                            onChange={handleFileChange}
                            disabled={compressingCount > 0}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionViewerPhoto;