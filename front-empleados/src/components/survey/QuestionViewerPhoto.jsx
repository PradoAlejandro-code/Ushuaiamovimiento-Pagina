import { useState, useEffect } from 'react';
import { Camera, X, Image as ImageIcon } from 'lucide-react';

const QuestionViewerPhoto = ({ question, onChange, value }) => {
    const [previews, setPreviews] = useState([]);

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

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);

            // LÓGICA ACUMULATIVA: 
            // Si ya hay archivos previos (value), los combinamos con los nuevos seleccionados
            const previousFiles = Array.isArray(value) ? value : [];
            const combinedFiles = [...previousFiles, ...selectedFiles];

            // Notificar al padre con la lista completa aumentada
            onChange(combinedFiles);
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
                    {previews.length > 0 && (
                        <button onClick={clearAll} className="text-xs text-red-500 font-bold hover:underline">
                            Borrar todas
                        </button>
                    )}
                </div>

                <div className="relative">
                    <div className="border-2 border-dashed border-border-base rounded-lg p-4 flex flex-col items-center justify-center bg-surface-secondary/30 hover:bg-surface-secondary/50 transition-colors cursor-pointer min-h-[120px]">

                        {previews.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full">
                                {previews.map((src, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border-base group/item">
                                        <img src={src} alt="preview" className="w-full h-full object-cover" />
                                        {/* Botón individual para borrar una foto específica */}
                                        <button
                                            onClick={(e) => removeFile(idx, e)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity z-20"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                {/* Botón "Añadir más" dentro de la grilla */}
                                <div className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border-base rounded-lg text-content-secondary hover:text-pink-500 transition-colors">
                                    <Camera size={20} />
                                    <span className="text-[10px] font-bold mt-1">Añadir</span>
                                </div>
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
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionViewerPhoto;