import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Save, Bold, List, ListOrdered, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import MyButton from '../components/ui/MyButton';
import PhotoGallery from '../components/report/PhotoGallery';
import TitleCard from '../components/ui/TitleCard';
import { useCreateReport } from '@/queries/useReports';
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

const CreateReportPage = () => {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState({ titulo: '', descripcion: '' });
    const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
    const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error'
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    
    const { mutateAsync: createReportMut, isPending: isSaving } = useCreateReport();

    // --- CONFIGURACIÓN DE TIPTAP ---
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Comienza a redactar el informe aquí...',
            }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl outline-none focus:outline-none max-w-none text-content-primary p-6 min-h-[400px]',
            },
        },
    });

    const handleSave = () => {
        if (!reportData.titulo.trim()) {
            alert("Por favor, ingresa un título para el informe.");
            return;
        }
        setIsConfirmOpen(true);
    };

    const confirmSave = async () => {
        setIsConfirmOpen(false);
        setSaveStatus(null);

        try {
            const payload = {
                titulo: reportData.titulo,
                descripcion_breve: reportData.descripcion,
                cuerpo: editor.getHTML(),
                fotos: selectedPhotoIds
            };

            await createReportMut(payload);
            setSaveStatus('success');

            // Redirigir o limpiar después de un momento
            setTimeout(() => {
                navigate('/reports'); 
            }, 2000);

        } catch (error) {
            console.error("Error al guardar el informe:", error);
            setSaveStatus('error');
        }
    };

    if (!editor) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4">

            <div className="flex justify-end">
                <MyButton
                    onClick={handleSave}
                    disabled={isSaving}
                    status={isSaving ? 'loading' : saveStatus}
                    defaultText="Guardar"
                    defaultIcon={<Save size={20} />}
                    className="!w-auto px-8 font-black shadow-lg shrink-0 uppercase tracking-tighter bg-brand-blue text-white shadow-blue-900/20"
                />
            </div>

            <TitleCard
                title={reportData.titulo}
                setTitle={(val) => setReportData({ ...reportData, titulo: val })}
                description={reportData.descripcion}
                setDescription={(val) => setReportData({ ...reportData, descripcion: val })}
                titlePlaceholder="Sin Título"
                descriptionPlaceholder="Descripción del informe..."
            />

            {/* --- BLOQUE 2: CUERPO (TipTap - Solo Negrita y Listas) --- */}
            <Card className="!p-0 overflow-hidden h-[600px] flex flex-col shadow-2xl bg-surface-primary border-none">
                {/* TOOLBAR LIMPIO */}
                <div className="p-3 border-b border-border-base/50 bg-surface-secondary/30 flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-2.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-brand-blue text-white shadow-md scale-105' : 'text-content-secondary hover:bg-surface-primary'}`}
                        title="Negrita"
                    >
                        <Bold size={20} />
                    </button>

                    <div className="w-px h-6 bg-border-base/50 mx-2" />

                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-2.5 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-brand-blue text-white shadow-md scale-105' : 'text-content-secondary hover:bg-surface-primary'}`}
                        title="Lista de puntos"
                    >
                        <List size={20} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`p-2.5 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-brand-blue text-white shadow-md scale-105' : 'text-content-secondary hover:bg-surface-primary'}`}
                        title="Lista numerada"
                    >
                        <ListOrdered size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-primary">
                    <EditorContent editor={editor} />
                </div>
            </Card>

            {/* --- BLOQUE 3: GALERÍA (Componente Aparte) --- */}
            <PhotoGallery
                selectedPhotoIds={selectedPhotoIds}
                onSelectionChange={setSelectedPhotoIds}
            />

            <style>{`
                .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; }
                .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; }
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: var(--text-content-secondary);
                    pointer-events-none;
                    height: 0;
                    opacity: 0.3;
                }
                .color-scheme-dark { color-scheme: dark; }
            `}</style>

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Guardar Informe</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro que deseas guardar y publicar este informe?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSave} className="bg-brand-blue hover:bg-blue-600 shadow-blue-500/20">Sí, guardar informe</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default CreateReportPage;