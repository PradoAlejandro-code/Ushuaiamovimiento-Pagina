import { useState, useEffect } from 'react';
import { getRecentResponses, getGlobalStats } from '@/api/stats';
import { MessageSquare, TrendingUp, CheckCircle2, ChevronDown, Check, Calendar } from 'lucide-react';
import ChartCard from '../components/Analytics/ChartCard';
import RecentActivity from '../components/Analytics/RecentActivity';
import MetricCard from '../components/Analytics/MetricCard';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

const HomePage = () => {
    const [responses, setResponses] = useState([]);
    const [stats, setStats] = useState([]);
    const [metrics, setMetrics] = useState({
        total: 0,
        hoy: 0,
        trendHoy: 0,
        relevamientos: 0,
        trendRelev: 0
    });
    const [period, setPeriod] = useState('day');

    const fetchData = async () => {
        try {
            const [recentData, statsData] = await Promise.all([
                getRecentResponses(),
                getGlobalStats(period, 'user')
            ]);
            setResponses(recentData || []);
            if (statsData && statsData.summary) {
                const s = statsData.summary;
                setStats(statsData.chart_data || []);
                setMetrics({
                    total: s.total_respuestas || 0,
                    hoy: s.movimientos_hoy || 0,
                    trendHoy: s.trend_hoy || 0,
                    relevamientos: s.total_relevamientos || 0,
                    trendRelev: s.trend_relev || 0
                });
            }
        } catch (error) {
            console.error("Error cargando Dashboard:", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [period]);

    const options = [
        { value: 'day', label: 'Día' },
        { value: 'month', label: 'Mes' },
        { value: 'year', label: 'Año' }
    ];

    const currentLabel = options.find(o => o.value === period)?.label;

    // --- SELECTOR USANDO HEADLESS UI ---
    const PeriodSelector = (
        <div className="w-full md:w-auto">
            {/* Versión Escritorio: Botones simples */}
            <div className="hidden md:flex bg-surface-secondary/50 p-1 rounded-lg border border-border-base">
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setPeriod(opt.value)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase whitespace-nowrap ${period === opt.value
                            ? 'bg-brand-blue text-white shadow-sm'
                            : 'text-content-secondary hover:text-content-primary'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Versión Móvil: Listbox de Headless UI */}
            <div className="md:hidden">
                <Listbox value={period} onChange={setPeriod}>
                    <ListboxButton className="w-32 flex items-center justify-between bg-surface-secondary/50 text-content-primary text-[10px] font-bold uppercase px-3 py-2 rounded-lg border border-border-base active:scale-95 transition-transform">
                        <div className="flex items-center gap-2">
                            <Calendar size={12} className="text-brand-blue" />
                            <span>{currentLabel}</span>
                        </div>
                        <ChevronDown size={12} className="text-content-secondary" />
                    </ListboxButton>

                    {/* El 'anchor' se encarga de posicionarlo automáticamente sin romperse */}
                    <ListboxOptions
                        anchor="bottom end"
                        transition
                        className="w-32 bg-surface-secondary border border-border-base rounded-xl shadow-2xl p-1 z-[9999] focus:outline-none origin-top transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                    >
                        {options.map((opt) => (
                            <ListboxOption
                                key={opt.value}
                                value={opt.value}
                                className="group flex cursor-pointer items-center justify-between gap-2 rounded-lg py-2 px-3 text-[10px] font-bold uppercase text-content-secondary hover:bg-surface-primary hover:text-content-primary data-[selected]:bg-brand-blue/10 data-[selected]:text-brand-blue"
                            >
                                {opt.label}
                                <Check size={12} className="invisible group-data-[selected]:visible" />
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </Listbox>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard title="Total Respuestas" value={metrics.total} icon={MessageSquare} variant="orange" />
                <MetricCard title="Movimientos Hoy" value={metrics.hoy} trend={metrics.trendHoy} trendLabel="vs. día anterior" icon={TrendingUp} variant="green" />
                <MetricCard title="Relevamientos" value={metrics.relevamientos} trend={metrics.trendRelev} trendLabel="vs. mes anterior" icon={CheckCircle2} variant="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <div className="lg:col-span-2 flex flex-col min-w-0">
                    <ChartCard
                        dataPregunta={{ titulo: "Ranking de Usuarios", extraType: "users", data: stats }}
                        action={PeriodSelector}
                        className="flex-1 h-full w-full"
                    />
                </div>

                <div className="lg:col-span-1 flex flex-col">
                    <RecentActivity responses={responses.slice(0, 5)} />
                </div>
            </div>
        </div>
    );
};

export default HomePage;