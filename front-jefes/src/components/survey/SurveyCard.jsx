import React from 'react';
import Card from '../ui/Card';
import MyButton from '../ui/MyButton';
import { Edit3, BarChart2, Calendar } from 'lucide-react';

const SurveyCard = ({ survey, onEdit, onViewResults }) => {
    return (
        <Card className="flex flex-col h-full justify-between hover:border-brand-blue/50 transition-colors duration-300">
            <div>
                <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="text-lg font-bold text-content-primary leading-tight">
                        {survey.nombre}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`w-2.5 h-2.5 rounded-full ${survey.activo ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                            {survey.activo ? 'Activa' : 'Pausada'}
                        </span>
                    </div>
                </div>

                <p className="text-content-secondary text-sm line-clamp-2 mb-4">
                    {survey.descripcion || "Sin descripción adicional para esta encuesta."}
                </p>

                <div className="flex items-center gap-2 text-content-secondary text-xs mb-6">
                    <Calendar size={14} />
                    <span>Creada el {new Date(survey.created_at).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="flex gap-3 mt-auto">
                <MyButton
                    onClick={() => onEdit(survey.id)}
                    className="flex-1 bg-surface-secondary text-content-primary border border-border-base hover:bg-surface-tertiary flex items-center justify-center gap-2 !py-2.5 text-sm"
                >
                    <Edit3 size={16} />
                    Editar
                </MyButton>

                <MyButton
                    onClick={() => onViewResults(survey.id)}
                    className="flex-1 bg-brand-blue text-white shadow-md shadow-blue-900/20 hover:bg-brand-blue/90 flex items-center justify-center gap-2 !py-2.5 text-sm"
                >
                    <BarChart2 size={16} />
                    Respuestas
                </MyButton>
            </div>
        </Card>
    );
};

export default SurveyCard;