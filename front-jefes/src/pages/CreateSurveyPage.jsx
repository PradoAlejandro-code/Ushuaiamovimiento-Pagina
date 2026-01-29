import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MyButton from "../components/ui/MyButton";
import SurveyTitleCard from "../components/survey/SurveyTitleCard";
import SurveySettingsCard from "../components/survey/SurveySettingsCard";
import QuestionBuilderText from "../components/survey/QuestionBuilderText";
import QuestionBuilderNumber from "../components/survey/QuestionBuilderNumber";
import QuestionBuilderOptions from "../components/survey/QuestionBuilderOptions";
import QuestionBuilderPhoto from "../components/survey/QuestionBuilderPhoto";
import QuestionBuilderPhone from "../components/survey/QuestionBuilderPhone";
import { Type, Hash, List, UserPlus, Camera, Save, Phone } from 'lucide-react';
import { createSurvey } from '../api';

const CreateSurveyPage = () => {
    const navigate = useNavigate();

    // Estado de la Encuesta
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [active, setActive] = useState(true);

    // Configuración
    const [esRelevamiento, setEsRelevamiento] = useState(false);
    const [requiereUbicacion, setRequiereUbicacion] = useState(false);

    // Estado de las Preguntas
    const [questions, setQuestions] = useState([]);

    // Agregar nueva pregunta
    const addQuestion = (type, defaultTitle = "") => {
        const newQuestion = {
            id: Date.now() + Math.random(),
            tipo: type,
            titulo: defaultTitle,
            orden: questions.length + 1,
            obligatoria: false,
            opciones: type === 'opciones' ? ["Si", "No"] : null
        };
        setQuestions(prev => [...prev, newQuestion]);

        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
    };

    // Macro: Agregar Datos Básicos
    const addBasicData = () => {
        const basicFields = [
            { title: "Nombre y Apellido", type: "texto" },
            { title: "Calle y Número", type: "texto" },
            { title: "Teléfono", type: "telefono" }
        ];
        const newQuestions = basicFields.map((field, idx) => ({
            id: Date.now() + idx,
            tipo: field.type,
            titulo: field.title,
            orden: questions.length + 1 + idx,
            obligatoria: true,
            opciones: null
        }));
        setQuestions(prev => [...prev, ...newQuestions]);

        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
    };

    // Actualizar pregunta
    const updateQuestion = (id, updatedData) => {
        setQuestions(questions.map(q => q.id === id ? updatedData : q));
    };

    // Eliminar pregunta
    const deleteQuestion = (id) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert("Por favor ingresa un título para la encuesta.");
            return;
        }

        const payload = {
            nombre: title,
            descripcion: description,
            activo: active,
            es_relevamiento: esRelevamiento,
            requiere_ubicacion: requiereUbicacion,
            preguntas: questions.map((q, index) => ({
                titulo: q.titulo || "Sin título",
                tipo: q.tipo,
                orden: index + 1,
                obligatoria: q.obligatoria,
                opciones: q.opciones
            }))
        };

        try {
            await createSurvey(payload);
            alert("✅ Encuesta Creada Exitosamente");
            navigate('/');
        } catch (error) {
            console.error(error);
            alert("❌ Error al crear la encuesta.");
        }
    };

    // Renderizar Pregunta según Tipo
    const renderQuestion = (q) => {
        switch (q.tipo) {
            case 'texto':
                return <QuestionBuilderText key={q.id} question={q} onChange={(val) => updateQuestion(q.id, val)} onDelete={() => deleteQuestion(q.id)} />;
            case 'numero':
                return <QuestionBuilderNumber key={q.id} question={q} onChange={(val) => updateQuestion(q.id, val)} onDelete={() => deleteQuestion(q.id)} />;
            case 'opciones':
                return <QuestionBuilderOptions key={q.id} question={q} onChange={(val) => updateQuestion(q.id, val)} onDelete={() => deleteQuestion(q.id)} />;
            case 'foto':
                return <QuestionBuilderPhoto key={q.id} question={q} onChange={(val) => updateQuestion(q.id, val)} onDelete={() => deleteQuestion(q.id)} />;
            case 'telefono':
                return <QuestionBuilderPhone key={q.id} question={q} onChange={(val) => updateQuestion(q.id, val)} onDelete={() => deleteQuestion(q.id)} />;
            default: return null;
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-32 pt-6 relative min-h-screen">
            {/* Header Sticky */}
            {/* Adaptado: bg-surface-primary con transparencia */}
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-surface-primary/95 backdrop-blur-sm z-40 py-4 shadow-sm -mx-4 px-4 md:static md:mx-auto md:shadow-none md:p-0 md:bg-transparent rounded-b-xl border-b border-border-base md:border-none">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-content-primary">Crear Nueva Encuesta</h1>
                    <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Adaptado: Usa bg-brand-blue */}
                    <MyButton onClick={handleSave} className="!w-auto bg-brand-blue text-white hover:bg-brand-blue/90 py-2 px-6 shadow-md shadow-blue-900/20 flex items-center gap-2">
                        <Save size={20} />
                        <span>Guardar</span>
                    </MyButton>
                </div>
            </div>

            {/* Header Editor */}
            <SurveyTitleCard
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                active={active}
                setActive={setActive}
            />

            {/* Configuración */}
            <SurveySettingsCard
                requiereUbicacion={requiereUbicacion}
                setRequiereUbicacion={setRequiereUbicacion}
            />

            <div className="mb-8 space-y-6">
                {questions.length === 0 ? (
                    // Adaptado: bg-surface-secondary, border-border-base, text-content-secondary
                    <div className="text-center py-12 border-2 border-dashed border-border-base rounded-xl bg-surface-secondary flex flex-col items-center justify-center text-content-secondary">
                        <Type size={48} className="mb-4 opacity-20 text-content-primary" />
                        <p className="font-medium">No hay preguntas aún.</p>
                        <p className="text-sm">Agrega una desde la barra inferior.</p>
                    </div>
                ) : (
                    questions.map(q => renderQuestion(q))
                )}
            </div>

            {/* Barra Inferior Sticky (Toolbar) */}
            {/* Adaptado: bg-surface-secondary, bordes y textos dinámicos */}
            <div className="sticky bottom-6 mx-auto w-fit bg-surface-secondary px-2 py-1 rounded-2xl shadow-2xl border border-border-base flex items-center gap-1 z-50 ring-1 ring-black/5 dark:ring-white/10 mt-10">

                <button onClick={addBasicData} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-blue-500/10 text-content-secondary hover:text-blue-500 transition-all group min-w-[70px]" title="Agregar Datos Básicos">
                    <UserPlus size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium opacity-100">Datos</span>
                </button>

                <div className="w-px h-8 bg-border-base mx-1"></div>

                <button onClick={() => addQuestion('texto')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-brand-blue/10 text-content-secondary hover:text-brand-blue transition-all group min-w-[70px]" title="Texto Libre">
                    <Type size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium opacity-100">Texto</span>
                </button>

                <div className="w-px h-8 bg-border-base mx-1"></div>

                <button onClick={() => addQuestion('numero')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-emerald-500/10 text-content-secondary hover:text-emerald-500 transition-all group min-w-[70px]" title="Numérico">
                    <Hash size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium opacity-100">Num</span>
                </button>

                <div className="w-px h-8 bg-border-base mx-1"></div>

                <button onClick={() => addQuestion('opciones')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-purple-500/10 text-content-secondary hover:text-purple-500 transition-all group min-w-[70px]" title="Opciones">
                    <List size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium opacity-100">Opción</span>
                </button>

                <div className="w-px h-8 bg-border-base mx-1"></div>

                <button onClick={() => addQuestion('foto')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-pink-500/10 text-content-secondary hover:text-pink-500 transition-all group min-w-[70px]" title="Foto">
                    <Camera size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium opacity-100">Foto</span>
                </button>

                <div className="w-px h-8 bg-border-base mx-1"></div>

                <button onClick={() => addQuestion('telefono')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-green-500/10 text-content-secondary hover:text-green-500 transition-all group min-w-[70px]" title="Teléfono">
                    <Phone size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium opacity-100">Tel</span>
                </button>
            </div>
        </div>
    );
};

export default CreateSurveyPage;