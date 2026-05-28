import React, { useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Image as ImageIcon, User, Edit3, Trash2, X } from 'lucide-react';
import Card from '../ui/Card';
import ImageCarousel from '../ui/ImageCarousel';

const SurveyResponseDetailCard = ({
    respuesta,
    isLoading = false,
    onBack,
    onEdit, // PROPIEDAD CLAVE: Llama a la página principal
    onDelete // Recibimos la función de eliminar
}) => {
    const [isCarouselOpen, setIsCarouselOpen] = useState(false);
    const [carouselIndex, setCarouselIndex] = useState(0);

    if (isLoading) {
        return (
            <Card className="!p-0 overflow-hidden border-border-base bg-surface-primary shadow-xl rounded-2xl flex flex-col h-[760px] max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] w-full max-w-full">
                <div className="shrink-0 flex items-center justify-between p-4 md:p-6 bg-surface-secondary/30 border-b border-border-base">
                    <div className="flex items-center gap-3 md:gap-4 w-full min-w-0 animate-pulse">
                        <div className="flex-shrink-0 w-10 h-10 bg-surface-secondary/50 rounded-xl" />
                        <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-surface-secondary/50" />
                        <div className="space-y-2 min-w-0 flex-1">
                            <div className="h-4 md:h-5 w-full max-w-[160px] bg-surface-secondary/50 rounded-md" />
                            <div className="h-3 w-3/4 max-w-[96px] bg-surface-secondary/30 rounded-md" />
                        </div>
                    </div>
                </div>
                <div className="flex-1 p-6 bg-surface-primary overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex flex-col p-4 rounded-xl border border-border-base bg-surface-secondary/20 h-[100px] animate-pulse" />
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    if (!respuesta) return null;

    const fields = [
        { id: 'seccion', label: 'Sección', value: respuesta.seccion, isLocation: true },
        { id: 'barrio', label: 'Barrio', value: respuesta.barrio, isLocation: true },
        ...(respuesta.detalles_completos || respuesta.detalles || []).map(d => ({
            id: `p_${d.pregunta_id}`,
            label: d.pregunta_titulo || `Pregunta #${d.pregunta_id}`,
            value: d.valor_texto || d.valor_numero,
            foto: d.valor_foto,
            fotos_extra: d.fotos_extra || [],
            pregunta_tipo: d.pregunta_tipo
        }))
    ];

    // Solo mostramos campos con contenido
    const visibleFields = fields.filter(f => {
        // HIDE if it is a photo question (handled by Gallery)
        if (f.pregunta_tipo === 'foto') return false;

        return (f.value !== null && f.value !== '' && f.value !== undefined) || f.foto || (f.fotos_extra && f.fotos_extra.length > 0);
    });

    return (
        <>
            <Card className="!p-0 overflow-hidden border-border-base bg-surface-primary shadow-xl rounded-2xl flex flex-col h-[760px] max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] w-full max-w-full">
                <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 bg-surface-secondary/30 border-b border-border-base gap-4">
                    <div className="flex items-center gap-4 min-w-0 max-w-full flex-1">
                        <button onClick={onBack} className="flex-shrink-0 p-2.5 bg-surface-primary border border-border-base hover:bg-surface-secondary rounded-xl transition-all text-content-secondary shadow-sm active:scale-95">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-surface-primary shadow-sm bg-brand-blue flex items-center justify-center text-white shrink-0">
                                {respuesta.usuario?.avatar || respuesta.usuario_foto ? <img src={respuesta.usuario?.avatar || respuesta.usuario_foto} alt="Avatar" className="w-full h-full object-cover" /> : <User size={24} />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-base md:text-lg font-black text-content-primary leading-tight truncate overflow-hidden">
                                    {respuesta.usuario?.nombre || respuesta.usuario_nombre || "Anónimo"}
                                </h2>
                                <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-content-secondary mt-1">
                                    <Calendar size={12} />
                                    <span>{respuesta.fecha_display || respuesta.fecha_format}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {onDelete && (
                            <button
                                onClick={() => onDelete(respuesta.id)}
                                className="flex items-center justify-center p-2.5 rounded-xl bg-red-100/50 text-red-600 border border-red-200 font-bold hover:bg-red-200 transition-all active:scale-95"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        {onEdit && (
                            <button onClick={onEdit} className="md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-blue text-white shadow-lg shadow-blue-900/20 font-bold hover:bg-blue-700 transition-all active:scale-95">
                                <Edit3 size={18} /> Editar
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 p-6 bg-surface-primary overflow-y-auto custom-scrollbar">
                    {visibleFields.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-content-secondary font-medium">No hay respuestas registradas para mostrar.</div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {/* SECCIÓN DE FOTOS CENTRALIZADAS CON MINIATURAS */}
                            {(respuesta.fotos_agrupadas && respuesta.fotos_agrupadas.length > 0) && (
                                <div className="p-4 rounded-xl border border-border-base bg-surface-secondary/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <ImageIcon size={18} className="text-brand-purple" />
                                        <h4 className="text-sm font-black text-content-primary uppercase tracking-wide">Evidencia / Galería</h4>
                                        <span className="text-xs font-bold px-2 py-0.5 bg-brand-purple/10 text-brand-purple rounded-full">
                                            {respuesta.fotos_agrupadas.length} fotos
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {respuesta.fotos_agrupadas.map((foto, idx) => (
                                            <button
                                                key={foto.id}
                                                onClick={() => {
                                                    setCarouselIndex(idx);
                                                    setIsCarouselOpen(true);
                                                }}
                                                className="relative group shrink-0 overflow-hidden rounded-lg border border-border-base focus:outline-none w-24 h-24 shadow-sm hover:shadow-md transition-all active:scale-95"
                                            >
                                                <img src={foto.archivo} alt="Evidencia" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ImageIcon size={20} className="text-white drop-shadow-md" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* GRILLA DE RESPUESTAS TEXTO/NUMERO */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 content-start">
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

            {/* Modal de Carrusel Flotante en Pantalla Completa */}
            {isCarouselOpen && (
                <div 
                    className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" 
                    onClick={() => setIsCarouselOpen(false)}
                >
                    <button 
                        className="absolute top-4 right-4 text-white p-2.5 hover:bg-white/10 rounded-full z-50 bg-black/40 backdrop-blur-sm border border-white/10 shadow-lg active:scale-95 transition-all" 
                        onClick={() => setIsCarouselOpen(false)}
                    >
                        <X size={28} />
                    </button>
                    
                    <div 
                        className="w-full max-w-7xl relative animate-in zoom-in-95 duration-200" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ImageCarousel 
                            images={respuesta.fotos_agrupadas.map(foto => ({
                                id: foto.id,
                                url: foto.archivo
                            }))} 
                            initialIndex={carouselIndex} 
                            readOnly={true}
                            disableLightbox={true}
                            className="max-w-full [&>div]:border-none [&>div]:bg-transparent [&>div]:shadow-none [&>div]:aspect-auto [&>div]:h-[80vh] [&>div]:flex [&>div]:items-center [&>div]:justify-center [&>div_img]:w-auto [&>div_img]:h-auto [&>div_img]:max-w-full [&>div_img]:max-h-[80vh] [&>div_img]:mx-auto [&>div_img]:object-contain" 
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default SurveyResponseDetailCard;