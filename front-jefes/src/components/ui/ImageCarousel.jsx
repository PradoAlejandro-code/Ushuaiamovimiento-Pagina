import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, Trash2 } from 'lucide-react';

export default function ImageCarousel({
    images,
    onDelete, // (id, isLegacy) => void. Si se pasa, muestra botón borrar.
    readOnly = false
}) {
    if (!images || images.length === 0) return null;

    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const handlePrev = (e) => {
        e.stopPropagation();
        setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = (e) => {
        e.stopPropagation();
        setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const currentImage = images[activeIndex];

    // Helper para URL segura
    const getSecureUrl = (url) => {
        if (!url) return "";
        if (url.startsWith('http://api.ushuaiamovimiento.com.ar')) {
            return url.replace('http://', 'https://');
        }
        return url;
    };

    return (
        <div className="relative group w-full max-w-md mx-auto">
            {/* Main Image Card */}
            <div
                className={`relative overflow-hidden rounded-xl border border-gray-200 bg-black/5 aspect-[4/3] cursor-pointer`}
                onClick={() => setLightboxOpen(true)}
            >
                <img
                    src={getSecureUrl(currentImage.url)}
                    alt={`Imagen ${activeIndex + 1}`}
                    className="w-full h-full object-contain"
                />

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-between p-2">
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="p-1 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={handleNext}
                                className="p-1 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </>
                    )}
                </div>

                {/* Bottom Bar Info */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    {activeIndex + 1} / {images.length}
                </div>

                {/* Delete Button (Edit Mode) */}
                {!readOnly && onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("¿Eliminar esta foto? Deberás guardar los cambios para confirmar.")) {
                                onDelete(currentImage.id, currentImage.isLegacy);
                            }
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors z-10"
                        title="Eliminar foto"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {/* Lightbox Modal */}
            {lightboxOpen && (
                <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center animate-in fade-in duration-200" onClick={() => setLightboxOpen(false)}>
                    <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full" onClick={() => setLightboxOpen(false)}>
                        <X size={32} />
                    </button>

                    <img
                        src={getSecureUrl(currentImage.url)}
                        className="max-h-[90vh] max-w-[90vw] object-contain"
                        onClick={(e) => e.stopPropagation()} // Prevent close on image click
                    />

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrev(e); }}
                                className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full"
                            >
                                <ChevronLeft size={48} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNext(e); }}
                                className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full"
                            >
                                <ChevronRight size={48} />
                            </button>
                        </>
                    )}

                    <div className="absolute bottom-4 text-white/50 text-sm">
                        {activeIndex + 1} de {images.length}
                    </div>
                </div>
            )}
        </div>
    );
}
