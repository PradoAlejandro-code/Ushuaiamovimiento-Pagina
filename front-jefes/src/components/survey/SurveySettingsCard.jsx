import { MapPin } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

const SurveySettingsCard = ({ requiereUbicacion, setRequiereUbicacion, incluirFecha, setIncluirFecha, activarEncuestadorManual, setActivarEncuestadorManual, naked = false, className = "" }) => {
    const containerClasses = naked
        ? `w-full ${className}`
        : `bg-surface-primary p-6 rounded-2xl shadow-sm border border-border-base mb-6 flex flex-col md:flex-row gap-6 items-start md:items-center ${className}`;

    return (
        <div className={containerClasses}>
            <div className="flex-1">
                <h3 className="text-lg font-bold text-content-primary flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                        <MapPin size={18} className="text-brand-blue" />
                    </div>
                    Configuración General
                </h3>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto mt-4">
                {/* Toggle Ubicación */}
                <label className="flex items-center gap-4 cursor-pointer py-2 px-3 rounded-xl border border-border-base/50 hover:bg-surface-secondary/50 transition-all group">
                    <Switch 
                        checked={requiereUbicacion} 
                        onCheckedChange={setRequiereUbicacion}
                    />
                    <div>
                        <span className="text-sm font-bold text-content-primary group-hover:text-brand-blue transition-colors">Pedir Ubicación</span>
                        <span className="block text-[10px] uppercase tracking-widest font-black text-content-secondary opacity-60">Sección y Barrio</span>
                    </div>
                </label>

                {/* Toggle Fecha Personalizada */}
                <label className="flex items-center gap-4 cursor-pointer py-2 px-3 rounded-xl border border-border-base/50 hover:bg-surface-secondary/50 transition-all group">
                    <Switch 
                        checked={incluirFecha} 
                        onCheckedChange={setIncluirFecha}
                    />
                    <div>
                        <span className="text-sm font-bold text-content-primary group-hover:text-brand-blue transition-colors">Fecha Personalizada</span>
                        <span className="block text-[10px] uppercase tracking-widest font-black text-content-secondary opacity-60">Permitir elegir fecha</span>
                    </div>
                </label>

                {/* Toggle Encuestador Manual */}
                <label className="flex items-center gap-4 cursor-pointer py-2 px-3 rounded-xl border border-border-base/50 hover:bg-surface-secondary/50 transition-all group">
                    <Switch 
                        checked={activarEncuestadorManual} 
                        onCheckedChange={setActivarEncuestadorManual}
                    />
                    <div>
                        <span className="text-sm font-bold text-content-primary group-hover:text-brand-blue transition-colors">Encuestador Manual</span>
                        <span className="block text-[10px] uppercase tracking-widest font-black text-content-secondary opacity-60">Carga por terceros</span>
                    </div>
                </label>
            </div>
        </div>
    );
};

export default SurveySettingsCard;