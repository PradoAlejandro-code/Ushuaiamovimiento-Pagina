import { Clock, MapPin, Eye } from "lucide-react";
import { getAvatarUrl } from "../../utils/chartConfig";
import Card from "../ui/Card";

const RecentActivity = ({ responses, onViewDetail, className = "" }) => {
    return (
        <Card className={`flex flex-col !p-0 overflow-hidden border-border-base ${className}`}>
            {/* Header compacto */}
            <div className="px-4 py-3 shrink-0">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-content-secondary" />
                    <h3 className="text-sm font-bold text-content-primary uppercase tracking-wide">Actividad Reciente</h3>
                </div>
            </div>

            {/* Lista — divide-y para separadores, cada fila flex-1 */}
            <div className="flex-1 flex flex-col divide-y divide-border-base/50 min-h-0">
                {responses.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-content-secondary italic text-sm">
                        No hay registros recientes.
                    </div>
                ) : (
                    responses.map((resp) => (
                        <div
                            key={resp.id}
                            className="flex-1 flex items-center px-4 gap-3 hover:bg-surface-secondary/40 transition-colors min-h-0"
                        >
                            {/* Avatar pequeño */}
                            <div className="shrink-0">
                                {resp.usuario_foto ? (
                                    <img
                                        src={getAvatarUrl(resp.usuario_foto)}
                                        className="w-12 h-12 rounded-full object-cover border border-surface-primary"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center text-[12px] font-bold">
                                        {resp.usuario_nombre?.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Info en dos líneas compactas */}
                            <div className="flex-1 min-w-0">
                                {/* Línea 1: nombre (sin hora) */}
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[15px] font-bold text-content-primary truncate">
                                        {resp.usuario_nombre}
                                    </p>
                                </div>
                                {/* Línea 2: encuesta + badge inline */}
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-[12px] text-content-secondary truncate">
                                        {resp.encuesta_nombre}
                                    </p>
                                    {resp.seccion && (
                                        <div className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                                            <span className="text-[11px] font-black uppercase tracking-tight">
                                                {resp.seccion}{resp.barrio ? ` • ${resp.barrio}` : ''}
                                            </span>
                                            <MapPin size={8} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Botón de ojito para ver respuesta */}
                            <button
                                onClick={() => onViewDetail && onViewDetail(resp.id)}
                                className="p-2 text-content-secondary hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-all shrink-0"
                                title="Ver respuesta"
                            >
                                <Eye size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
};

export default RecentActivity;