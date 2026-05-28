import React, { useState } from 'react';
import { useMyResponses } from '../../queries/useResponses';
import Card from '../ui/CustomCard';
import { Calendar, MapPin, Eye, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';
import MyResponseDetail from './MyResponseDetail';
import { Skeleton } from '../ui/skeleton';

const CarpetaContainer = () => {
    const [selectedResponseId, setSelectedResponseId] = useState(null);
    
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch My Responses with React Query
    const { data, isLoading: loading } = useMyResponses(currentPage);

    const responses = data?.results || data || [];
    const hasNext = !!data?.next;
    const hasPrev = !!data?.previous;
    const totalPages = data?.count ? Math.max(1, Math.ceil(data.count / 10)) : 1;

    if (selectedResponseId) {
        return <MyResponseDetail responseId={selectedResponseId} onBack={() => setSelectedResponseId(null)} />;
    }

    const hasLocationData = loading ? true : responses.some(rta => rta.seccion || rta.barrio);

    const renderSkeletonRows = () => {
        return Array.from({ length: 10 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="w-full h-[65px] border-b border-border-base/50 last:border-0" />
        ));
    };

    return (
        <Card className="!p-0 overflow-hidden border-border-base bg-surface-primary shadow-xl rounded-2xl flex flex-col w-full">
            <div className="flex items-center px-4 md:px-6 py-4 bg-surface-secondary/50 border-b border-border-base text-[11px] font-black text-content-secondary uppercase tracking-widest shrink-0">
                <div className="hidden md:block w-[80px]">ID</div>
                <div className="flex-1 md:flex-1 text-center md:text-left">Fecha</div>
                {hasLocationData && <div className="flex-1 text-center md:text-left">Ubicación</div>}
                <div className="flex-1 md:w-[60px] md:flex-none text-center md:text-right">Acción</div>
            </div>

            <div className="flex-1 divide-y divide-border-base/50">
                {loading ? (
                    <div className="flex flex-col">
                        {renderSkeletonRows()}
                    </div>
                ) : responses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[650px] text-content-secondary py-20">
                        <FolderOpen size={48} className="mx-auto mb-2 opacity-20" />
                        <p className="font-medium">No tienes respuestas registradas en tu carpeta.</p>
                    </div>
                ) : (
                    responses.map((rta) => (
                        <div key={rta.id} className="flex items-center px-4 md:px-6 py-3 hover:bg-surface-secondary/50 border-b border-border-base last:border-0 group transition-colors h-[65px]">
                            <div className="hidden md:block w-[80px] flex-shrink-0 text-xs font-bold text-brand-blue">
                                #{rta.id}
                            </div>
                            <div className="flex-1 md:flex-1 flex justify-center md:justify-start items-center">
                                <div className="flex items-center space-x-1.5">
                                    <Calendar size={14} className="text-content-secondary hidden md:block" />
                                    <span className="text-[13px] md:text-sm text-content-secondary font-medium">
                                        {rta.fecha_format || (rta.fecha_envio ? new Date(rta.fecha_envio).toLocaleDateString() : 'N/A')}
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
                            <div className="flex-1 md:w-[60px] md:flex-none flex justify-center md:justify-end items-center">
                                <button
                                    onClick={() => setSelectedResponseId(rta.id)}
                                    className="flex items-center justify-center p-2 text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-all active:scale-95"
                                >
                                    <Eye size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="flex items-center justify-between px-6 py-3 bg-surface-secondary/30 border-t border-border-base shrink-0 mt-auto">
                <p className="hidden xs:block text-xs font-bold text-content-secondary uppercase tracking-tighter">
                    Página <span className="text-brand-blue">{currentPage}</span> de <span className="text-brand-blue">{totalPages}</span>
                </p>
                <div className="flex items-center space-x-3 w-full xs:w-auto justify-between xs:justify-end">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={!hasPrev || currentPage === 1 || loading}
                        className="p-2 rounded-xl border border-border-base bg-surface-primary text-content-secondary disabled:opacity-30 hover:bg-surface-secondary transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="flex items-center px-4 py-1.5 bg-surface-primary border border-border-base rounded-xl text-xs font-black text-brand-blue shadow-inner min-w-[60px] justify-center">
                        {loading ? (
                            <div className="h-3 w-8 bg-brand-blue/30 rounded animate-pulse"></div>
                        ) : (
                            `${currentPage} / ${totalPages}`
                        )}
                    </div>

                    <button
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={!hasNext || currentPage === totalPages || loading}
                        className="p-2 rounded-xl border border-border-base bg-surface-primary text-content-secondary disabled:opacity-30 hover:bg-surface-secondary transition-all"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default CarpetaContainer;
