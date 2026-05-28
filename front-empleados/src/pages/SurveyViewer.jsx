import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MyButton from '../components/ui/MyButton';
import QuestionViewerText from '../components/survey/QuestionViewerText';
import QuestionViewerNumber from '../components/survey/QuestionViewerNumber';
import QuestionViewerOptions from '../components/survey/QuestionViewerOptions';
import QuestionViewerPhoto from '../components/survey/QuestionViewerPhoto';
import QuestionViewerPhone from '../components/survey/QuestionViewerPhone';
import { MapPin, Calendar, Loader, AlertCircle, UserCheck, CircleAlert } from 'lucide-react';
import { getSurvey, submitSurvey, getLocations, getUsers } from '../api';
import Card from '../components/ui/Card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';

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

    // Manual Surveyor
    const [availableUsers, setAvailableUsers] = useState([]);
    const [manualSurveyorId, setManualSurveyorId] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [processingQuestions, setProcessingQuestions] = useState(new Set());
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    // Estado para controlar qué grupos (acordeones) están abiertos
    const [accordionValue, setAccordionValue] = useState([]);

    // Estado para el modal de alertas (reemplaza a window.alert)
    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: "",
        description: "",
        variant: "primary",
        onConfirm: null
    });

    const handleProcessingStatus = (qId, isProcessing) => {
        setProcessingQuestions(prev => {
            const next = new Set(prev);
            if (isProcessing) {
                next.add(qId);
            } else {
                next.delete(qId);
            }
            return next;
        });
    };

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
                const rawLocations = locationsData.results || locationsData;
                setAvailableLocations(Array.isArray(rawLocations) ? rawLocations : []);

                if (surveyData.activar_encuestador_manual) {
                    try {
                        const usersData = await getUsers();
                        // Assume format is array of objects {id, first_name, last_name, username} format.
                        // Or if it's paginated, usersData.results
                        const rawUsers = usersData.results || usersData;
                        setAvailableUsers(Array.isArray(rawUsers) ? rawUsers : []);
                    } catch (e) {
                        console.error('Error fetching users:', e);
                    }
                }

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

    const handleSeccionChange = (val) => {
        const seccionName = val && val.target ? val.target.value : val;
        setLocationData(prev => ({ ...prev, seccion: seccionName, barrio: "" }));
        const selectedLoc = availableLocations.find(l => l.nombre === seccionName);
        setAvailableBarrios(selectedLoc ? selectedLoc.barrios : []);
    };

    const handleBarrioChange = (val) => {
        const barrioName = val && val.target ? val.target.value : val;
        setLocationData(prev => ({ ...prev, barrio: barrioName }));
    };

    const handleSubmitClick = (e) => {
        e.preventDefault();

        // Prevent double submission
        if (isSubmitting || processingQuestions.size > 0) return;

        for (const q of survey.preguntas) {
            if (q.obligatoria && (!answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0))) {
                setAlertModal({
                    isOpen: true,
                    title: "Pregunta Obligatoria",
                    description: `La pregunta "${q.titulo}" es obligatoria.`,
                    variant: "danger",
                    onConfirm: () => setAlertModal(prev => ({ ...prev, isOpen: false }))
                });
                
                if (q.grupo_id) {
                    // Abrir el acordeón si está cerrado
                    const groupStr = `grupo-${q.grupo_id}`;
                    setAccordionValue(prev => prev.includes(groupStr) ? prev : [...prev, groupStr]);
                    // Esperar a que React renderice el DOM
                    setTimeout(() => {
                        const element = document.getElementById(`question-${q.id}`);
                        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                } else {
                    const element = document.getElementById(`question-${q.id}`);
                    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }
        }

        // Validar si activó encuestador manual, que envíe un encuestador
        if (survey.activar_encuestador_manual && !manualSurveyorId) {
            setAlertModal({
                isOpen: true,
                title: "Encuestador Requerido",
                description: "Debes seleccionar un Encuestador.",
                variant: "danger",
                onConfirm: () => setAlertModal(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        setIsConfirmModalOpen(true);
    };

    const handleConfirmSubmit = async () => {
        setIsSubmitting(true);

        const respuestasList = [];
        const filesToUpload = {};

        for (const q of survey.preguntas) {
            const val = answers[q.id];
            if (val === undefined || val === null || val === "") continue;
            else if (q.tipo === 'foto') {
                // CAMBIO: Usamos Blob en lugar de File para máxima compatibilidad
                if (Array.isArray(val)) {
                    filesToUpload[q.id] = val;
                } else if (val instanceof Blob) {
                    filesToUpload[q.id] = [val];
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

        if (survey.activar_encuestador_manual && manualSurveyorId) {
            jsonData.usuario_id = manualSurveyorId;
            // Also explicitly set the custom date if we're submitting manually to hit RespuestaManualCreateView perfectly
            if (customDate) jsonData.fecha_manual = customDate;
        }

        let finalPayload = jsonData;
        if (Object.keys(filesToUpload).length > 0) {
            const formData = new FormData();
            formData.append('data', JSON.stringify(jsonData));
            Object.entries(filesToUpload).forEach(([qId, files]) => {
                files.forEach((file, index) => {
                    // FORZAMOS NOMBRE Y EXTENSIÓN PARA CELULARES VIEJOS
                    const fileName = `foto_${qId}_${Date.now()}_${index}.jpg`;
                    formData.append(`foto_${qId}`, file, fileName);
                });
            });
            if (survey.activar_encuestador_manual && manualSurveyorId) {
                formData.append('usuario_id', manualSurveyorId);
                if (customDate) formData.append('fecha_manual', customDate);
            }
            finalPayload = formData;
        }

        try {
            await submitSurvey(survey.id, finalPayload);
            setIsSubmitting(false);
            setIsConfirmModalOpen(false);
            setAlertModal({
                isOpen: true,
                title: "¡Éxito!",
                description: "Respuestas enviadas exitosamente",
                variant: "success",
                onConfirm: () => {
                    setAlertModal(prev => ({ ...prev, isOpen: false }));
                    if (!embeddedId) {
                        navigate('/');
                    } else {
                        window.location.reload();
                    }
                }
            });
        } catch (err) {
            console.error(err);
            setIsSubmitting(false); // Only re-enable on error
            setIsConfirmModalOpen(false);
            setAlertModal({
                isOpen: true,
                title: "Error al enviar",
                description: err.message,
                variant: "danger",
                onConfirm: () => setAlertModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    if (loading) return (
        <div className="space-y-6 w-full">
            {/* Skeleton de Ubicación */}
            <div className="border border-border-base p-5 rounded-2xl shadow-sm bg-card">
                <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-2.5">
                        <Skeleton className="w-5 h-5 rounded-md" />
                        <Skeleton className="w-24 h-6 rounded-md" />
                    </div>
                    <Skeleton className="w-5 h-5 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="w-28 h-3 rounded-md" />
                        <Skeleton className="w-full h-10 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="w-16 h-3 rounded-md" />
                        <Skeleton className="w-full h-10 rounded-xl" />
                    </div>
                </div>
            </div>

            {/* Skeleton de Fecha de Respuesta */}
            <div className="border border-border-base p-5 rounded-2xl shadow-sm bg-card">
                <div className="flex items-center gap-2.5 mb-6">
                    <Skeleton className="w-5 h-5 rounded-md" />
                    <Skeleton className="w-44 h-6 rounded-md" />
                </div>
                <div className="flex flex-col gap-2.5">
                    <Skeleton className="w-48 h-3 rounded-md" /> {/* Label */}
                    <Skeleton className="w-full h-12 rounded-xl" /> {/* Input más alto para coincidir con la card */}
                </div>
                <Skeleton className="w-3/4 h-3 rounded-md mt-3.5" /> {/* Texto inferior */}
            </div>

            {/* Skeleton de Acordeones (Pasos 1, 2 y 3) */}
            <div className="space-y-4">
                {[
                    { id: 1, width: "w-16" },
                    { id: 2, width: "w-56" },
                    { id: 3, width: "w-36" }
                ].map((item) => (
                    <div key={item.id} className="border border-border-base bg-surface-primary rounded-xl shadow-sm px-4 flex items-center justify-between h-[68px]">
                        <div className="flex items-center gap-3 w-full">
                            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                            <Skeleton className={`${item.width} h-5 rounded-md`} />
                        </div>
                        <Skeleton className="w-4 h-4 rounded-md shrink-0" />
                    </div>
                ))}
            </div>
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
        <div className={embeddedId
            ? "w-full bg-transparent transition-colors duration-300"
            : "min-h-screen bg-surface-secondary py-4 px-4 md:py-8 transition-colors duration-300"
        }>
            <div className={embeddedId ? "w-full" : "max-w-2xl mx-auto"}>


                <form onSubmit={handleSubmitClick}>
                    {survey.requiere_ubicacion && (
                        <Card className="mb-6 !bg-brand-blue/5 border-brand-blue/20 relative">
                            <div className="absolute top-4 right-4 text-red-500" title="Ubicación Obligatoria">
                                <CircleAlert size={20} />
                            </div>
                            <div className="flex items-center gap-2 mb-4 text-brand-blue">
                                <MapPin size={20} />
                                <h3 className="font-bold text-lg">Ubicación</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">Sección / Zona</label>
                                    <Select value={locationData.seccion || undefined} onValueChange={handleSeccionChange} required>
                                        <SelectTrigger className="w-full h-[48px] px-3 !py-0 rounded-lg border border-border-base focus:ring-2 focus:ring-brand-blue/50 outline-none bg-surface-primary text-content-primary transition-colors">
                                            <SelectValue placeholder="Selecciona una Sección" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableLocations.map(loc => (
                                                <SelectItem key={loc.id} value={loc.nombre} className="cursor-pointer">{loc.nombre}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">Barrio</label>
                                    <Select value={locationData.barrio || undefined} onValueChange={handleBarrioChange} required disabled={!locationData.seccion}>
                                        <SelectTrigger className="w-full h-[48px] px-3 !py-0 rounded-lg border border-border-base focus:ring-2 focus:ring-brand-blue/50 outline-none bg-surface-primary text-content-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            <SelectValue placeholder={!locationData.seccion ? "Primero elige Sección" : "Selecciona Barrio"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableBarrios.map(barrio => (
                                                <SelectItem key={barrio.id} value={barrio.nombre} className="cursor-pointer">{barrio.nombre}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                    type="date"
                                    className="w-full h-[48px] px-3 rounded-lg border border-border-base focus:ring-2 focus:ring-brand-blue/50 outline-none bg-surface-primary text-content-primary transition-colors"
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                />
                                <p className="text-xs text-content-secondary mt-2 opacity-70">Si no seleccionas nada, se usará la fecha actual.</p>
                            </div>
                        </Card>
                    )}

                    {survey.activar_encuestador_manual && (
                        <Card className="mb-6 !bg-brand-blue/5 border-brand-blue/20">
                            <div className="flex items-center gap-2 mb-4 text-brand-blue">
                                <UserCheck size={20} />
                                <h3 className="font-bold text-lg">Encuestador</h3>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">Seleccionar Encuestador Real</label>
                                <Select value={manualSurveyorId || undefined} onValueChange={(val) => setManualSurveyorId(val)} required>
                                    <SelectTrigger className="w-full h-[48px] px-3 !py-0 rounded-lg border border-border-base focus:ring-2 focus:ring-brand-blue/50 outline-none bg-surface-primary text-content-primary transition-colors">
                                        <SelectValue placeholder="Selecciona quién hizo esta encuesta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableUsers.map(u => (
                                            <SelectItem key={u.id} value={String(u.id)} className="cursor-pointer">
                                                {(u.first_name || u.last_name) ? `${u.first_name} ${u.last_name}` : u.username}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </Card>
                    )}

                    <div className="space-y-4">
                        {/* 1. Preguntas CON grupo (Acordeones) */}
                        {survey.grupos && survey.grupos.length > 0 && (
                            <Accordion type="multiple" value={accordionValue} onValueChange={setAccordionValue} className="w-full space-y-4">
                                {survey.grupos.map((grupo) => {
                                    const groupQuestions = survey.preguntas.filter(q => q.grupo_id === grupo.id);
                                    if (groupQuestions.length === 0) return null;
                                    
                                    return (
                                        <AccordionItem key={grupo.id} value={`grupo-${grupo.id}`} className="border border-border-base bg-surface-primary rounded-xl shadow-sm overflow-hidden px-4">
                                            <AccordionTrigger className="hover:no-underline py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold text-sm">
                                                        {grupo.orden}
                                                    </div>
                                                    <h3 className="font-bold text-content-primary text-left">{grupo.nombre}</h3>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-2 pb-4 space-y-4">
                                                {groupQuestions.map((q) => {
                                                    const val = answers[q.id];
                                                    return (
                                                        <div key={q.id} id={`question-${q.id}`}>
                                                            {(() => {
                                                                switch (q.tipo) {
                                                                    case 'texto': return <QuestionViewerText question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                                    case 'numero': return <QuestionViewerNumber question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                                    case 'opciones': return <QuestionViewerOptions question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                                    case 'foto': return <QuestionViewerPhoto question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} onProcessingStatus={handleProcessingStatus} />;
                                                                    case 'telefono': return <QuestionViewerPhone question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                                    case 'celular': return <QuestionViewerPhone question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                                    case 'nombre': return <QuestionViewerText question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                                    case 'dni': return <QuestionViewerText question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                                    case 'mail': return <QuestionViewerText question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                                    default: return null;
                                                                }
                                                            })()}
                                                        </div>
                                                    );
                                                })}
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        )}

                        {/* 2. Preguntas SIN grupo (Planas) */}
                        {(() => {
                            const unGrouped = survey.preguntas.filter(q => !q.grupo_id);
                            return unGrouped.map((q) => {
                                const val = answers[q.id];
                                return (
                                    <div key={q.id} id={`question-${q.id}`}>
                                        {(() => {
                                            switch (q.tipo) {
                                                case 'texto': return <QuestionViewerText question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                case 'numero': return <QuestionViewerNumber question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                case 'opciones': return <QuestionViewerOptions question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                case 'foto': return <QuestionViewerPhoto question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} onProcessingStatus={handleProcessingStatus} />;
                                                case 'telefono': return <QuestionViewerPhone question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                case 'celular': return <QuestionViewerPhone question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                case 'nombre': return <QuestionViewerText question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                case 'dni': return <QuestionViewerText question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                case 'mail': return <QuestionViewerText question={q} value={val} onChange={(v) => handleAnswerChange(q.id, v)} />;
                                                default: return null;
                                            }
                                        })()}
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    <div className="mt-8">
                        <MyButton
                            type="submit"
                            disabled={isSubmitting || processingQuestions.size > 0}
                            className={`bg-brand-blue text-white py-3 w-full transition-all ${processingQuestions.size > 0 ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {processingQuestions.size > 0 ? 'Procesando imágenes...' : (isSubmitting ? 'Enviando...' : 'Enviar Respuestas')}
                        </MyButton>
                    </div>
                </form>
            </div>

            <AlertDialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Enviar Respuestas?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se registrarán las respuestas y se enviarán al sistema.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting} className="border-border-base text-content-primary hover:bg-surface-secondary">Revisar</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirmSubmit(); }} disabled={isSubmitting} className="!bg-brand-blue !text-white hover:!bg-brand-blue border-0">
                            {isSubmitting ? "Enviando..." : "Enviar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={alertModal.isOpen} onOpenChange={(open) => !open && setAlertModal(prev => ({ ...prev, isOpen: false }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertModal.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertModal.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction 
                            onClick={alertModal.onConfirm} 
                            className={alertModal.variant === "danger" ? "!bg-red-500 !text-white hover:!bg-red-500 border-0" : "!bg-brand-blue !text-white hover:!bg-brand-blue border-0"}
                        >
                            Aceptar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default SurveyViewer;