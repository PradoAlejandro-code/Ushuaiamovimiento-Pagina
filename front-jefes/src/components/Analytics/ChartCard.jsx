import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { PieChart as PieIcon, BarChart as BarIcon } from 'lucide-react';
import Card from '../ui/Card';
import { avatarAxisPlugin, getChartOptions, getAvatarUrl } from '../../utils/chartConfig';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function ChartCard({ dataPregunta, forcedHeight = 300 }) {
    const [tipoGrafico, setTipoGrafico] = useState('bar');
    const [isDark, setIsDark] = useState(false);

    // Detectar modo oscuro
    useEffect(() => {
        const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkTheme(); // Check inicial
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    if (!dataPregunta || !dataPregunta.data || dataPregunta.data.length === 0) {
        return null;
    }

    // Determinar si es un gráfico de Participación de Usuarios (Ranking)
    const isUsersChart = dataPregunta.extraType === 'users' || dataPregunta.id === 'users_participation';

    // Si es usuarios, forzamos Barra siempre. Si no, dejamos que el usuario elija.
    const currentType = isUsersChart ? 'bar' : tipoGrafico;

    const labels = dataPregunta.data.map(item => item.name);
    const valores = dataPregunta.data.map(item => item.value);

    // Procesar imágenes solo si es chart de usuarios
    const imagenes = isUsersChart ? dataPregunta.data.map(item => getAvatarUrl(item.image)) : [];

    // CONFIGURACIÓN DE COLORES
    const backgroundColors = isUsersChart ? (context) => {
        const ctx = context.chart.ctx;
        if (!ctx) return '#f97316';
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, '#f97316'); // Orange-500
        gradient.addColorStop(1, 'rgba(249, 115, 22, 0.2)');
        return gradient;
    } : [
        'rgba(59, 130, 246, 0.7)', // Blue
        'rgba(16, 185, 129, 0.7)', // Emerald
        'rgba(245, 158, 11, 0.7)', // Amber
        'rgba(239, 68, 68, 0.7)',  // Red
        'rgba(139, 92, 246, 0.7)', // Violet
    ];

    const borderColors = isUsersChart ? '#f97316' : [
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(139, 92, 246, 1)',
    ];

    const dataConfig = {
        labels: labels,
        datasets: [
            {
                label: 'Respuestas',
                data: valores,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: isUsersChart ? 2 : 1,
                borderRadius: isUsersChart ? 4 : 0,
                maxBarThickness: isUsersChart ? 40 : 50,
                // Pasamos las imágenes al dataset para que el plugin las lea
                userImages: imagenes,
            },
        ],
    };

    // Obtener opciones centralizadas
    const options = getChartOptions(isDark, isUsersChart, currentType === 'pie');

    return (
        // CORRECCIÓN 1: Quitamos 'h-full' para que la tarjeta no se estire infinitamente
        <Card className="flex flex-col mb-6">
            {/* HEADER */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                    {isUsersChart && <span className="w-1.5 h-5 bg-brand-orange rounded-full"></span>}
                    <h3 className="text-lg font-bold text-content-primary leading-tight">
                        {dataPregunta.titulo}
                    </h3>
                </div>

                {!isUsersChart && (
                    <div className="flex bg-surface-secondary rounded-lg p-1 shrink-0 border border-border-base">
                        <button
                            onClick={() => setTipoGrafico('bar')}
                            className={`p-1.5 rounded transition-colors ${currentType === 'bar' ? 'bg-surface-primary shadow-sm text-brand-blue' : 'text-content-secondary hover:text-content-primary'}`}
                            title="Ver Barras"
                        >
                            <BarIcon size={18} />
                        </button>
                        <button
                            onClick={() => setTipoGrafico('pie')}
                            className={`p-1.5 rounded transition-colors ${currentType === 'pie' ? 'bg-surface-primary shadow-sm text-brand-blue' : 'text-content-secondary hover:text-content-primary'}`}
                            title="Ver Torta"
                        >
                            <PieIcon size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* CHART AREA */}
            {/* CORRECCIÓN 2: Quitamos 'flex-1' y usamos 'height' fijo en lugar de 'minHeight' */}
            <div className="w-full relative" style={{ height: `${forcedHeight}px` }}>
                {currentType === 'bar' ? (
                    <Bar options={options} data={dataConfig} plugins={[avatarAxisPlugin]} />
                ) : (
                    <Pie options={options} data={dataConfig} />
                )}
            </div>

            {/* FOOTER */}
            <div className="mt-4 pt-4 border-t border-border-base text-xs text-content-secondary text-center uppercase tracking-wider">
                Total de registros: {valores.reduce((a, b) => a + b, 0)}
            </div>
        </Card>
    );
}