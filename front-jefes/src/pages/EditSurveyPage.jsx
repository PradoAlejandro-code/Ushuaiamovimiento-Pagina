import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSurveyDetail } from '@/queries/useSurveys';
import { createQuestion, deleteQuestion, updateQuestion, updateSurvey, createGrupo, updateGrupo, deleteGrupo } from '@/api/surveys';
import MyButton from "../components/ui/MyButton";
import TitleCard from "@/components/ui/TitleCard";
import SurveySettingsCard from "../components/survey/SurveySettingsCard";
import SurveyGroupManager from "../components/survey/SurveyGroupManager";
import QuestionBuilder from "../components/survey/QuestionBuilder";
import QuestionBuilderPhoto from "../components/survey/QuestionBuilderPhoto";
import SurveyQuestionToolbar from "../components/survey/SurveyQuestionToolbar";
import Card from '../components/ui/Card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader, Save, MessageSquare } from 'lucide-react';
import Masonry from 'react-masonry-css';
import { Skeleton } from "@/components/ui/skeleton";

const EditSurveyPage = ({ isRelevamiento = false }) => {
    const params = useParams();
    const navigate = useNavigate();
    const [surveyId, setSurveyId] = useState(params.id);
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [active, setActive] = useState(true);
    const [requiereUbicacion, setRequiereUbicacion] = useState(false);
    const [incluirFecha, setIncluirFecha] = useState(false);
    const [activarEncuestadorManual, setActivarEncuestadorManual] = useState(false);

    const [localQuestions, setLocalQuestions] = useState([]);
    const [deletedIds, setDeletedIds] = useState([]);
    const [localGrupos, setLocalGrupos] = useState([]);
    const [deletedGruposIds, setDeletedGruposIds] = useState([]);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState(null);

    const queryClient = useQueryClient();
    const { data: surveyData, isLoading: queryLoading } = useSurveyDetail(isRelevamiento ? null : params.id, isRelevamiento);

    const isInitialLoading = queryLoading || loading;

    useEffect(() => {
        if (surveyData) {
            setSurveyId(surveyData.id);
            setSurvey(surveyData);
            setTitle(surveyData.nombre);
            setDescription(surveyData.descripcion || "");
            setActive(surveyData.activo !== undefined ? surveyData.activo : true);
            setRequiereUbicacion(surveyData.requiere_ubicacion || false);
            setIncluirFecha(surveyData.incluir_fecha || false);
            setActivarEncuestadorManual(surveyData.activar_encuestador_manual || false);
            setLocalGrupos(surveyData.grupos || []);
            setLocalQuestions(surveyData.preguntas || []);
            // Simulación de carga premium mínima para consistencia visual
            setTimeout(() => setLoading(false), 800);
        }
    }, [surveyData]);

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
    };

    const handleDeleteQuestion = (qId) => {
        setQuestionToDelete(qId);
        setDeleteModalOpen(true);
    };

    const confirmDeleteQuestion = () => {
        if (!questionToDelete) return;
        const qId = questionToDelete;
        const isDraft = String(qId).startsWith('temp-');
        setLocalQuestions(prev => prev.filter(p => p.id !== qId));
        if (!isDraft) setDeletedIds(prev => [...prev, qId]);
        setDeleteModalOpen(false);
        setQuestionToDelete(null);
    };

    const handleLocalUpdate = (qId, updatedData) => {
        setLocalQuestions(prev => prev.map(q => q.id === qId ? { ...q, ...updatedData } : q));
    };

    const handleSaveAll = () => {
        if (!title.trim()) { alert("El título es obligatorio."); return; }
        setConfirmSaveOpen(true);
    };

    const confirmSaveAll = async () => {
        setConfirmSaveOpen(false);
        setSaving(true);
        setSaveStatus(null);
        setMsg("Guardando cambios...");

        try {
            const headerPayload = { nombre: title, descripcion: description, activo: active, requiere_ubicacion: requiereUbicacion, incluir_fecha: incluirFecha, activar_encuestador_manual: activarEncuestadorManual };
            await updateSurvey(surveyId, headerPayload);
            
            if (deletedGruposIds.length > 0) await Promise.all(deletedGruposIds.map(id => deleteGrupo(id)));
            
            const grupoMap = {};
            for (const g of localGrupos) {
                const isDraft = String(g.id).startsWith('temp-');
                const payload = { encuesta: surveyId, nombre: g.nombre, orden: g.orden || 0 };
                if (isDraft) {
                    const response = await createGrupo(payload);
                    grupoMap[g.id] = response.id;
                } else {
                    await updateGrupo(g.id, payload);
                    grupoMap[g.id] = g.id;
                }
            }

            if (deletedIds.length > 0) await Promise.all(deletedIds.map(id => deleteQuestion(id)));

            for (const [index, q] of localQuestions.entries()) {
                const payload = {
                    encuesta: surveyId,
                    titulo: q.titulo || "Sin Título",
                    tipo: q.tipo,
                    orden: index + 1,
                    grupo_id: q.grupo_id ? (grupoMap[q.grupo_id] || q.grupo_id) : null,
                    opciones: q.opciones,
                    activa: true,
                    obligatoria: q.obligatoria || false,
                    permite_multiple: q.permite_multiple || false
                };
                if (q.isDraft) await createQuestion(payload);
                else await updateQuestion(q.id, payload);
            }

            queryClient.invalidateQueries({ queryKey: ['survey', surveyId] });
            if (isRelevamiento) queryClient.invalidateQueries({ queryKey: ['relevamiento'] });

            setSaveStatus('success');
            setMsg("✅ Cambios Guardados");
            setTimeout(() => setMsg(""), 2000);
        } catch (error) {
            console.error(error);
            setSaveStatus('error');
            setMsg("❌ Error");
        } finally {
            setSaving(false);
        }
    };

    const renderQuestion = (q) => {
        const commonProps = {
            question: q,
            grupos: localGrupos,
            onChange: (newVal) => handleLocalUpdate(q.id, newVal),
            onDelete: () => handleDeleteQuestion(q.id),
            naked: true
        };

        return (
            <div key={q.id} className="col-span-1">
                <Card className={`w-full flex flex-col p-5 border-t-4 transition-all hover:translate-y-[-2px] hover:shadow-lg ${CONFIG[q.tipo]?.css?.border || 'border-border-base'}`}>
                    {q.tipo === 'foto' ? <QuestionBuilderPhoto {...commonProps} /> : <QuestionBuilder {...commonProps} />}
                </Card>
            </div>
        );
    };

    const CONFIG = {
        texto: { css: { border: 'border-indigo-500' } },
        celular: { css: { border: 'border-green-600' } },
        fecha: { css: { border: 'border-brand-blue' } },
        dni: { css: { border: 'border-cyan-600' } },
        mail: { css: { border: 'border-yellow-500' } },
        nombre: { css: { border: 'border-blue-500' } },
        numero: { css: { border: 'border-emerald-500' } },
        opciones: { css: { border: 'border-purple-500' } },
        foto: { css: { border: 'border-brand-orange' } }
    };

    if (!isInitialLoading && !survey) return <div className="text-center mt-10 text-content-secondary">No se encontró la encuesta.</div>;

    const breakpointColumnsObj = {
        default: 3,
        1100: 2,
        700: 1
    };

    return (
        <div className="w-full px-4 md:px-8 pb-48">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    {!isRelevamiento && (
                        <button onClick={() => navigate('/surveys')} className="p-2 hover:bg-surface-secondary rounded-full text-content-secondary transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <div>
                        {isInitialLoading ? (
                            <Skeleton className="h-8 w-64 rounded-lg" />
                        ) : (
                            <h1 className="text-2xl font-black text-content-primary tracking-tight">
                                {isRelevamiento ? "Editar Relevamiento" : title}
                            </h1>
                        )}
                        {msg && <p className="text-xs font-bold text-green-500 animate-pulse uppercase tracking-widest">{msg}</p>}
                    </div>
                </div>
                {isInitialLoading ? (
                    <Skeleton className="h-11 w-[215px] rounded-xl" />
                ) : (
                    <MyButton
                        onClick={handleSaveAll}
                        disabled={saving}
                        status={saving ? 'loading' : saveStatus}
                        defaultText="Guardar Cambios"
                        defaultIcon={<Save size={20} />}
                        className="bg-brand-blue text-white px-6 shadow-lg shadow-blue-500/20 rounded-xl"
                    />
                )}
            </div>
 
            {/* 1. SECCIÓN ESTRUCTURADA: Título y Grupos (Fila fija) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 h-auto lg:h-[470px]">
                    {isInitialLoading ? (
                        <Skeleton className="h-full w-full rounded-2xl" />
                    ) : (
                        <Card className="p-6 h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                            <TitleCard
                                title={title}
                                description={description}
                                active={active}
                                setTitle={setTitle}
                                setDescription={setDescription}
                                setActive={setActive}
                                naked
                            />
                            <SurveySettingsCard
                                requiereUbicacion={requiereUbicacion}
                                setRequiereUbicacion={setRequiereUbicacion}
                                incluirFecha={incluirFecha}
                                setIncluirFecha={setIncluirFecha}
                                activarEncuestadorManual={activarEncuestadorManual}
                                setActivarEncuestadorManual={setActivarEncuestadorManual}
                                naked
                            />
                        </Card>
                    )}
                </div>
                <div className="col-span-1 h-auto lg:h-[470px]">
                    {isInitialLoading ? (
                        <Skeleton className="h-full w-full rounded-2xl" />
                    ) : (
                        <Card className="h-full flex flex-col p-0 overflow-hidden">
                            <SurveyGroupManager 
                                grupos={localGrupos} 
                                setGrupos={setLocalGrupos}
                                naked
                                className="px-3 pb-4 pt-1 h-full flex flex-col overflow-y-auto custom-scrollbar"
                            />
                        </Card>
                    )}
                </div>
            </div>

            {/* 2. SECCIÓN MASONRY: Preguntas (Crecen según contenido) */}
            {isInitialLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative overflow-hidden h-[400px]">
                    <Skeleton className="h-[300px] w-full rounded-2xl" />
                    <Skeleton className="h-[250px] w-full rounded-2xl" />
                    <Skeleton className="h-[350px] w-full rounded-2xl" />
                    
                    {/* Overlay de difuminado */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
                </div>
            ) : localQuestions.length > 0 ? (
                <Masonry
                    breakpointCols={breakpointColumnsObj}
                    className="flex w-auto -ml-6"
                    columnClassName="pl-6 bg-clip-padding flex flex-col gap-6"
                >
                    {localQuestions.map((q) => renderQuestion(q))}
                </Masonry>
            ) : (
                <div className="w-full border-2 border-dashed border-border-base rounded-2xl flex flex-col items-center justify-center h-[200px] opacity-40 bg-surface-secondary/30">
                    <MessageSquare size={48} className="mb-2" />
                    <p className="text-sm font-bold uppercase tracking-widest">Sin preguntas activas</p>
                </div>
            )}

            <SurveyQuestionToolbar onAdd={handleAddQuestion} />

            {/* Modales */}
            <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar Pregunta?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteQuestion}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Guardar Cambios</AlertDialogTitle>
                        <AlertDialogDescription>¿Deseas guardar los cambios realizados?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSaveAll}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default EditSurveyPage;
