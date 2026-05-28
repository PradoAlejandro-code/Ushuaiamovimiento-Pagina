import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';

// --- 1. TOOLTIP ---
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            // CSS Transform: Lo sube y lo centra. 
            // 'pointer-events-none' evita que el mouse choque con el cartel.
            <div className="bg-surface-secondary/95 backdrop-blur-md border border-border-base px-3 py-2 rounded-lg shadow-xl transform -translate-y-[120%] -translate-x-[50%] pointer-events-none whitespace-nowrap z-50">
                <p className="text-[10px] font-bold text-content-secondary uppercase mb-0.5">{label}</p>
                <p className="text-sm font-black text-brand-blue leading-none">
                    {payload[0].value} Respuestas
                </p>
            </div>
        );
    }
    return null;
};

// --- 2. EJE X CON AVATARES ---
const CustomTick = ({ x, y, payload, data }) => {
    const dataItem = data && data[payload.index];
    const size = 60;
    const xPos = x - (size / 2);
    const yPos = y + 5;

    if (dataItem && dataItem.image) {
        return (
            <g transform={`translate(${xPos},${yPos})`}>
                <foreignObject width={size} height={size}>
                    <img
                        src={dataItem.image}
                        alt=""
                        className="w-full h-full rounded-full object-cover border-2 border-surface-primary shadow-md hover:scale-110 transition-transform duration-200"
                    />
                </foreignObject>
            </g>
        );
    }

    return (
        <g transform={`translate(${x},${y + 20})`}>
            <text x={0} y={0} dy={0} textAnchor="middle" fill="#9ca3af" className="text-[10px] font-bold uppercase">
                {payload.value.substring(0, 3)}
            </text>
        </g>
    );
};

const ChartCard = ({ dataPregunta, className, action }) => {
    const [isPie, setIsPie] = useState(false);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        // Validación segura: si no hay data, seteamos array vacío pero no retornamos antes
        if (!dataPregunta || !dataPregunta.data) {
            setChartData([]);
            return;
        }

        const formattedData = dataPregunta.data.map(d => ({
            name: d.name || d.label,
            value: d.value,
            image: d.image || null
        }));
        setChartData(formattedData);
    }, [dataPregunta]);

    const isUsersChart = dataPregunta?.extraType === 'users'; // Agregué el ? por seguridad
    const BAR_COLOR_USER = '#f97316';
    const BAR_COLOR_DEFAULT = '#3b82f6';
    const PIE_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    // --- CAMBIO: Eliminé el "return null" para que la tarjeta siempre se renderice ---

    return (
        <div className={`p-6 bg-surface-secondary rounded-2xl border border-border-base flex flex-col ${className}`}>

            {/* ENCABEZADO */}
            <div className="flex items-center justify-between mb-2 gap-4 h-10">
                <div className="flex items-center gap-2 overflow-hidden">
                    {isUsersChart && <span className="w-1.5 h-6 bg-brand-orange rounded-full flex-shrink-0"></span>}
                    <h3 className="text-lg font-bold text-content-primary leading-tight truncate">
                        {dataPregunta?.titulo || "Datos"}
                    </h3>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 relative z-20">
                    {action && <div>{action}</div>}
                    {!isUsersChart && !action && (
                        <div className="flex bg-surface-secondary rounded-lg p-0.5 border border-border-base">
                            <button onClick={() => setIsPie(false)} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${!isPie ? 'bg-white dark:bg-slate-700 text-brand-blue shadow-sm' : 'text-content-secondary hover:text-content-primary'}`}>BAR</button>
                            <button onClick={() => setIsPie(true)} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${isPie ? 'bg-white dark:bg-slate-700 text-brand-blue shadow-sm' : 'text-content-secondary hover:text-content-primary'}`}>PIE</button>
                        </div>
                    )}
                </div>
            </div>

            {/* GRÁFICO O ESTADO VACÍO */}
            <div className="flex-1 w-full min-h-[300px] relative">
                {chartData.length === 0 ? (
                    // --- CAMBIO: Mostramos mensaje si está vacío en lugar de desaparecer ---
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-xs font-bold text-content-secondary uppercase opacity-50">
                            No hay datos disponibles
                        </p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        {isPie && !isUsersChart ? (
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={false}
                                    isAnimationActive={false}
                                    wrapperStyle={{ outline: 'none' }}
                                    allowEscapeViewBox={{ x: true, y: true }} // <--- ESTO ARREGLA EL BUG
                                />
                            </PieChart>
                        ) : (
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 0, left: -25, bottom: isUsersChart ? 5 : 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.1)" />

                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                    tick={isUsersChart ? <CustomTick data={chartData} /> : { fontSize: 10, fill: '#9ca3af' }}
                                    height={isUsersChart ? 70 : 30}
                                />

                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                                />

                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={false}
                                    isAnimationActive={false} // Sin delay
                                    animationDuration={0}     // Sin animación
                                    allowEscapeViewBox={{ x: true, y: true }} // <--- CRÍTICO: Evita el salto al bajar el mouse
                                />

                                <Bar
                                    dataKey="value"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={50}
                                    animationDuration={800}
                                    animationBegin={0}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={isUsersChart ? BAR_COLOR_USER : BAR_COLOR_DEFAULT}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default ChartCard;