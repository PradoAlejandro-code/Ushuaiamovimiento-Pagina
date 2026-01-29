import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MyButton from '../components/ui/MyButton';
import QuestionViewerText from '../components/survey/QuestionViewerText';
import QuestionViewerNumber from '../components/survey/QuestionViewerNumber';
import QuestionViewerOptions from '../components/survey/QuestionViewerOptions';
import QuestionViewerPhoto from '../components/survey/QuestionViewerPhoto';
import QuestionViewerPhone from '../components/survey/QuestionViewerPhone';
import { MapPin, Calendar, Loader, AlertCircle } from 'lucide-react';
import { getSurvey, submitSurvey, getLocations } from '../api';
import Card from '../components/ui/Card';

const SurveyViewer = ({ embeddedId }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const activeId = embeddedId || id;

    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [answers, setAnswers] = useState({});
    const [locationData, setLocationData] = useState({ seccion: "", barrio: "" });
    const [customDate, setCustomDate] = useState("");

    const [availableLocations, setAvailableLocations] = useState([]);
    const [availableBarrios, setAvailableBarrios] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            if (!activeId) return;
            setLoading(true);
            try {
                const [surveyData, locationsData] = await Promise.all([
                    getSurvey(activeId),
                    getLocations().catch(err => [])
                ]);

                setSurvey(surveyData);
                setAvailableLocations(locationsData || []);
            } catch (err) {
                console.error(err);
                setError("No se pudo cargar la encuesta. Intenta nuevamente.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [activeId]);

    const handleAnswerChange = (qId, value) => {
        setAnswers(prev => ({ ...prev, [qId]: value }));
    };

    const handleSeccionChange = (e) => {
        const seccionName = e.target.value;
        setLocationData(prev => ({ ...prev, seccion: seccionName, barrio: "" }));
        const selectedLoc = availableLocations.find(l => l.nombre === seccionName);
        setAvailableBarrios(selectedLoc ? selectedLoc.barrios : []);
    };

    const handleBarrioChange = (e) => {
        setLocationData(prev => ({ ...prev, barrio: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        for (const q of survey.preguntas) {
            if (q.obligatoria && (!answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0))) {
                alert(`⚠️ La pregunta "${q.titulo}" es obligatoria.`);
                const element = document.getElementById(`question-${q.id}`);
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
        }

        const respuestasList = [];
        const filesToUpload = {};

        for (const q of survey.preguntas) {
            const val = answers[q.id];
            if (val === undefined || val === null || val === "") continue;
            else if (q.tipo === 'foto') {
                if (Array.isArray(val)) {
                    filesToUpload[q.id] = val;
                } else if (val instanceof File) {
                    filesToUpload[q.id] = [val];
                }
                respuestasList.push({ pregunta_id: q.id, valor: null });
            }
            else {
                respuestasList.push({ pregunta_id: q.id, valor: val });
            }
        }

        const jsonData = {
            respuestas: respuestasList,
            seccion: survey.requiere_ubicacion ? locationData.seccion : null,
            barrio: survey.requiere_ubicacion ? locationData.barrio : null,
            fecha_custom: survey.incluir_fecha ? customDate : null
        };

        let finalPayload = jsonData;
        if (Object.keys(filesToUpload).length > 0) {
            const formData = new FormData();
            formData.append('data', JSON.stringify(jsonData));
            Object.entries(filesToUpload).forEach(([qId, files]) => {
                files.forEach(file => {
                    formData.append(`foto_${qId}`, file);
                });
            });
            finalPayload = formData;
        }

        try {
            await submitSurvey(survey.id, finalPayload);
            alert("✅ Respuestas enviadas exitosamente");
            if (!embeddedId) {
                navigate('/');
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            alert(`❌ Error al enviar respuestas: ${err.message}`);
        }
    };

    // CORRECCIÓN: Pantalla de carga sincronizada con el tema
    if (loading) return (
        <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-surface-secondary transition-colors duration-300">
            <Loader className="animate-spin text-brand-blue mb-4" size={48} />
            <p className="text-content-secondary font-medium animate-pulse">Cargando encuesta...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex justify-center items-center bg-surface-secondary p-4">
            <Card className="max-w-md w-full text-center border-red-200">
                <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                <p className="text-red-500 font-bold mb-4">{error}</p>
                <MyButton onClick={() => window.location.reload()} className="bg-red-500 text-white w-full">
                    Reintentar
                </MyButton>
            </Card>
        </div>
    );

    if (!survey) return null;

    return (
        <div className="min-h-screen bg-surface-secondary py-4 px-4 md:py-8 transition-colors duration-300">
            <div className="max-w-2xl mx-auto">
                <Card className="mb-6 border-l-4 border-l-brand-blue">
                    <h1 className="text-2xl font-bold text-content-primary mb-2">{survey.nombre}</h1>
                    <p className="text-content-secondary">{survey.descripcion}</p>
                </Card>

                <form onSubmit={handleSubmit}>
                    {survey.requiere_ubicacion && (
                        <Card className="mb-6 !bg-brand-blue/5 border-brand-blue/20">
                            <div className="flex items-center gap-2 mb-4 text-brand-blue">
                                <MapPin size={20} />
                                <h3 className="font-bold text-lg">Ubicación</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">Sección / Zona</label>
                                    <select
                                        required
                                        className="w-full p-3 rounded-lg border border-border-base focus:ring-2 focus:ring-brand-blue/50 outline-none bg-surface-primary text-content-primary transition-colors"
                                        value={locationData.seccion}
                                        onChange={handleSeccionChange}
                                    >
                                        <option value="">Selecciona una Sección</option>
                                        {availableLocations.map(loc => (
                                            <option key={loc.id} value={loc.nombre}>{loc.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">Barrio</label>
                                    <select
                                        required
                                        className="w-full p-3 rounded-lg border border-border-base focus:ring-2 focus:ring-brand-blue/50 outline-none bg-surface-primary text-content-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        value={locationData.barrio}
                                        onChange={handleBarrioChange}
                                        disabled={!locationData.seccion}
                                    >
                                        <option value="">
                                            {!locationData.seccion ? "Primero elige Sección" : "Selecciona Barrio"}
                                        </option>
                                        {availableBarrios.map(barrio => (
                                            <option key={barrio.id} value={barrio.nombre}>{barrio.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </Card>
                    )}

                    {survey.incluir_fecha && (
                        <Card className="mb-6 border-border-base">
                            <div className="flex items-center gap-2 mb-4 text-brand-blue">
                                <Calendar size={20} />
                                <h3 className="font-bold text-lg">Fecha de Respuesta</h3>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">Selecciona Fecha y Hora</label>
                                <input
                                    type="datetime-local"
                                    className="w-full p-3 rounded-lg border border-border-base focus:ring-2 focus:ring-brand-blue/50 outline-none bg-surface-primary text-content-primary transition-colors"
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                />
                                <p className="text-xs text-content-secondary mt-2 opacity-70">Si no seleccionas nada, se usará la fecha actual.</p>
                            </div>
                        </Card>
                    )}

                    <div className="space-y-4">
                        {survey.preguntas.map((q) => {
                            const val = answers[q.id];
                            return (
                                <div key={q.id} id={`question-${q.id}`}>
                                    {(() => {
                                        switch (q.tipo) {
                                            case 'texto': return <QuestionViewerText question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                            case 'numero': return <QuestionViewerNumber question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                            case 'opciones': return <QuestionViewerOptions question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                            case 'foto': return <QuestionViewerPhoto question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                            case 'telefono': return <QuestionViewerPhone question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                            default: return null;
                                        }
                                    })()}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8">
                        <MyButton type="submit" className="bg-brand-blue text-white hover:bg-brand-blue/90 py-3 shadow-lg shadow-blue-500/30 w-full transition-all">
                            Enviar Respuestas
                        </MyButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SurveyViewer;