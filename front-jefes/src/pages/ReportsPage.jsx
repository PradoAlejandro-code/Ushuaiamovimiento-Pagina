import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Loader2, AlertCircle, RefreshCcw } from 'lucide-react';
import ReportCard from '../components/report/ReportCard';
import ReportDetailModal from '../components/report/ReportDetailModal';
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
import { useReports, useDeleteReport } from '@/queries/useReports';

const ReportsPage = () => {
    const navigate = useNavigate();
    const { data: reportsData, isLoading: loading, error, refetch: fetchReports } = useReports();
    const reports = reportsData?.results || reportsData || [];

    const [selectedReport, setSelectedReport] = useState(null);
    const [reportToDelete, setReportToDelete] = useState(null);

    const { mutateAsync: deleteReportMut, isPending: isDeleting } = useDeleteReport();

    const handleViewMore = (id) => {
        const report = reports.find(r => r.id === id);
        if (report) {
            setSelectedReport(report);
        }
    };

    const handleDeleteClick = (report) => {
        setReportToDelete(report);
    };

    const handleConfirmDelete = async () => {
        if (!reportToDelete) return;
        try {
            await deleteReportMut(reportToDelete.id);
            setReportToDelete(null);
        } catch (err) {
            console.error("Error deleting report:", err);
            // Optionally, we could set an error state here or show a toast
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            {/* Cabecera de la Página */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand-blue/10 rounded-xl">
                            <FileText size={24} className="text-brand-blue" />
                        </div>
                        <h1 className="text-3xl font-black text-content-primary uppercase tracking-tighter">
                            Informes Generales
                        </h1>
                    </div>
                </div>
            </div>

            {/* Grid de Informes */}
            <div className="relative min-h-[400px]">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="animate-spin text-brand-blue" size={48} />
                        <p className="text-xs font-black text-content-secondary uppercase tracking-widest animate-pulse">
                            Cargando Informes...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center space-y-6 pt-20">
                        <div className="p-6 bg-red-500/10 rounded-full">
                            <AlertCircle size={64} className="text-red-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-black text-content-primary uppercase">¡Ups! Algo salió mal</h2>
                            <p className="text-content-secondary font-medium">{error}</p>
                        </div>
                        <button
                            onClick={fetchReports}
                            className="flex items-center gap-2 bg-surface-secondary text-content-primary px-6 py-3 rounded-xl font-bold hover:bg-surface-primary border border-border-base/50 transition-all"
                        >
                            <RefreshCcw size={18} />
                            <span>Reintentar</span>
                        </button>
                    </div>
                ) : reports.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {reports.map((report) => (
                            <ReportCard
                                key={report.id}
                                report={report}
                                onViewMore={handleViewMore}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-6 pt-20 py-32 bg-surface-secondary/20 rounded-3xl border-2 border-dashed border-border-base/50">
                        <div className="p-6 bg-surface-secondary rounded-full opacity-20">
                            <FileText size={64} className="text-content-secondary" />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-black text-content-primary uppercase opacity-40">No hay informes aún</h2>
                            <p className="text-content-secondary font-medium opacity-60">
                                Los informes que crees aparecerán aquí.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Detalle */}
            <ReportDetailModal
                report={selectedReport}
                onClose={() => setSelectedReport(null)}
            />

            {/* Modal de Confirmación de Borrado */}
            <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Borrar Informe</AlertDialogTitle>
                        <AlertDialogDescription>
                            {`¿Estás seguro que deseas borrar el informe "${reportToDelete?.titulo}"? Esta acción no se puede deshacer.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ReportsPage;
