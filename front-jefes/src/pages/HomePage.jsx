import { useState, useEffect } from 'react';
import { getRecentResponses, getGlobalStats } from '../api';
import { MessageSquare, TrendingUp, CheckCircle2 } from 'lucide-react';
import ChartCard from '../components/Analytics/ChartCard';
import RecentActivity from '../components/ui/RecentActivity';
import MetricCard from '../components/ui/MetricCard';

const HomePage = () => {
    const [responses, setResponses] = useState([]);
    const [stats, setStats] = useState([]);
    // Estado para las métricas de las cards superiores
    const [metrics, setMetrics] = useState({
        total: 0,
        hoy: 0,
        relevamientos: 0,
        trends: { total: 0, hoy: 0, relevamientos: 0 }
    });
    const [period, setPeriod] = useState('day');

    const fetchData = async () => {
        try {
            // Se realizan las peticiones en paralelo. 
            // getGlobalStats enviará ?period=...&group_by=user a tu backend
            const [recentData, statsData] = await Promise.all([
                getRecentResponses(),
                getGlobalStats(period, 'user')
            ]);

            setResponses(recentData || []);

            // Asumiendo que tu backend devuelve { chart_data: [...], summary: {...} }
            if (statsData) {
                // Actualizamos el gráfico
                setStats(statsData.chart_data || []);

                // Actualizamos las Metric Cards con datos reales
                setMetrics({
                    total: statsData.summary?.total_respuestas || 0,
                    hoy: statsData.summary?.movimientos_hoy || 0,
                    relevamientos: statsData.summary?.total_relevamientos || 0,
                    trends: {
                        total: statsData.summary?.trends?.total || 0,
                        hoy: statsData.summary?.trends?.hoy || 0,
                        relevamientos: statsData.summary?.trends?.relevamientos || 0
                    }
                });
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    };

    // Cada vez que cambie el period (Día/Mes/Año), se recargan los datos
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // Polling cada 15 segundos
        return () => clearInterval(interval);
    }, [period]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10 px-4">

            {/* SECCIÓN MÉTRICAS SUPERIOR - Conectadas al estado metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard
                    title="Total Respuestas"
                    value={metrics.total}
                    trend={metrics.trends.total}
                    icon={MessageSquare}
                    variant="orange"
                />
                <MetricCard
                    title="Movimientos Hoy"
                    value={metrics.hoy}
                    trend={metrics.trends.hoy}
                    icon={TrendingUp}
                    variant="green"
                />
                <MetricCard
                    title="Relevamientos"
                    value={metrics.relevamientos}
                    trend={metrics.trends.relevamientos}
                    icon={CheckCircle2}
                    variant="blue"
                />
            </div>

            {/* SECCIÓN INFERIOR: GRÁFICO Y ACTIVIDAD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

                {/* RESPUESTAS X USUARIO (Lado Izquierdo) */}
                <div className="lg:col-span-2 flex flex-col min-w-0">
                    <div className="relative group flex-1 flex flex-col">
                        {/* Selector de periodo funcional */}
                        <div className="absolute top-5 right-5 z-10 bg-surface-secondary/80 backdrop-blur-sm p-1 rounded-lg border border-border-base">
                            {['day', 'month', 'year'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase ${period === p ? 'bg-brand-blue text-white shadow-sm' : 'text-content-secondary hover:text-content-primary'
                                        }`}
                                >
                                    {p === 'day' ? 'Día' : p === 'month' ? 'Mes' : 'Año'}
                                </button>
                            ))}
                        </div>

                        <ChartCard
                            dataPregunta={{
                                titulo: `Respuestas por Usuario (${period === 'day' ? 'Hoy' : period === 'month' ? 'Mes' : 'Año'})`,
                                extraType: "users",
                                data: stats
                            }}
                            className="flex-1 h-full"
                        />
                    </div>
                </div>

                {/* ACTIVIDAD RECIENTE (Lado Derecho) */}
                <div className="lg:col-span-1 flex flex-col">
                    <RecentActivity responses={responses.slice(0, 5)} />
                </div>
            </div>
        </div>
    );
};

export default HomePage;