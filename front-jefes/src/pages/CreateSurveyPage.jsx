import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateSurvey } from '@/queries/useSurveys';
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
import { ArrowLeft, Save, MessageSquare } from 'lucide-react';
import Masonry from 'react-masonry-css';
import { Skeleton } from "@/components/ui/skeleton";

const CreateSurveyPage = () => {
    const navigate = useNavigate();

    // Estados de UI
    const [saveStatus, setSaveStatus] = useState(null);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(true);
    
    const { mutateAsync: createSurveyMut, isPending: saving } = useCreateSurvey();

    // Estado de la Encuesta
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [active, setActive] = useState(true);

    // Configuración
    const [esRelevamiento, setEsRelevamiento] = useState(false);
    const [requiereUbicacion, setRequiereUbicacion] = useState(false);
    const [incluirFecha, setIncluirFecha] = useState(false);
    const [activarEncuestadorManual, setActivarEncuestadorManual] = useState(false);

    // Estado para Modales
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState(null);

    // Estado de las Preguntas y Grupos
    const [questions, setQuestions] = useState([]);
    const [grupos, setGrupos] = useState([]);

    useEffect(() => {
        window.scrollTo(0, 0);
        // Simulación de carga premium para consistencia visual
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const addQuestion = (type) => {
        let defaultTitle = "";
        switch (type) {
            case 'nombre': defaultTitle = "Nombre Completo"; break;
            case 'dni': defaultTitle = "DNI"; break;
            case 'mail': defaultTitle = "Email"; break;
            case 'celular': defaultTitle = "Celular"; break;
            default: defaultTitle = "";
        }

        const newQuestion = {
            id: `temp-${Date.now()}`,
            tipo: type,
            titulo: defaultTitle,
            orden: questions.length + 1,
            obligatoria: false,
            activa: true,
            opciones: type === 'opciones' ? ["Si", "No"] : null
        };

        setQuestions(prev => [...prev, newQuestion]);
    };

    const updateQuestion = (id, updatedData) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updatedData } : q));
    };

    const deleteQuestion = (id) => {
        setQuestionToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDeleteQuestion = () => {
        if (questionToDelete) {
            setQuestions(prev => prev.filter(q => q.id !== questionToDelete));
            setDeleteModalOpen(false);
            setQuestionToDelete(null);
        }
    };

    const handleSave = () => {
        if (!title.trim()) { alert("El título es obligatorio."); return; }
        setConfirmSaveOpen(true);
    };

    const confirmSave = async () => {
        setConfirmSaveOpen(false);
        setSaveStatus(null);
        setMsg("Creando encuesta...");

        const payload = {
            nombre: title,
            descripcion: description,
            activo: active,
            es_relevamiento: esRelevamiento,
            requiere_ubicacion: requiereUbicacion,
            incluir_fecha: incluirFecha,
            activar_encuestador_manual: activarEncuestadorManual,
            grupos: grupos.map(g => ({
                id: g.id,
                nombre: g.nombre,
                orden: g.orden
            })),
            preguntas: questions.map((q, index) => ({
                titulo: q.titulo || "Sin título",
                tipo: q.tipo,
                orden: index + 1,
                grupo_id: q.grupo_id || null,
                obligatoria: q.obligatoria || false,
                permite_multiple: q.permite_multiple || false,
                opciones: q.opciones,
                activa: true
            }))
        };

        try {
            await createSurveyMut(payload);
            setSaveStatus('success');
            setMsg("✅ Encuesta Creada");
            setTimeout(() => navigate('/surveys'), 1500);
        } catch (error) {
            console.error(error);
            setSaveStatus('error');
            setMsg("❌ Error");
        }
    };

    const renderQuestion = (q) => {
        const commonProps = {
            question: q,
            grupos: grupos,
            onChange: (val) => updateQuestion(q.id, val),
            onDelete: () => deleteQuestion(q.id),
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
        nombre: { css: { border: 'border-brand-blue' } },
        numero: { css: { border: 'border-emerald-500' } },
        opciones: { css: { border: 'border-purple-500' } },
        foto: { css: { border: 'border-brand-orange' } }
    };

    const breakpointColumnsObj = {
        default: 3,
        1100: 2,
        700: 1
    };

    return (
        <div className="w-full pb-48">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/surveys')} className="p-2 hover:bg-surface-secondary rounded-full text-content-secondary transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        {loading ? (
                            <Skeleton className="h-8 w-64 rounded-lg" />
                        ) : (
                            <h1 className="text-2xl font-black text-content-primary tracking-tight">Nueva Encuesta</h1>
                        )}
                        {msg && <p className="text-xs font-bold text-green-500 animate-pulse uppercase tracking-widest">{msg}</p>}
                    </div>
                </div>
                {loading ? (
                    <Skeleton className="h-11 w-[195px] rounded-xl" />
                ) : (
                    <MyButton
                        onClick={handleSave}
                        disabled={saving}
                        status={saving ? 'loading' : saveStatus}
                        defaultText="Crear Encuesta"
                        defaultIcon={<Save size={20} />}
                        className="bg-brand-blue text-white px-6 shadow-lg shadow-blue-500/20 rounded-xl"
                    />
                )}
            </div>

            {/* 1. SECCIÓN ESTRUCTURADA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 h-auto lg:h-[470px]">
                    {loading ? (
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
                    {loading ? (
                        <Skeleton className="h-full w-full rounded-2xl" />
                    ) : (
                        <Card className="h-full flex flex-col p-0 overflow-hidden">
                            <SurveyGroupManager 
                                grupos={grupos} 
                                setGrupos={setGrupos}
                                naked
                                className="px-3 pb-4 pt-1 h-full flex flex-col overflow-y-auto custom-scrollbar"
                            />
                        </Card>
                    )}
                </div>
            </div>

            {/* 2. SECCIÓN MASONRY */}
            <div className="min-h-[200px]">
                {loading ? (
                    <Skeleton className="w-full h-[200px] rounded-2xl opacity-20" />
                ) : questions.length > 0 ? (
                    <Masonry
                        breakpointCols={breakpointColumnsObj}
                        className="flex w-auto -ml-6"
                        columnClassName="pl-6 bg-clip-padding flex flex-col gap-6"
                    >
                        {questions.map((q) => renderQuestion(q))}
                    </Masonry>
                ) : (
                    <div className="w-full border-2 border-dashed border-border-base rounded-2xl flex flex-col items-center justify-center h-[200px] opacity-40 bg-surface-secondary/30">
                        <MessageSquare size={48} className="mb-2" />
                        <p className="text-sm font-bold uppercase tracking-widest">Sin preguntas activas</p>
                    </div>
                )}
            </div>

            <SurveyQuestionToolbar onAdd={addQuestion} />

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
                        <AlertDialogTitle>Crear Encuesta</AlertDialogTitle>
                        <AlertDialogDescription>¿Estás seguro de que deseas guardar esta nueva encuesta?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSave}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default CreateSurveyPage;