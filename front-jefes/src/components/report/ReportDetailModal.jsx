import React, { useState } from 'react';
import { X, Calendar, User, FileText, AlignLeft, Image as ImageIcon, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';

const ReportDetailModal = ({ report, onClose, onEdit }) => {
    const [gallery, setGallery] = useState({ isOpen: false, images: [], currentIndex: 0 });

    const openGallery = (images, index) => setGallery({ isOpen: true, images, currentIndex: index });
    const closeGallery = () => setGallery({ ...gallery, isOpen: false });
    const nextImage = (e) => { if (e) e.stopPropagation(); setGallery(p => ({ ...p, currentIndex: (p.currentIndex + 1) % p.images.length })); };
    const prevImage = (e) => { if (e) e.stopPropagation(); setGallery(p => ({ ...p, currentIndex: (p.currentIndex - 1 + p.images.length) % p.images.length })); };

    // Deshabilitar scroll en el body cuando el modal está abierto
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    if (!report) return null;

    const { titulo, descripcion_breve, cuerpo, fotos_detalle, creado_por_nombre, creado_por_foto, fecha_creacion } = report;

    const fecha = new Date(fecha_creacion).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-primary/80 backdrop-blur-sm lg:pl-20">
                <div
                    className="absolute inset-0 z-0"
                    onClick={onClose}
                ></div>

                <div className="relative z-10 w-full max-w-5xl bg-surface-primary rounded-3xl shadow-2xl border border-border-base/30 overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border-base/30 bg-surface-secondary/30">
                        <h2 className="text-xl font-black text-content-primary uppercase tracking-wider flex items-center gap-2">
                            <FileText className="text-brand-blue" size={24} />
                            Detalle del Informe
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onEdit}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue/10 text-brand-blue hover:bg-brand-blue hover:text-white transition-all font-bold text-sm"
                            >
                                <Edit2 size={16} />
                                <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-surface-secondary text-content-secondary hover:text-content-primary transition-colors"
                                title="Cerrar"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                        {/* Meta info: Usuario y Fecha */}
                        <div className="flex items-center gap-6 px-4 py-3 bg-surface-secondary/50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-primary border border-border-base/50 flex items-center justify-center">
                                    {creado_por_foto ? (
                                        <img src={creado_por_foto} alt={creado_por_nombre} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={16} className="text-content-secondary" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-content-primary uppercase">
                                        {creado_por_nombre || 'Usuario'}
                                    </p>
                                </div>
                            </div>

                            <div className="h-6 border-l border-border-base/30"></div>

                            <div className="flex items-center gap-2 text-content-secondary">
                                <Calendar size={16} />
                                <span className="text-sm font-medium">{fecha}</span>
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <h3 className="text-2xl font-black text-content-primary leading-tight">
                                {titulo}
                            </h3>
                        </div>

                        {/* Description */}
                        <div className="space-y-4 pt-4 border-t border-border-base/30">
                            <div className="flex items-center gap-2 text-content-secondary px-2">
                                <AlignLeft size={18} />
                                <h4 className="text-sm font-black uppercase tracking-wider">Descripción Breve</h4>
                            </div>
                            <div className="p-4 bg-surface-secondary/30 rounded-2xl border border-border-base/30">
                                <p className="text-base text-content-primary whitespace-pre-wrap leading-relaxed italic opacity-80">
                                    {descripcion_breve || 'Sin descripción detallada disponible.'}
                                </p>
                            </div>
                        </div>

                        {/* Contenido (Cuerpo) */}
                        {cuerpo && (
                            <div className="space-y-4 pt-4 border-t border-border-base/30">
                                <div className="flex items-center gap-2 text-content-secondary px-2">
                                    <FileText size={18} />
                                    <h4 className="text-sm font-black uppercase tracking-wider">Desarrollo del Informe</h4>
                                </div>
                                <div className="p-6 bg-surface-primary rounded-2xl border border-border-base/30 shadow-sm">
                                    <div
                                        className="text-base text-content-primary leading-relaxed max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:mb-1 [&_p]:mb-3 [&_strong]:font-bold [&_em]:italic"
                                        dangerouslySetInnerHTML={{ __html: cuerpo }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Fotos */}
                        {fotos_detalle && fotos_detalle.length > 0 && (
                            <div className="space-y-4 pt-4 border-t border-border-base/30">
                                <div className="flex items-center gap-2 text-content-secondary px-2">
                                    <ImageIcon size={18} />
                                    <h4 className="text-sm font-black uppercase tracking-wider">Imágenes Adjuntas</h4>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {fotos_detalle.map((foto, idx) => (
                                        <button
                                            key={foto.id}
                                            onClick={() => openGallery(fotos_detalle.map(f => f.archivo), idx)}
                                            className="aspect-square rounded-2xl overflow-hidden border border-border-base/30 bg-surface-secondary/30 group relative focus:outline-none"
                                        >
                                            <img
                                                src={foto.archivo}
                                                alt="Imagen adjunta"
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <ImageIcon size={20} className="text-white drop-shadow-md" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-border-base/30 bg-surface-secondary/30 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl bg-surface-primary text-content-primary font-bold shadow-sm border border-border-base/50 hover:bg-surface-secondary transition-all"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>

            {/* LIGHTBOX */}
            {gallery.isOpen && (
                <div className="fixed top-0 right-0 bottom-0 left-0 lg:left-20 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeGallery}>
                    <button className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-black/40 hover:bg-black/70 text-white/70 hover:text-white rounded-full transition-all z-50 backdrop-blur-md border border-white/5" onClick={closeGallery}><X size={28} /></button>
                    {gallery.images.length > 1 && (
                        <>
                            <button className="absolute left-4 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-black/30 hover:bg-black/60 text-white/70 hover:text-white rounded-full transition-all backdrop-blur-md z-50 hidden md:flex border border-white/5" onClick={prevImage}><ChevronLeft size={36} /></button>
                            <button className="absolute right-4 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-black/30 hover:bg-black/60 text-white/70 hover:text-white rounded-full transition-all backdrop-blur-md z-50 hidden md:flex border border-white/5" onClick={nextImage}><ChevronRight size={36} /></button>
                        </>
                    )}
                    <div className="relative flex items-center justify-center w-full h-full p-2 md:p-0" onClick={(e) => e.stopPropagation()}>
                        <img src={gallery.images[gallery.currentIndex]} alt="Vista ampliada" className="w-auto h-auto max-w-full max-h-[92vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 select-none" />
                    </div>
                </div>
            )}
        </>
    );
};

export default ReportDetailModal;
