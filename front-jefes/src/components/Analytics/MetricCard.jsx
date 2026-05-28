import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ title, value, trend, trendLabel, icon: Icon, variant = 'blue', className = '' }) => {
    const variants = {
        orange: "bg-brand-orange shadow-[0_0_15px_rgba(249,115,22,0.3)]",
        blue: "bg-brand-blue shadow-[0_0_15px_rgba(30,136,229,0.3)]",
        green: "bg-emerald-600 shadow-[0_0_15px_rgba(5,150,105,0.3)]"
    };

    return (
        <div className={`bg-surface-secondary rounded-2xl p-6 border border-border-base transition-all duration-300 group flex flex-col justify-center ${className}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 min-w-0">
                    <p className="text-content-secondary text-[10px] font-bold uppercase tracking-widest truncate">{title}</p>
                    <p className={`font-black text-content-primary leading-tight truncate ${
                        typeof value === 'string' && value.length > 10 ? 'text-xl' : 'text-3xl'
                    }`}>
                        {value}
                    </p>

                    {/* Solo mostramos el trend si se pasa la prop 'trend' */}
                    {trend !== undefined && (
                        <div className="flex items-center gap-1.5 pt-1">
                            <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${trend >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(trend)}%
                            </div>
                            <span className="text-[10px] text-content-secondary font-medium uppercase">
                                {trendLabel}
                            </span>
                        </div>
                    )}
                </div>

                <div className={`p-4 rounded-xl text-white shrink-0 ${variants[variant]}`}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>
        </div>
    );
};

export default MetricCard;