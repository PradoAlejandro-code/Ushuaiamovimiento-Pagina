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

export default function ChartCard({ dataPregunta, className = "" }) {
    const [tipoGrafico, setTipoGrafico] = useState('bar');
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    if (!dataPregunta || !dataPregunta.data || dataPregunta.data.length === 0) {
        return null;
    }

    const isUsersChart = dataPregunta.extraType === 'users' || dataPregunta.id === 'users_participation';
    const currentType = isUsersChart ? 'bar' : tipoGrafico;
    const labels = dataPregunta.data.map(item => item.name);
    const valores = dataPregunta.data.map(item => item.value);
    const imagenes = isUsersChart ? dataPregunta.data.map(item => getAvatarUrl(item.image)) : [];

    const backgroundColors = isUsersChart ? '#f97316' : [
        'rgba(59, 130, 246, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(245, 158, 11, 0.7)',
        'rgba(239, 68, 68, 0.7)',
        'rgba(139, 92, 246, 0.7)',
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
                maxBarThickness: isUsersChart ? 60 : 50,
                userImages: imagenes,
            },
        ],
    };

    const baseOptions = getChartOptions(isDark, isUsersChart, currentType === 'pie');
    const finalOptions = {
        ...baseOptions,
        maintainAspectRatio: false,
    };

    return (
        <Card className={`flex flex-col h-full mb-0 ${className}`}>
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
                        >
                            <BarIcon size={18} />
                        </button>
                        <button
                            onClick={() => setTipoGrafico('pie')}
                            className={`p-1.5 rounded transition-colors ${currentType === 'pie' ? 'bg-surface-primary shadow-sm text-brand-blue' : 'text-content-secondary hover:text-content-primary'}`}
                        >
                            <PieIcon size={18} />
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 w-full relative min-h-0">
                {currentType === 'bar' ? (
                    <Bar options={finalOptions} data={dataConfig} plugins={[avatarAxisPlugin]} />
                ) : (
                    <Pie options={finalOptions} data={dataConfig} />
                )}
            </div>
        </Card>
    );
} 1