import { useState, useEffect } from 'react';
import { getRecentResponses, getGlobalStats } from '../api';
import Card from '../components/ui/Card';
import { User, Clock, MapPin } from 'lucide-react';
import { getAvatarUrl } from '../utils/chartConfig';
import ChartCard from '../components/Analytics/ChartCard';

const HomePage = () => {
    const [responses, setResponses] = useState([]);
    const [stats, setStats] = useState([]);
    const [period, setPeriod] = useState('day');

    const fetchData = async () => {
        try {
            const [recentData, statsData] = await Promise.all([
                getRecentResponses(),
                getGlobalStats(period, 'user')
            ]);
            setResponses(recentData);
            setStats(statsData);
        } catch (error) {
            console.error("Error polling data:", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [period]);

    const chartDataConfig = {
        titulo: "Respuestas por Usuario",
        extraType: "users",
        data: stats
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 gap-6">

                {/* GRÁFICO UNIFICADO */}
                <div className="relative group">
                    <div className="absolute top-5 right-5 z-10 bg-surface-secondary p-1 rounded-lg border border-border-base">
                        {['day', 'month', 'year'].map((p) => (
                            <button key={p} onClick={() => setPeriod(p)}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase tracking-wide 
                                ${period === p
                                        ? 'bg-brand-blue text-white shadow-sm'
                                        : 'text-content-secondary hover:text-content-primary hover:bg-surface-primary'
                                    }`}>
                                {p === 'day' ? 'Día' : p === 'month' ? 'Mes' : 'Año'}
                            </button>
                        ))}
                    </div>
                    <ChartCard dataPregunta={chartDataConfig} forcedHeight={320} />
                </div>

                {/* LISTA DE ACTIVIDAD RECIENTE */}
                <Card className="flex flex-col">
                    <h2 className="text-lg font-bold text-content-primary mb-6 flex items-center gap-2">
                        <Clock size={20} className="text-content-secondary" /> Actividad Reciente
                    </h2>
                    <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                        {responses.length === 0 ? (
                            <div className="text-center py-10 text-content-secondary text-sm italic">No hay registros recientes.</div>
                        ) : (
                            responses.map((resp) => (
                                // CAMBIO 1: items-center en lugar de items-start para centrado vertical general
                                <div key={resp.id} className="group flex justify-between items-center gap-4 p-3 rounded-xl hover:bg-surface-secondary/50 transition-all border border-transparent hover:border-border-base">

                                    {/* Lado Izquierdo: Avatar + Textos */}
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="shrink-0">
                                            {/* CAMBIO 2: Tamaño aumentado a w-12 h-12 (48px) y eliminado el mt-1 */}
                                            {resp.usuario_foto ? (
                                                <img src={getAvatarUrl(resp.usuario_foto)} alt={resp.usuario_nombre} className="w-12 h-12 rounded-full object-cover border border-border-base shadow-sm" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-surface-secondary border border-border-base flex items-center justify-center text-content-secondary">
                                                    <User size={20} />
                                                </div>
                                            )}
                                        </div>

                                        {/* CAMBIO 3: Contenedor flex vertical para centrar mejor visualmente */}
                                        <div className="flex flex-col justify-center">
                                            <h4 className="text-sm font-bold text-content-primary leading-tight">{resp.usuario_nombre}</h4>
                                            <span className="text-xs text-content-secondary font-medium mt-0.5">{resp.encuesta_nombre}</span>
                                        </div>
                                    </div>

                                    {/* Lado Derecho: Ubicación y Hora */}
                                    <div className="text-right flex items-center justify-end gap-3 min-w-0">
                                        {resp.seccion ? (
                                            <div className="flex items-center gap-1 text-sm text-brand-orange font-bold">
                                                <span className="truncate max-w-[150px]">{resp.seccion} {resp.barrio ? `• ${resp.barrio}` : ''}</span>
                                                <MapPin size={14} />
                                            </div>
                                        ) : <span className="text-sm text-gray-400">-</span>}

                                        <div className="h-4 w-[1px] bg-border-base"></div>
                                        <span className="text-sm font-bold text-content-primary font-mono">{resp.fecha_format?.split(' ')[1]}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default HomePage;