import React from 'react';
import { User, ChevronRight, Trash2 } from 'lucide-react';
import Card from '../ui/Card';

const ReportCard = ({ report, onViewMore, onDelete }) => {
    const { titulo, descripcion_breve, creado_por_nombre, creado_por_foto, fecha_creacion } = report;

    // Formatear fecha
    const fecha = new Date(fecha_creacion).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    return (
        <Card className="flex flex-col h-[280px] bg-surface-primary border-none shadow-xl hover:scale-[1.02] transition-all duration-300 group overflow-hidden">
            <div className="p-6 flex flex-col h-full">
                {/* Header: User Info */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            {creado_por_foto ? (
                                <img
                                    src={creado_por_foto}
                                    alt={creado_por_nombre}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-brand-blue/20"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center border-2 border-brand-blue/10">
                                    <User size={20} className="text-content-secondary" />
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-surface-primary rounded-full"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-content-primary uppercase tracking-wider truncate max-w-[150px]">
                                {creado_por_nombre || 'Usuario'}
                            </span>
                            <span className="text-[10px] font-bold text-content-secondary uppercase opacity-60">
                                {fecha}
                            </span>
                        </div>
                    </div>
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(report);
                            }}
                            className="p-2 text-content-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                            title="Borrar informe"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-black text-content-primary leading-tight line-clamp-1 group-hover:text-brand-blue transition-colors">
                        {titulo}
                    </h3>
                    <p className="text-sm font-medium text-content-secondary/80 line-clamp-2 italic leading-relaxed">
                        {descripcion_breve || 'Sin descripción...'}
                    </p>
                </div>

                {/* Footer / Action */}
                <div className="mt-4 pt-4 border-t border-border-base/30">
                    <button
                        onClick={() => onViewMore(report.id)}
                        className="w-full flex items-center justify-between group/btn text-brand-blue"
                    >
                        <span className="text-[11px] font-black uppercase tracking-widest">Ver Informe Completo</span>
                        <div className="p-1.5 rounded-lg bg-brand-blue/10 group-hover/btn:bg-brand-blue group-hover/btn:text-white transition-all">
                            <ChevronRight size={14} />
                        </div>
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default ReportCard;
