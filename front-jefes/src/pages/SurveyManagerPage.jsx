import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSurveys } from '../api';
import { Edit, Loader } from 'lucide-react';
import Card from '../components/ui/Card';

const SurveyManagerPage = () => {
    const navigate = useNavigate();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSurveys();
    }, []);

    const fetchSurveys = async () => {
        try {
            const data = await getAllSurveys();
            // Filtrar Relevamientos (se gestionan aparte)
            const filtered = data.filter(s => !s.es_relevamiento);
            setSurveys(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader className="animate-spin text-brand-blue" /></div>;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-content-primary mb-6">Gestionar Encuestas</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {surveys.map(survey => (
                    <Card
                        key={survey.id}
                        className={`flex flex-col relative overflow-hidden group !p-5
                            ${!survey.activo
                                ? '!bg-surface-secondary opacity-75 grayscale hover:grayscale-0'
                                : '!bg-transparent border-border-base'}
                        `}
                    >
                        {/* Indicador visual de estado (borde superior de color si activa) */}
                        {survey.activo && <div className="absolute top-0 left-0 w-full h-1 bg-brand-blue"></div>}

                        <div className="flex justify-between items-start mb-2 mt-2">
                            <h3 className={`font-bold text-lg line-clamp-1 ${survey.activo ? 'text-content-primary' : 'text-content-secondary'}`} title={survey.nombre}>
                                {survey.nombre}
                            </h3>
                            <span className="bg-brand-blue/10 text-brand-blue text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap" title="Total de respuestas">
                                {survey.conteo_respuestas || 0} res.
                            </span>
                        </div>

                        <p className="text-content-secondary text-sm mb-6 h-10 line-clamp-2">
                            {survey.descripcion || "Sin descripción"}
                        </p>

                        <div className="flex items-center justify-end mt-auto pt-4 border-t border-border-base gap-2">
                            <button
                                onClick={() => navigate(`/surveys/edit/${survey.id}`)}
                                className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg
                                    ${survey.activo
                                        ? 'bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20'
                                        : 'bg-surface-primary border border-border-base text-content-secondary hover:bg-surface-secondary'}`}
                            >
                                <Edit size={16} />
                                Editar
                            </button>
                        </div>
                    </Card>
                ))}

                {surveys.length === 0 && (
                    <div className="col-span-full py-12 text-center text-content-secondary border-2 border-dashed border-border-base rounded-xl bg-surface-secondary/30">
                        No hay encuestas creadas.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SurveyManagerPage;