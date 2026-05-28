import { useNavigate } from 'react-router-dom';
import { Loader, Settings2 } from 'lucide-react';
import SurveyCard from '../components/survey/SurveyCard';
import { useAllSurveys, useUpdateSurvey } from '@/queries/useSurveys'; 

const SurveysPage = () => {
    const navigate = useNavigate();
    
    // 1. Reemplazamos todos los useState y useEffect por el Hook de lectura
    const { data: encuestasData, isLoading } = useAllSurveys(1); 
    
    // 2. Traemos el Hook de mutación para actualizar
    const { mutate: updateSurveyMutation } = useUpdateSurvey();

    // Extraemos los resultados (tu API devuelve { results: [...] } o el array directo)
    const surveys = encuestasData?.results || encuestasData || [];

    const handleToggleActive = (id, currentStatus) => {
        updateSurveyMutation({ 
            id, 
            payload: { activo: !currentStatus } 
        }, {
            onError: () => {
                alert("No se pudo actualizar el estado de la encuesta.");
            }
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-content-primary">Lista de Encuestas</h1>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader className="animate-spin text-brand-blue" size={40} />
                    <p className="text-content-secondary animate-pulse">Cargando encuestas...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {surveys.map((survey) => (
                        <SurveyCard
                            key={survey.id}
                            survey={survey}
                            onEdit={(id) => navigate(`/surveys/edit/${id}`)}
                            onViewResults={(id) => navigate(`/surveys/responses/${id}`)}
                            onToggleActive={handleToggleActive}
                        />
                    ))}

                    {/* Estado vacío */}
                    {surveys.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-surface-secondary rounded-2xl border-2 border-dashed border-border-base">
                            <Settings2 className="mx-auto text-content-secondary mb-4" size={48} />
                            <p className="text-content-secondary font-medium">No se encontraron encuestas activas.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SurveysPage;