import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSurvey, getRelevamiento, getAllSurveys, createQuestion, deleteQuestion, updateQuestion, updateSurvey } from '../api';
import MyButton from "../components/ui/MyButton";
import QuestionBuilderText from "../components/survey/QuestionBuilderText";
import QuestionBuilderNumber from "../components/survey/QuestionBuilderNumber";
import QuestionBuilderOptions from "../components/survey/QuestionBuilderOptions";
import QuestionBuilderPhoto from "../components/survey/QuestionBuilderPhoto";
import QuestionBuilderPhone from "../components/survey/QuestionBuilderPhone";

import SurveyTitleCard from "../components/survey/SurveyTitleCard";
import SurveySettingsCard from "../components/survey/SurveySettingsCard";
import { Type, Hash, List, Camera, ArrowLeft, Loader, Save, UserPlus, Phone } from 'lucide-react';

const EditSurveyPage = ({ isRelevamiento = false }) => {
    const params = useParams();
    const navigate = useNavigate();
    const [surveyId, setSurveyId] = useState(params.id);
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");

    // Estados para Header
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [active, setActive] = useState(true);
    const [requiereUbicacion, setRequiereUbicacion] = useState(false);
    const [incluirFecha, setIncluirFecha] = useState(false);

    // Estado local de preguntas para visualización
    const [localQuestions, setLocalQuestions] = useState([]);
    // Cola de IDs para borrar al guardar
    const [deletedIds, setDeletedIds] = useState([]);

    useEffect(() => {
        loadSurvey();
    }, [params.id, isRelevamiento]);

    const loadSurvey = async () => {
        setLoading(true);
        try {
            let id = params.id;
            let data;

            if (isRelevamiento) {
                data = await getRelevamiento();
                id = data.id;
            } else if (id) {
                data = await getSurvey(id);
            }

            if (data) {
                setSurveyId(id);
                setSurvey(data);
                setTitle(data.nombre);
                setDescription(data.descripcion || "");
                setActive(data.activo !== undefined ? data.activo : true);
                setRequiereUbicacion(data.requiere_ubicacion || false);
                setIncluirFecha(data.incluir_fecha || false);
                setLocalQuestions(data.preguntas || []);
                setDeletedIds([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Macro: Agregar Datos Básicos
    const addBasicData = () => {
        const basicFields = [
            { title: "Nombre y Apellido", type: "texto" },
            { title: "Calle y Número", type: "texto" },
            { title: "Teléfono", type: "telefono" }
        ];
        const newDrafts = basicFields.map((field, idx) => ({
            id: `temp-${Date.now() + idx}`,
            isDraft: true,
            encuesta: surveyId,
            titulo: field.title,
            tipo: field.type,
            orden: localQuestions.length + 1 + idx,
            activa: true,
            obligatoria: true,
            opciones: null
        }));

        setLocalQuestions(prev => [...prev, ...newDrafts]);

        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
    };

    // Agregar Pregunta (Local Draft)
    const handleAddQuestion = (type) => {
        const newDraft = {
            id: `temp-${Date.now()}`,
            isDraft: true,
            encuesta: surveyId,
            titulo: "",
            tipo: type,
            orden: localQuestions.length + 1,
            activa: true,
            obligatoria: false,
            opciones: type === 'opciones' ? ["Si", "No"] : null
        };

        setLocalQuestions(prev => [...prev, newDraft]);

        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
    };

    // Borrar Pregunta (Cola de borrado)
    const handleDeleteQuestion = (qId) => {
        if (!window.confirm("¿Eliminar esta pregunta? Se aplicará al guardar.")) return;

        const isDraft = String(qId).startsWith('temp-');

        // Quitar de la vista local
        setLocalQuestions(prev => prev.filter(p => p.id !== qId));

        // Si no es draft, agregar a la cola de eliminación
        if (!isDraft) {
            setDeletedIds(prev => [...prev, qId]);
        }
    };

    // Actualizar Estado Local
    const handleLocalUpdate = (qId, updatedData) => {
        setLocalQuestions(prev => prev.map(q => q.id === qId ? { ...q, ...updatedData } : q));
    };

    // GUARDAR TODO (Bulk Save)
    const handleSaveAll = async () => {
        if (!title.trim()) {
            alert("El título de la encuesta es obligatorio.");
            return;
        }

        setMsg("Guardando cambios...");
        try {
            // 0. Guardar Header
            const headerPayload = {
                nombre: title,
                descripcion: description,
                activo: active,
                requiere_ubicacion: requiereUbicacion,
                incluir_fecha: incluirFecha
            };
            await updateSurvey(surveyId, headerPayload);

            // 1. Ejecutar eliminaciones pendientes
            if (deletedIds.length > 0) {
                await Promise.all(deletedIds.map(id => deleteQuestion(id)));
            }

            // 2. Procesar Creaciones y Actualizaciones
            const promises = localQuestions.map(async (q, index) => {
                const correctOrder = index + 1;

                if (q.isDraft) {
                    // CREATE
                    const payload = {
                        encuesta: surveyId,
                        titulo: q.titulo || "Pregunta Sin Título",
                        tipo: q.tipo,
                        orden: correctOrder,
                        opciones: q.opciones,
                        activa: true,
                        obligatoria: q.obligatoria || false
                    };
                    return createQuestion(payload);
                } else {
                    // UPDATE
                    const payload = {
                        titulo: q.titulo,
                        opciones: q.opciones,
                        orden: correctOrder,
                        obligatoria: q.obligatoria || false
                    };
                    return updateQuestion(q.id, payload);
                }
            });

            await Promise.all(promises);

            setMsg("✅ Cambios Guardados");
            setTimeout(() => setMsg(""), 2000);

            // Recargar para limpiar estados sucios
            loadSurvey();

        } catch (error) {
            console.error(error);
            alert("Error al guardar: " + error.message);
            setMsg("❌ Error");
        }
    };

    const renderQuestion = (q) => {
        const commonProps = {
            key: q.id,
            question: q,
            onChange: (newVal) => handleLocalUpdate(q.id, newVal),
            onDelete: () => handleDeleteQuestion(q.id),
        };

        switch (q.tipo) {
            case 'texto': return <QuestionBuilderText {...commonProps} />;
            case 'numero': return <QuestionBuilderNumber {...commonProps} />;
            case 'opciones': return <QuestionBuilderOptions {...commonProps} />;
            case 'foto': return <QuestionBuilderPhoto {...commonProps} />;
            case 'telefono': return <QuestionBuilderPhone {...commonProps} />;
            default: return null;
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-brand-blue" /></div>;
    if (!survey) return <div className="text-center mt-10 text-content-secondary">No se encontró la encuesta.</div>;

    return (
        <div className="max-w-3xl mx-auto pb-32 pt-6 relative min-h-screen">
            {/* Header Sticky */}
            {/* Adaptado: bg-surface-primary/95 para transparencia y color correcto */}
            <div className="flex items-center gap-4 mb-6 sticky top-0 bg-surface-primary/95 backdrop-blur-sm z-40 py-4 shadow-sm -mx-4 px-4 md:static md:mx-auto md:shadow-none md:p-0 md:bg-transparent rounded-b-xl border-b border-border-base md:border-none">
                {!isRelevamiento && (
                    <button onClick={() => navigate('/surveys')} className="p-2 hover:bg-surface-secondary rounded-full shadow-sm text-content-secondary hover:text-content-primary">
                        <ArrowLeft size={24} />
                    </button>
                )}
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-content-primary line-clamp-1">
                            {isRelevamiento ? "Editar Relevamiento" : title}
                        </h1>
                        <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>

                    {msg && <p className="text-sm font-semibold text-green-600 animate-pulse">{msg}</p>}
                </div>

                {/* Adaptado: bg-brand-blue */}
                <MyButton onClick={handleSaveAll} className="!w-auto bg-brand-blue hover:bg-brand-blue/90 text-white shadow-lg shadow-blue-900/20 flex items-center gap-2 px-3 md:px-6">
                    <Save size={20} />
                    <span className="hidden md:inline">Guardar Todo</span>
                </MyButton>
            </div>

            {/* Header Editor */}
            <SurveyTitleCard
                title={title}
                description={description}
                active={active}
                setTitle={setTitle}
                setDescription={setDescription}
                setActive={setActive}
            />

            {/* Configuración */}
            <SurveySettingsCard
                requiereUbicacion={requiereUbicacion}
                setRequiereUbicacion={setRequiereUbicacion}
                incluirFecha={incluirFecha}
                setIncluirFecha={setIncluirFecha}
            />

            <div className="space-y-6">
                {localQuestions.map((q, idx) => (
                    renderQuestion(q)
                ))}

                {localQuestions.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-border-base rounded-xl bg-surface-secondary">
                        <p className="text-content-secondary">No hay preguntas (agrega una abajo)</p>
                    </div>
                )}
            </div>

            {/* Barra Inferior Sticky */}
            {/* Adaptado: bg-surface-secondary, bordes, opacidades en hover */}
            <div className="sticky bottom-6 mx-auto w-fit bg-surface-secondary px-2 py-1 rounded-2xl shadow-2xl border border-border-base flex items-center gap-1 z-50 ring-1 ring-black/5 dark:ring-white/10 mt-10">

                <button onClick={addBasicData} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-blue-500/10 text-content-secondary hover:text-blue-500 group min-w-[60px]" title="Agregar Datos Básicos">
                    <UserPlus size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium">Datos</span>
                </button>

                <div className="w-px h-8 bg-border-base mx-1"></div>

                <button onClick={() => handleAddQuestion('texto')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-brand-blue/10 text-content-secondary hover:text-brand-blue min-w-[60px]" title="Texto">
                    <Type size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium">Texto</span>
                </button>

                <div className="w-px h-8 bg-border-base mx-1"></div>

                <button onClick={() => handleAddQuestion('numero')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-emerald-500/10 text-content-secondary hover:text-emerald-500 min-w-[60px]" title="Numérico">
                    <Hash size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium">Num</span>
                </button>

                <div className="w-px h-8 bg-border-base mx-1"></div>

                <button onClick={() => handleAddQuestion('opciones')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-purple-500/10 text-content-secondary hover:text-purple-500 min-w-[60px]" title="Opciones">
                    <List size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium">Opción</span>
                </button>

                <div className="w-px h-8 bg-border-base mx-1"></div>

                <button onClick={() => handleAddQuestion('foto')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-pink-500/10 text-content-secondary hover:text-pink-500 min-w-[60px]" title="Foto">
                    <Camera size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium">Foto</span>
                </button>

                <div className="w-px h-8 bg-border-base mx-1"></div>

                <button onClick={() => handleAddQuestion('telefono')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-green-500/10 text-content-secondary hover:text-green-500 min-w-[60px]" title="Teléfono">
                    <Phone size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium">Tel</span>
                </button>
            </div>
        </div>
    );
};

export default EditSurveyPage;