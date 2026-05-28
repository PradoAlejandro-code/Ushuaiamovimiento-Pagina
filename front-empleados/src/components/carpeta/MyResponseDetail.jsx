import React, { useState } from 'react';
import { useResponseDetail } from '../../queries/useResponses';
import Card from '../ui/CustomCard';
import { ArrowLeft, Calendar, MapPin, Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';

const MyResponseDetail = ({ responseId, onBack }) => {
    const [gallery, setGallery] = useState({ isOpen: false, images: [], currentIndex: 0 });

    // Fetch Response Detail with React Query
    const { data: respuesta, isLoading: loading } = useResponseDetail(responseId);

    const openGallery = (images, index) => setGallery({ isOpen: true, images, currentIndex: index });
    const closeGallery = () => setGallery({ ...gallery, isOpen: false });
    const nextImage = (e) => { if (e) e.stopPropagation(); setGallery(p => ({ ...p, currentIndex: (p.currentIndex + 1) % p.images.length })); };
    const prevImage = (e) => { if (e) e.stopPropagation(); setGallery(p => ({ ...p, currentIndex: (p.currentIndex - 1 + p.images.length) % p.images.length })); };

    if (loading) {
        return (
            <Card className="!p-0 overflow-hidden border-border-base bg-surface-primary shadow-xl rounded-2xl flex flex-col h-[760px] max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] w-full max-w-full">
                <div className="shrink-0 flex items-center justify-between p-4 md:p-6 bg-surface-secondary/30 border-b border-border-base">
                    <div className="flex items-center gap-3 md:gap-4 w-full min-w-0 animate-pulse">
                        <div className="flex-shrink-0 w-10 h-10 bg-surface-secondary/50 rounded-xl" />
                        <div className="space-y-2 min-w-0 flex-1">
                            <div className="h-4 md:h-5 w-full max-w-[160px] bg-surface-secondary/50 rounded-md" />
                            <div className="h-3 w-3/4 max-w-[96px] bg-surface-secondary/30 rounded-md" />
                        </div>
                    </div>
                </div>
                <div className="flex-1 p-6 bg-surface-primary overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex flex-col p-4 rounded-xl border border-border-base bg-surface-secondary/20 h-[100px] animate-pulse" />
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    if (!respuesta) {
        return (
            <div className="text-center py-12">
                <p>No se pudo cargar el detalle de la respuesta.</p>
                <button onClick={onBack} className="text-brand-blue underline mt-4">Volver</button>
            </div>
        );
    }

    const fields = [
        { id: 'seccion', label: 'Sección', value: respuesta.seccion, isLocation: true },
        { id: 'barrio', label: 'Barrio', value: respuesta.barrio, isLocation: true },
        ...(respuesta.detalles_completos || respuesta.detalles || []).map(d => ({
            id: `p_${d.pregunta_id || d.pregunta}`,
            label: d.pregunta_titulo || d.pregunta?.titulo || `Pregunta`,
            value: d.valor_texto || d.valor_numero,
            foto: d.valor_foto,
            fotos_extra: d.fotos_extra || [],
            pregunta_tipo: d.pregunta_tipo || d.pregunta?.tipo
        }))
    ];

    const visibleFields = fields.filter(f => {
        if (f.pregunta_tipo === 'foto') return false;
        return (f.value !== null && f.value !== '' && f.value !== undefined) || f.foto || (f.fotos_extra && f.fotos_extra.length > 0);
    });

    return (
        <>
            <Card className="!p-0 overflow-hidden border-border-base bg-surface-primary shadow-xl rounded-2xl flex flex-col h-[760px] max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] w-full max-w-full">
                <div className="shrink-0 flex items-center justify-between p-4 md:p-6 bg-surface-secondary/30 border-b border-border-base gap-4">
                    <div className="flex items-center gap-4 min-w-0 max-w-full flex-1">
                        <button onClick={onBack} className="flex-shrink-0 p-2.5 bg-surface-primary border border-border-base hover:bg-surface-secondary rounded-xl transition-all text-content-secondary shadow-sm active:scale-95">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base md:text-lg font-black text-content-primary leading-tight truncate overflow-hidden">
                                Respuesta #{respuesta.id}
                            </h2>
                            <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-content-secondary mt-1">
                                <Calendar size={12} />
                                <span>{respuesta.fecha_format || respuesta.fecha_envio}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-6 bg-surface-primary overflow-y-auto custom-scrollbar">
                    {visibleFields.length === 0 ? (
                        <div className="py-10 flex items-center justify-center text-content-secondary font-medium">No hay respuestas registradas para mostrar.</div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {(respuesta.fotos_agrupadas && respuesta.fotos_agrupadas.length > 0) && (
                                <div className="p-4 rounded-xl border border-border-base bg-surface-secondary/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <ImageIcon size={18} className="text-brand-purple" />
                                        <h4 className="text-sm font-black text-content-primary uppercase tracking-wide">Galería</h4>
                                        <span className="text-xs font-bold px-2 py-0.5 bg-brand-purple/10 text-brand-purple rounded-full">
                                            {respuesta.fotos_agrupadas.length} fotos
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {respuesta.fotos_agrupadas.map((foto, idx) => (
                                            <button
                                                key={foto.id}
                                                onClick={() => openGallery(respuesta.fotos_agrupadas.map(f => f.archivo || f.imagen), idx)}
                                                className="relative group shrink-0 overflow-hidden rounded-lg border border-border-base focus:outline-none w-24 h-24 shadow-sm hover:shadow-md transition-all"
                                            >
                                                <img src={foto.archivo || foto.imagen} alt="Evidencia" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ImageIcon size={20} className="text-white drop-shadow-md" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                                {visibleFields.map((field, idx) => (
                                    <div key={idx} className="flex flex-col p-4 rounded-xl border border-border-base bg-surface-secondary/20 hover:bg-surface-secondary/40 transition-colors">
                                        <div className="flex items-start gap-2 mb-2">
                                            {field.isLocation && <MapPin size={14} className="text-brand-orange mt-0.5 shrink-0" />}
                                            <h4 className="text-[11px] font-black text-content-secondary uppercase tracking-wider leading-relaxed">{field.label}</h4>
                                        </div>
                                        {field.value !== null && field.value !== '' && field.value !== undefined ? (
                                            <p className="text-sm font-semibold text-content-primary break-words whitespace-pre-wrap max-w-full overflow-hidden">{field.value}</p>
                                        ) : (
                                            <p className="text-sm font-medium text-content-secondary/50 italic">Sin texto</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {gallery.isOpen && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/98 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeGallery}>
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

export default MyResponseDetail;
