import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSurveys } from '@/api/surveys';
import { Loader, Settings2 } from 'lucide-react';
import SurveyCard from '../components/survey/SurveyCard';

const SurveysPage = () => {
    const navigate = useNavigate();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSurveys();
    }, []);

    const fetchSurveys = async () => {
        try {
            setLoading(true);
            const data = await getAllSurveys();
            setSurveys(data);
        } catch (error) {
            console.error("Error al cargar encuestas:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-content-primary">Lista de Encuestas</h1>
                </div>
            </div>

            {loading ? (
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