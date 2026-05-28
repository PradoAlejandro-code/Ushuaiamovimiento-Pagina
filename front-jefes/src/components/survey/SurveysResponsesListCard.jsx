import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Eye } from 'lucide-react';
import Card from '../ui/Card';

const SurveysResponsesListCard = ({
    responses = [],
    isLoading = false,
    currentPage = 1,
    totalPages = 1,
    onNext,
    onPrev,
    onView,
    hasNext = false,
    hasPrev = false
}) => {

    const hasLocationData = isLoading ? true : responses.some(rta => rta.seccion || rta.barrio);
    const currentItems = responses;

    const renderSkeletonRows = () => {
        return Array.from({ length: 10 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="flex items-center px-4 md:px-6 py-3 border-b border-border-base/50 last:border-0 h-[65px] animate-pulse">
                <div className="hidden md:block w-[80px] flex-shrink-0">
                    <div className="h-4 w-8 bg-surface-secondary/50 rounded-md"></div>
                </div>
                <div className="flex-1 md:flex-1 flex items-center">
                    <div className="w-10 h-10 rounded-full bg-surface-secondary/50 flex-shrink-0"></div>
                    <div className="hidden md:block ml-3 h-4 w-32 bg-surface-secondary/50 rounded-md"></div>
                </div>
                <div className="flex-1 md:w-[140px] md:flex-none flex justify-center md:justify-start">
                    <div className="h-4 w-20 bg-surface-secondary/50 rounded-md"></div>
                </div>
                {hasLocationData && (
                    <div className="flex-1 flex justify-center md:justify-start">
                        <div className="h-5 w-24 bg-surface-secondary/30 rounded-md border border-surface-secondary/10"></div>
                    </div>
                )}
                <div className="flex-1 md:w-[120px] md:flex-none flex justify-center md:justify-end">
                    <div className="h-8 w-24 bg-surface-secondary/50 rounded-lg hidden md:block"></div>
                    <div className="h-6 w-6 bg-surface-secondary/50 rounded-md md:hidden"></div>
                </div>
            </div>
        ));
    };

    return (
        <Card className="!p-0 overflow-hidden border-border-base bg-surface-primary shadow-xl rounded-2xl flex flex-col h-[760px] max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)]">
            <div className="flex items-center px-4 md:px-6 py-4 bg-surface-secondary/50 border-b border-border-base text-[11px] font-black text-content-secondary uppercase tracking-widest shrink-0">
                <div className="hidden md:block w-[80px]">ID</div>
                <div className="flex-1 text-center md:text-left">Foto</div>
                <div className="flex-1 md:w-[140px] md:flex-none text-center md:text-left">Fecha</div>
                {hasLocationData && <div className="flex-1 text-center md:text-left">Ubicación</div>}
                <div className="flex-1 md:w-[120px] md:flex-none text-center md:text-right">Acción</div>
            </div>

            <div className="flex-1 divide-y divide-border-base/50">
                {isLoading ? (
                    <div className="flex flex-col">
                        {renderSkeletonRows()}
                    </div>
                ) : currentItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-content-secondary">
                        <p className="font-medium">No hay respuestas registradas.</p>
                    </div>
                ) : (
                    currentItems.map((rta) => (
                        <div key={rta.id} className="flex items-center px-4 md:px-6 py-3 hover:bg-surface-secondary/50 border-b border-border-base last:border-0 group transition-colors h-[65px]">
                            <div className="hidden md:block w-[80px] flex-shrink-0 text-xs font-bold text-brand-blue">
                                #{rta.id}
                            </div>
                            <div className="flex-1 md:flex-1 flex justify-center md:justify-start items-center min-w-0">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-border-base shadow-sm flex-shrink-0">
                                        {rta.usuario?.avatar ? (
                                            <img src={rta.usuario.avatar} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center text-white text-xs font-bold">
                                                {rta.usuario?.nombre?.charAt(0).toUpperCase() || "?"}
                                            </div>
                                        )}
                                    </div>
                                    <p className="hidden md:block ml-3 text-sm font-semibold text-content-primary truncate">
                                        {rta.usuario?.nombre || "Anónimo"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex-1 md:w-[140px] md:flex-none flex justify-center md:justify-start items-center">
                                <div className="flex items-center space-x-1.5">
                                    <Calendar size={14} className="text-content-secondary hidden md:block" />
                                    <span className="text-[13px] md:text-sm text-content-secondary font-medium">
                                        {rta.fecha_display || (rta.fecha ? new Date(rta.fecha).toLocaleDateString() : 'N/A')}
                                    </span>
                                </div>
                            </div>
                            {hasLocationData && (
                                <div className="flex-1 flex justify-center md:justify-start items-center min-w-0">
                                    {(rta.seccion || rta.barrio) ? (
                                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md bg-brand-orange/10 text-brand-orange border border-brand-orange/20 max-w-full">
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tight truncate">
                                                {rta.seccion || ''} {rta.barrio ? `• ${rta.barrio}` : ''}
                                            </span>
                                            <MapPin size={10} strokeWidth={3} className="flex-shrink-0 hidden md:block" />
                                        </div>
                                    ) : (
                                        <span className="text-[9px] text-content-secondary/40 italic md:hidden">N/A</span>
                                    )}
                                </div>
                            )}
                            <div className="flex-1 md:w-[120px] md:flex-none flex justify-center md:justify-end items-center">
                                <button
                                    onClick={() => onView && onView(rta.id)}
                                    className="flex items-center justify-center p-2 md:px-3 md:py-1.5 text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-all active:scale-95"
                                >
                                    <span className="hidden md:inline mr-2 text-xs font-bold uppercase">Ver más</span>
                                    <Eye size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {(!isLoading && responses.length === 0) ? null : (
                <div className="flex items-center justify-between px-6 py-3 bg-surface-secondary/30 border-t border-border-base shrink-0">
                    <p className="hidden xs:block text-xs font-bold text-content-secondary uppercase tracking-tighter">
                        Página <span className="text-brand-blue">{currentPage}</span> de <span className="text-brand-blue">{totalPages}</span>
                    </p>
                    <div className="flex items-center space-x-3 w-full xs:w-auto justify-between xs:justify-end">
                        <button
                            onClick={onPrev}
                            disabled={!hasPrev || currentPage === 1 || isLoading}
                            className="p-2 rounded-xl border border-border-base bg-surface-primary text-content-secondary disabled:opacity-30 hover:bg-surface-secondary transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="flex items-center px-4 py-1.5 bg-surface-primary border border-border-base rounded-xl text-xs font-black text-brand-blue shadow-inner min-w-[60px] justify-center">
                            {isLoading ? (
                                <div className="h-3 w-8 bg-brand-blue/30 rounded animate-pulse"></div>
                            ) : (
                                `${currentPage} / ${totalPages}`
                            )}
                        </div>

                        <button
                            onClick={onNext}
                            disabled={!hasNext || currentPage === totalPages || isLoading}
                            className="p-2 rounded-xl border border-border-base bg-surface-primary text-content-secondary disabled:opacity-30 hover:bg-surface-secondary transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default SurveysResponsesListCard;