import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSurvey, getSurveyResponses, getRelevamiento, updateResponse, deleteResponse } from '../api';
import {
    ArrowLeft, Loader, Download, FileText, User, Calendar,
    Eye, MapPin, X, Edit2, Trash2, Save
} from 'lucide-react';
import Card from '../components/ui/Card';

const SurveyResponsesPage = ({ isRelevamiento = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [encuesta, setEncuesta] = useState(null);
    const [respuestas, setRespuestas] = useState([]);
    const [preguntas, setPreguntas] = useState([]);
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [id, isRelevamiento]);

    const loadData = async () => {
        setLoading(true);
        try {
            let encuestaData;
            let respuestasData;

            if (isRelevamiento) {
                encuestaData = await getRelevamiento();
                respuestasData = await getSurveyResponses(encuestaData.id);
            } else {
                [encuestaData, respuestasData] = await Promise.all([
                    getSurvey(id),
                    getSurveyResponses(id)
                ]);
            }

            setEncuesta(encuestaData);
            setPreguntas(encuestaData.preguntas);
            setRespuestas(respuestasData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <Loader className="animate-spin text-brand-blue" size={40} />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/surveys')}
                        className="p-2 hover:bg-surface-secondary rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-content-primary">
                            {isRelevamiento ? `Relevamiento: ${encuesta?.nombre}` : `Respuestas: ${encuesta?.nombre}`}
                        </h1>
                        <p className="text-sm text-content-secondary">
                            {respuestas.length} formularios recibidos
                        </p>
                    </div>
                </div>

                <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-emerald-700 transition-all">
                    <Download size={18} /> Exportar Datos
                </button>
            </div>

            <Card className="!p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface-secondary border-b border-border-base text-xs uppercase text-content-secondary">
                            <tr>
                                <th className="p-4 pl-6">ID / Encuestador</th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Ubicación</th>
                                <th className="p-4 text-right pr-6">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-base">
                            {respuestas.map((rta) => (
                                <tr key={rta.id} className="hover:bg-brand-blue/5 transition-colors">
                                    <td className="p-4 pl-6">
                                        <div className="font-bold text-brand-blue">#{rta.id}</div>
                                        <div className="text-xs text-content-secondary">{rta.usuario_nombre || "Anónimo"}</div>
                                    </td>
                                    <td className="p-4 text-sm text-content-primary">
                                        {rta.fecha_format}
                                    </td>
                                    <td className="p-4 text-sm text-content-secondary">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} /> {rta.barrio || "N/A"}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                        <button
                                            onClick={() => setSelectedResponse(rta)}
                                            className="text-brand-blue font-medium hover:underline text-sm flex items-center gap-1 ml-auto"
                                        >
                                            <Eye size={16} /> Ver detalle
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {selectedResponse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    {/* Modal logic goes here */}
                </div>
            )}
        </div>
    );
};

export default SurveyResponsesPage;