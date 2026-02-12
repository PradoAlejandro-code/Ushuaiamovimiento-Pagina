import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ title, value, trend, icon: Icon, variant = 'blue' }) => {
    const variants = {
        orange: "bg-brand-orange shadow-[0_0_15px_rgba(249,115,22,0.3)]",
        blue: "bg-brand-blue shadow-[0_0_15px_rgba(30,136,229,0.3)]",
        green: "bg-emerald-600 shadow-[0_0_15px_rgba(5,150,105,0.3)]"
    };

    return (
        <div className="bg-surface-secondary rounded-2xl p-6 border border-border-base hover:border-brand-blue/30 transition-all duration-300 group">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-content-secondary text-[10px] font-bold uppercase tracking-widest">
                        {title}
                    </p>
                    <p className="text-3xl font-black text-content-primary">
                        {value}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                        <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${trend >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                            {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {Math.abs(trend)}%
                        </div>
                        <span className="text-[10px] text-content-secondary font-medium">
                            vs. mes anterior
                        </span>
                    </div>
                </div>

                <div className={`p-4 rounded-xl text-white transition-transform duration-300 group-hover:scale-110 ${variants[variant]}`}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>
        </div>
    );
};

export default MetricCard;