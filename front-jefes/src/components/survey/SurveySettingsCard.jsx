import { MapPin } from 'lucide-react';

const SurveySettingsCard = ({ requiereUbicacion, setRequiereUbicacion, incluirFecha, setIncluirFecha }) => {
    return (
        <div className="bg-surface-primary p-6 rounded-2xl shadow-sm border border-border-base mb-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="flex-1">
                <h3 className="text-lg font-bold text-content-primary flex items-center gap-2">
                    <MapPin size={20} className="text-brand-blue" />
                    Configuración General
                </h3>
                <p className="text-content-secondary text-sm">Ajusta las opciones globales de la encuesta.</p>
            </div>

            <div className="flex flex-col gap-3">
                {/* Toggle Ubicación */}
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border-base hover:bg-surface-secondary/50">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={requiereUbicacion}
                            onChange={(e) => setRequiereUbicacion(e.target.checked)}
                        />
                        {/* CORRECCIÓN AQUÍ: 
                           Agregué 'after:duration-300' y 'transition-colors duration-300' 
                           para que el switch se mueva y pinte a la misma velocidad que el tema.
                        */}
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 peer-checked:bg-brand-blue transition-colors duration-300"></div>
                    </div>
                    <div>
                        <span className="text-sm font-medium text-content-primary">Pedir Ubicación</span>
                        <span className="block text-xs text-content-secondary">Sección y Barrio</span>
                    </div>
                </label>

                {/* Toggle Fecha Personalizada */}
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border-base hover:bg-surface-secondary/50">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={incluirFecha}
                            onChange={(e) => setIncluirFecha(e.target.checked)}
                        />
                        {/* MISMA CORRECCIÓN AQUÍ */}
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 peer-checked:bg-brand-blue transition-colors duration-300"></div>
                    </div>
                    <div>
                        <span className="text-sm font-medium text-content-primary">Fecha Personalizada</span>
                        <span className="block text-xs text-content-secondary">Permitir elegir fecha de respuesta</span>
                    </div>
                </label>
            </div>
        </div>
    );
};

export default SurveySettingsCard;