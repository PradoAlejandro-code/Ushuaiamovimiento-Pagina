import { Clock, MapPin, User } from "lucide-react";
import { getAvatarUrl } from "../../utils/chartConfig";
import Card from "./Card";

const RecentActivity = ({ responses }) => {
    return (
        <Card className="flex flex-col h-full !p-0 overflow-hidden border-border-base shadow-xl">
            {/* Header */}
            <div className="p-6 border-b border-border-base bg-surface-primary/50">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-content-secondary" />
                    <h3 className="text-lg font-bold text-content-primary">Actividad Reciente</h3>
                </div>
            </div>

            {/* Lista de Actividades */}
            <div className="flex-1 flex flex-col divide-y divide-border-base/50">
                {responses.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-content-secondary italic text-sm">
                        No hay registros recientes.
                    </div>
                ) : (
                    responses.map((resp) => (
                        <div key={resp.id} className="flex-1 flex items-center p-5 hover:bg-surface-secondary/40 transition-colors group">
                            <div className="flex items-center gap-4 w-full">
                                <div className="shrink-0">
                                    {resp.usuario_foto ? (
                                        <img
                                            src={getAvatarUrl(resp.usuario_foto)}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-surface-primary shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold">
                                            {resp.usuario_nombre?.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-bold text-content-primary truncate">
                                            {resp.usuario_nombre}
                                        </p>
                                        <span className="text-[11px] font-mono text-content-secondary">
                                            {resp.fecha_format?.split(' ')[1]}
                                        </span>
                                    </div>

                                    <p className="text-xs text-content-secondary mt-0.5 mb-2">
                                        {resp.encuesta_nombre}
                                    </p>

                                    {resp.seccion && (
                                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                                            <span className="text-[10px] font-black uppercase tracking-tight">
                                                {resp.seccion} {resp.barrio ? `• ${resp.barrio}` : ''}
                                            </span>
                                            <MapPin size={10} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
};

export default RecentActivity;