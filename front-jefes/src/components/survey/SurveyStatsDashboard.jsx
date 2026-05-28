import React, { useState, useMemo, useEffect } from 'react';
import { Users, BarChart3, ChevronRight, ChevronDown, Check, LayoutList } from 'lucide-react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip, Cell, PieChart as RePieChart, Pie, CartesianGrid
} from 'recharts';
import Card from '../ui/Card';
import { getAvatarUrl } from '@/utils/chartConfig';

const COLORS = ['#2563eb', '#f97316', '#10b981', '#ef4444', '#8b5cf6', '#0ea5e9'];

// --- 1. TOOLTIP CORREGIDO (Funciona para Barras y Torta) ---
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const itemName = label || payload[0].name;

        return (
            <div className="bg-surface-primary border border-border-base px-4 py-2.5 rounded-xl shadow-2xl transform -translate-y-full -translate-x-1/2 pointer-events-none whitespace-nowrap z-50 ring-1 ring-black/5">
                <p className="text-[10px] font-black text-brand-orange uppercase mb-1 tracking-widest">
                    {itemName}
                </p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill || payload[0].color }} />
                    <p className="text-sm font-black text-content-primary leading-none">
                        {payload[0].value} <span className="text-[10px] font-bold text-content-secondary uppercase ml-1">Respuestas</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

// --- 2. EJE X (TICK) ---
const CustomTick = ({ x, y, payload, data, isParticipation }) => {
    const dataItem = data && data[payload.index];
    const size = 60;
    const xPos = x - (size / 2);
    const yPos = y + 5;

    if (isParticipation && dataItem) {
        const imgUrl = getAvatarUrl(dataItem.avatar || dataItem.image || dataItem.usuario_foto);
        return (
            <g transform={`translate(${xPos},${yPos})`}>
                <foreignObject width={size} height={size}>
                    {imgUrl ? (
                        <img src={imgUrl} alt="" className="w-full h-full rounded-full object-cover border-2 border-surface-primary shadow-sm" />
                    ) : (
                        <div className="w-full h-full rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-xs font-black uppercase border-2 border-surface-primary">
                            {payload.value?.substring(0, 1)}
                        </div>
                    )}
                </foreignObject>
            </g>
        );
    }

    return (
        <g transform={`translate(${x},${y + 20})`}>
            <text x={0} y={0} textAnchor="middle" fill="#9ca3af" className="text-[10px] font-bold uppercase">
                {payload.value?.length > 12 ? `${payload.value.substring(0, 10)}...` : payload.value}
            </text>
        </g>
    );
};

const SurveyStatsDashboard = ({ statsData = [], isLoading = false, className = '' }) => {
    const [selectedId, setSelectedId] = useState('participation');
    const [viewType, setViewType] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const currentStat = useMemo(() =>
        statsData?.length > 0 ? (statsData.find(s => s.id === selectedId) || statsData[0]) : null,
        [selectedId, statsData]);

    const activeView = viewType || currentStat?.type || 'bar';
    const isParticipation = currentStat?.id === 'participation';

    if (isLoading) {
        return (
            <Card className={`!p-0 border-border-base bg-surface-primary shadow-xl rounded-2xl overflow-hidden animate-pulse flex flex-col ${className}`}>
                <div className="flex flex-col md:flex-row flex-1 min-h-[550px] md:min-h-0 w-full">
                    <div className="w-full md:w-1/3 border-r border-border-base bg-surface-secondary/30 p-4">
                        <div className="h-4 w-24 bg-surface-secondary rounded mb-4"></div>
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-surface-secondary rounded mb-2"></div>)}
                    </div>
                    <div className="flex-1 p-6"><div className="h-64 bg-surface-secondary rounded w-full"></div></div>
                </div>
            </Card>
        );
    }

    return (
        <Card className={`!p-0 border-border-base bg-surface-primary shadow-xl rounded-2xl overflow-hidden flex flex-col ${className}`}>
            <div className="flex flex-col md:flex-row flex-1 min-h-[550px] md:min-h-0 w-full">

                {/* --- MÓVIL: SELECTOR --- */}
                <div className="md:hidden p-4 border-b border-border-base bg-surface-secondary/20">
                    <p className="text-[10px] font-black text-content-secondary uppercase tracking-[0.2em] mb-2">Pregunta Analítica</p>
                    <Listbox value={selectedId} onChange={setSelectedId}>
                        <div className="relative">
                            <ListboxButton className="w-full flex items-center justify-between bg-surface-primary border border-border-base p-3 rounded-xl shadow-sm text-sm font-bold text-content-primary">
                                <div className="flex items-center gap-3 truncate">
                                    <LayoutList size={18} className="text-brand-blue shrink-0" />
                                    <span className="truncate">{currentStat?.title}</span>
                                </div>
                                <ChevronDown size={16} className="text-content-secondary" />
                            </ListboxButton>
                            <ListboxOptions className="absolute mt-2 w-full bg-surface-primary border border-border-base rounded-2xl shadow-2xl p-2 z-[100] focus:outline-none max-h-64 overflow-y-auto">
                                {statsData.map((stat) => (
                                    <ListboxOption key={stat.id} value={stat.id} className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl py-3 px-4 text-sm font-bold text-content-secondary hover:bg-surface-secondary data-[selected]:bg-brand-blue/10 data-[selected]:text-brand-blue transition-colors">
                                        <div className="min-w-0">
                                            <p className="truncate">{stat.title}</p>
                                            <p className="text-[10px] opacity-60 uppercase font-black">{stat.data?.reduce((a, b) => a + b.value, 0)} Rtas</p>
                                        </div>
                                        <Check size={16} className="invisible group-data-[selected]:visible shrink-0" />
                                    </ListboxOption>
                                ))}
                            </ListboxOptions>
                        </div>
                    </Listbox>
                </div>

                {/* --- ESCRITORIO: LISTA --- */}
                <div className="hidden md:flex flex-col w-1/3 border-r border-border-base bg-surface-secondary/30">
                    <div className="p-4 border-b border-border-base bg-surface-secondary/50 shrink-0">
                        <h3 className="text-[10px] font-black text-content-secondary uppercase tracking-[0.2em]">Analítica</h3>
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {statsData.map((stat) => (
                            <button key={stat.id} onClick={() => { setSelectedId(stat.id); }} className={`w-full flex items-center justify-between p-4 text-left border-b border-border-base/50 ${selectedId === stat.id ? 'bg-surface-primary border-l-4 border-brand-blue shadow-inner' : 'hover:bg-surface-primary/20 border-l-4 border-transparent'}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <BarChart3 size={16} className={selectedId === stat.id ? 'text-brand-blue' : 'text-content-secondary'} />
                                    <div className="min-w-0">
                                        <p className={`text-xs font-bold truncate ${selectedId === stat.id ? 'text-brand-blue' : 'text-content-primary'}`}>{stat.title}</p>
                                        <p className="text-[9px] text-content-secondary font-medium uppercase tracking-tighter">{stat.data?.reduce((a, b) => a + b.value, 0)} respuestas</p>
                                    </div>
                                </div>
                                <ChevronRight size={14} className={selectedId === stat.id ? 'text-brand-blue' : 'text-content-secondary/30'} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- GRÁFICO --- */}
                <div className="flex-1 p-5 md:p-6 flex flex-col relative bg-surface-primary">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <h2 className="hidden md:block text-xl font-black text-content-primary truncate">{currentStat?.title}</h2>
                        <div className="flex bg-surface-secondary/50 rounded-lg p-1 border border-border-base self-start sm:self-auto shadow-inner">
                            <button
                                onClick={() => setViewType('bar')}
                                className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all uppercase tracking-wider ${activeView === 'bar' ? 'bg-brand-blue text-white shadow-md' : 'text-content-secondary hover:text-content-primary'}`}
                            >
                                Bar
                            </button>
                            <button
                                onClick={() => setViewType('pie')}
                                className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all uppercase tracking-wider ${activeView === 'pie' ? 'bg-brand-blue text-white shadow-md' : 'text-content-secondary hover:text-content-primary'}`}
                            >
                                Pie
                            </button>
                        </div>
                    </div>

                    {/* ÁREA DE GRÁFICO (Parche de visibilidad móvil) */}
                    <div className="flex-1 w-full min-h-[350px] md:min-h-[400px] relative">
                        <ResponsiveContainer
                            key={`${selectedId}-${isMobile}-${activeView}`} // Fuerza re-render total al cambiar de todo
                            width="100%"
                            height={isMobile ? 350 : "100%"} // Altura fija en móvil para evitar bug
                        >
                            {activeView === 'pie' ? (
                                <RePieChart>
                                    <Pie data={currentStat?.data} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                                        {currentStat?.data?.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} allowEscapeViewBox={{ x: true, y: true }} />
                                </RePieChart>
                            ) : (
                                <BarChart data={currentStat?.data} margin={{ top: 20, right: 0, left: -25, bottom: isParticipation ? 5 : 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.1)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} tick={<CustomTick data={currentStat?.data} isParticipation={isParticipation} />} height={isParticipation ? 70 : 30} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <Tooltip content={<CustomTooltip />} cursor={false} isAnimationActive={false} allowEscapeViewBox={{ x: true, y: true }} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                        {currentStat?.data?.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default SurveyStatsDashboard;