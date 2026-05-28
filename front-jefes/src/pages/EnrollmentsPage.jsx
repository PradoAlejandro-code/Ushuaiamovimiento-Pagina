import React, { useState } from 'react';
import { Plus, ListFilter, Users, Trash2, PanelLeftClose } from 'lucide-react';
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
import { useEnrollmentLists, useDeleteEnrollmentList } from '@/queries/useEnrollments';
import CreateEnrollmentModal from '../components/enrollments/CreateEnrollmentModal';
import EnrollmentsViewer from '../components/enrollments/EnrollmentsViewer';

const EnrollmentsPage = () => {
    const { data: enrollmentsRaw, isLoading: loading } = useEnrollmentLists();
    const enrollments = enrollmentsRaw?.results || enrollmentsRaw || [];
    
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [padronToDelete, setPadronToDelete] = useState(null);

    const { mutateAsync: deleteEnrollmentMut } = useDeleteEnrollmentList();

    const handleEnrollmentCreated = (newEnrollment) => {
        setSelectedEnrollment(newEnrollment);
        setIsSidebarOpen(false);
    };

    const handleSelectEnrollment = (enrollment) => {
        setSelectedEnrollment(enrollment);
        setIsSidebarOpen(false);
    };

    const handleDeleteConfirm = async () => {
        if (!padronToDelete) return;
        try {
            await deleteEnrollmentMut(padronToDelete);
            if (selectedEnrollment?.id === padronToDelete) {
                setSelectedEnrollment(null);
            }
        } catch (error) {
            console.error("Error eliminando enrollment:", error);
            alert("No se pudo eliminar el padrón.");
        } finally {
            setPadronToDelete(null);
        }
    };

    return (
        <div className="w-full max-w-full overflow-hidden h-[calc(100vh-3rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 px-0">

            <div className="flex flex-1 min-h-0 min-w-0 relative gap-4 overflow-hidden px-4 py-2">
                
                {/* Sidebar Toggle Handle (Vertical Bar) */}
                {!isSidebarOpen && (
                    <div 
                        onClick={() => setIsSidebarOpen(true)}
                        className="absolute left-0 top-0 bottom-0 w-4 z-20 group cursor-pointer flex items-center justify-center"
                        title="Ver lista de padrones"
                    >
                        <div className="w-1.5 h-32 bg-brand-blue/20 group-hover:bg-brand-blue rounded-full transition-all group-hover:h-48 group-hover:w-2" />
                        <div className="absolute left-6 bg-surface-primary border border-border-base px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap text-xs font-bold text-content-primary">
                            Abrir lista de padrones
                        </div>
                    </div>
                )}

                {/* Sidebar: Lista de Enrollments */}
                <div className={`transition-all duration-500 ease-in-out flex flex-col gap-4 shrink-0 h-full overflow-hidden ${
                    isSidebarOpen ? 'w-full lg:w-80 opacity-100 p-2' : 'w-0 opacity-0 pointer-events-none'
                }`}>
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-xl transition-all shadow-lg shadow-orange-500/20 font-bold"
                        >
                            <Plus size={18} /> Nuevo Padrón
                        </button>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="ml-2 p-3 text-content-tertiary hover:text-content-primary transition-colors hidden lg:block"
                            title="Contraer panel"
                        >
                            <PanelLeftClose size={20} />
                        </button>
                    </div>

                    <div className="bg-surface-primary border border-border-base rounded-2xl flex-1 overflow-hidden flex flex-col shadow-sm">
                        <div className="p-4 border-b border-border-base bg-surface-secondary/50 flex items-center gap-2">
                            <ListFilter size={18} className="text-content-secondary" />
                            <h3 className="font-semibold text-content-primary">Tus Padrones</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                            {loading ? (
                                <div className="flex justify-center p-8">
                                    <div className="w-6 h-6 border-2 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
                                </div>
                            ) : enrollments.length === 0 ? (
                                <div className="text-center p-6 text-content-secondary text-sm">
                                    No hay padrones creados aún.
                                </div>
                            ) : (
                                enrollments.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => handleSelectEnrollment(p)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => { if(e.key === 'Enter') handleSelectEnrollment(p); }}
                                        className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left group cursor-pointer ${
                                            selectedEnrollment?.id === p.id 
                                                ? 'bg-brand-blue/10 border-brand-blue/30 border text-brand-blue' 
                                                : 'bg-surface-secondary hover:bg-surface-secondary/80 border border-transparent text-content-secondary hover:text-content-primary'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 truncate pr-2">
                                            <div className={`p-2 rounded-lg shrink-0 ${selectedEnrollment?.id === p.id ? 'bg-brand-blue text-white shadow-md shadow-blue-500/20' : 'bg-surface-primary text-content-tertiary group-hover:text-content-secondary'}`}>
                                                <Users size={16} />
                                            </div>
                                            <span className="font-medium truncate">{p.name}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPadronToDelete(p.id);
                                            }}
                                            className="p-1.5 text-content-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar Padrón"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className={`flex-1 min-w-0 h-full transition-all duration-500 bg-surface-primary rounded-2xl relative overflow-hidden ${selectedEnrollment ? 'border border-border-base shadow-sm' : ''} ${!isSidebarOpen ? 'lg:ml-4' : ''}`}>
                    {selectedEnrollment ? (
                        <EnrollmentsViewer key={selectedEnrollment.id} enrollment={selectedEnrollment} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-surface-secondary/20">
                            <div className="w-24 h-24 bg-brand-blue/5 text-brand-blue rounded-full flex items-center justify-center mb-6 border border-brand-blue/10">
                                <Users size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-content-primary mb-2">Selecciona un Padrón</h3>
                            <p className="text-content-secondary max-w-sm">
                                Elige una lista de la izquierda para ver y gestionar sus integrantes, o crea una nueva para empezar.
                            </p>
                            { !isSidebarOpen && (
                                <button 
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="mt-6 px-6 py-2 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 rounded-xl font-bold transition-all"
                                >
                                    Ver todos los padrones
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <CreateEnrollmentModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onCreated={handleEnrollmentCreated} 
            />

            <AlertDialog open={!!padronToDelete} onOpenChange={(open) => !open && setPadronToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Padrón</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar este padrón? Esta acción no se puede deshacer.
                            <br /><br />
                            <strong>Nota:</strong> Las personas registradas en la base central <strong>NO</strong> serán eliminadas; solo se borrará su vinculación con este padrón específico y cualquier dato adicional guardado exclusivamente aquí.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>Sí, eliminar padrón</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default EnrollmentsPage;
