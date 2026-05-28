import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAvatarUrl } from '@/utils/chartConfig';
import { Download, FileImage, FileSpreadsheet, ChevronDown, Loader, Hash } from 'lucide-react';

import SurveysResponsesListCard from '@/components/survey/SurveysResponsesListCard';
import SurveyStatsDashboard from '@/components/survey/SurveyStatsDashboard';
import SurveyResponseDetailCard from '@/components/survey/SurveyResponseDetailCard';
import SurveyResponseEditCard from '@/components/survey/SurveyResponseEditCard';
import MultiSelectFilterBar from '@/components/ui/MultiSelectFilterBar';
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

// Importa los hooks
import { 
    useSurveyDetail, useSurveyRespondents, useSections, 
    useSurveyResponses, useSurveyResponseDetail, 
    useUpdateResponse, useDeleteResponse 
} from '@/queries/useSurveys';

import { useSurveyStats } from '@/queries/useStats';
import { useExportSurvey } from '@/queries/useExport';

const SurveyResponsesPage = ({ isRelevamiento = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Filtros y paginación
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({});
    const [searchIdText, setSearchIdText] = useState('');
    const [debouncedSearchId, setDebouncedSearchId] = useState('');
    const [selectedResponseId, setSelectedResponseId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Estados de UI
    const [exportStatus, setExportStatus] = useState(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [responseToDeleteId, setResponseToDeleteId] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchId(searchIdText);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchIdText]);

    // ==========================================
    // 1. LECTURA (Reemplaza los useEffects)
    // ==========================================
    const { data: encuesta, isLoading: isLoadingSurvey } = useSurveyDetail(isRelevamiento ? null : id, isRelevamiento);
    const resolvedSurveyId = encuesta?.id;

    const { data: availableUsers = [] } = useSurveyRespondents(resolvedSurveyId);
    
    const { data: seccionesData } = useSections(encuesta?.requiere_ubicacion);
    const availableSections = Array.isArray(seccionesData) ? seccionesData : (seccionesData?.results || []);

    const queryParams = { page, ...filters };
    if (debouncedSearchId) queryParams.id = debouncedSearchId;

    const { data: respuestasData, isLoading: isLoadingResponses } = useSurveyResponses(resolvedSurveyId, queryParams);
    const respuestas = respuestasData?.results || respuestasData || [];
    const meta = {
        next: respuestasData?.next,
        previous: respuestasData?.previous,
        count: respuestasData?.count || 0
    };

    const { data: selectedResponseRaw, isLoading: isLoadingDetail } = useSurveyResponseDetail(selectedResponseId);
    
    const { data: stats = [], isLoading: isLoadingStats } = useSurveyStats(resolvedSurveyId, filters);

    // ==========================================
    // NORMALIZACIÓN DEL DETALLE
    // ==========================================
    const selectedResponse = useMemo(() => {
        if (!selectedResponseRaw) return null;
        
        const data = { ...selectedResponseRaw };
        const sourceDetails = data.detalles_completos || data.detalles || [];

        if (encuesta?.preguntas) {
            data.detalles = encuesta.preguntas.map(pregunta => {
                const detalle = sourceDetails.find(d => d.pregunta_id === pregunta.id || d.pregunta === pregunta.id);
                return detalle ? 
                    { ...detalle, pregunta_id: pregunta.id, pregunta_titulo: pregunta.titulo, pregunta_tipo: pregunta.tipo } : 
                    { detalle_id: null, pregunta_id: pregunta.id, pregunta_titulo: pregunta.titulo, pregunta_tipo: pregunta.tipo, valor_texto: "", valor_numero: null, valor_foto: null, fotos_extra: [] };
            });
            delete data.detalles_completos;
        } else if (sourceDetails.length) {
            data.detalles = sourceDetails.map(detalle => ({
                ...detalle,
                pregunta_id: detalle.pregunta_id !== undefined ? detalle.pregunta_id : detalle.pregunta
            }));
        }
        return data;
    }, [selectedResponseRaw, encuesta]);

    const handleViewResponse = (responseId) => {
        setSelectedResponseId(responseId);
        setIsEditing(false);
    };

    // ==========================================
    // 2. ESCRITURA
    // ==========================================
    const { mutateAsync: updateResponseMut } = useUpdateResponse();
    const { mutateAsync: deleteResponseMut } = useDeleteResponse();

    const handleSaveEdit = async (payload) => {
        try {
            let responseId = payload.id;
            if (payload instanceof FormData) {
                const dataRaw = payload.get('data');
                if (dataRaw) responseId = JSON.parse(dataRaw).id;
            }

            if (!responseId) throw new Error("ID no encontrado");

            await updateResponseMut({ id: responseId, payload });
            setSaveStatus('success');
            setTimeout(() => {
                setIsEditing(false);
                setSaveStatus(null);
            }, 1000);
        } catch (error) {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 2000);
        }
    };

    const confirmDeleteResponse = (responseId) => {
        setResponseToDeleteId(responseId);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteResponse = async () => {
        if (!responseToDeleteId) return;
        try {
            await deleteResponseMut(responseToDeleteId);
            setIsDeleteModalOpen(false);
            setResponseToDeleteId(null);
            setSelectedResponseId(null); // Vuelve a la lista
        } catch (error) {
            alert("Error al eliminar la respuesta.");
        }
    };

    const handleApplyFilters = (newFilters) => {
        setFilters(newFilters);
        setPage(1);
    };

    const { mutateAsync: exportSurveyZipMut, isPending: downloading } = useExportSurvey();
    const { mutateAsync: exportSurveyExcelMut, isPending: downloadingExcel } = useExportSurvey();

    const handleDownload = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!resolvedSurveyId) return;

        setIsExportMenuOpen(false);
        setExportStatus(null);
        try {
            const response = await exportSurveyZipMut({ id: resolvedSurveyId, params: { ...filters, con_fotos: true } });
            const contentType = response.headers ? response.headers['content-type'] : null;
            const blob = new Blob([response.data], { type: contentType || 'application/zip' });
            const url = window.URL.createObjectURL(blob);

            const anchor = document.createElement('a');
            anchor.style.display = 'none';
            anchor.href = url;
            anchor.setAttribute('download', `Exportacion_${resolvedSurveyId}.zip`);
            document.body.appendChild(anchor);
            anchor.click();

            setTimeout(() => {
                document.body.removeChild(anchor);
                window.URL.revokeObjectURL(url);
            }, 100);

            setExportStatus('success');
            setTimeout(() => setExportStatus(null), 2000);
        } catch (error) {
            console.error("Error al exportar los datos zip:", error);
            alert("Ocurrió un error al intentar generar el archivo exportado.");
            setExportStatus('error');
            setTimeout(() => setExportStatus(null), 2000);
        }
    };

    const handleDownloadExcel = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!resolvedSurveyId) return;

        setIsExportMenuOpen(false);
        setExportStatus(null);
        try {
            const response = await exportSurveyExcelMut({ id: resolvedSurveyId, params: { ...filters, con_fotos: false } });
            const contentType = response.headers ? response.headers['content-type'] : null;
            const blob = new Blob([response.data], { type: contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);

            const anchor = document.createElement('a');
            anchor.style.display = 'none';
            anchor.href = url;
            anchor.setAttribute('download', `Exportacion_${resolvedSurveyId}.xlsx`);
            document.body.appendChild(anchor);
            anchor.click();

            setTimeout(() => {
                document.body.removeChild(anchor);
                window.URL.revokeObjectURL(url);
            }, 100);

            setExportStatus('success');
            setTimeout(() => setExportStatus(null), 2000);
        } catch (error) {
            console.error("Error al exportar los datos excel:", error);
            alert("Ocurrió un error al intentar generar el archivo Excel exportado.");
            setExportStatus('error');
            setTimeout(() => setExportStatus(null), 2000);
        }
    };

    const formattedResponses = respuestas.map(rta => ({
        id: rta.id,
        usuario: {
            nombre: rta.usuario_nombre || "Anónimo",
            avatar: getAvatarUrl(rta.usuario_foto),
        },
        fecha_display: rta.fecha_format,
        seccion: rta.seccion,
        barrio: rta.barrio,
    }));

    return (
        <div className="max-w-7xl mx-auto md:p-6 space-y-4 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-black text-content-primary tracking-tight">
                        {encuesta?.nombre || <span className="animate-pulse opacity-50">Cargando datos...</span>}
                    </h1>
                </div>
                <div className="flex flex-row md:items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <div className="relative flex-1 min-w-[100px] max-w-[140px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Hash size={16} className="text-content-secondary" />
                        </div>
                        <input
                            type="number"
                            placeholder="Buscar ID"
                            className="w-full bg-surface-primary border border-border-base rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-content-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:_textfield]"
                            value={searchIdText}
                            onChange={(e) => setSearchIdText(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <MultiSelectFilterBar
                            onApply={handleApplyFilters}
                            showLocation={encuesta?.requiere_ubicacion}
                            sections={availableSections}
                            users={availableUsers}
                        />
                    </div>
                    <div className="relative flex-1 min-w-0">
                        <button
                            type="button"
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            disabled={downloading || downloadingExcel || !resolvedSurveyId}
                            className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 disabled:opacity-50 transition-all w-full h-full"
                        >
                            <div className="flex items-center gap-2">
                                {downloading || downloadingExcel ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                                {downloading ? "Exportando ZIP..." : downloadingExcel ? "Exportando Excel..." : "Exportar"}
                            </div>
                            <ChevronDown size={18} className={`transition-transform ${isExportMenuOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isExportMenuOpen && (
                            <div className="absolute top-14 right-0 w-64 bg-surface-primary border border-border-base rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="w-full text-left px-4 py-3 text-sm font-bold text-content-primary hover:bg-surface-secondary transition-colors border-b border-border-base flex items-center gap-3"
                                >
                                    <FileImage size={16} className="text-content-secondary" />
                                    Exportar con Fotos (.zip)
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownloadExcel}
                                    className="w-full text-left px-4 py-3 text-sm font-bold text-content-primary hover:bg-surface-secondary transition-colors flex items-center gap-3"
                                >
                                    <FileSpreadsheet size={16} className="text-content-secondary" />
                                    Solo Excel (.xlsx)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <section className="pt-4">
                {selectedResponseId ? (
                    isEditing ? (
                        <SurveyResponseEditCard
                            respuesta={selectedResponse}
                            isSaving={isLoadingDetail}
                            saveStatus={saveStatus}
                            onCancel={() => setIsEditing(false)}
                            onSave={handleSaveEdit}
                        />
                    ) : (
                        <SurveyResponseDetailCard
                            respuesta={selectedResponse}
                            isLoading={isLoadingDetail}
                            onBack={() => {
                                setSelectedResponseId(null);
                            }}
                            onEdit={() => setIsEditing(true)}
                            onDelete={confirmDeleteResponse}
                        />
                    )
                ) : (
                    <SurveysResponsesListCard
                        responses={formattedResponses}
                        isLoading={isLoadingResponses || isLoadingSurvey}
                        currentPage={page}
                        totalPages={Math.max(1, Math.ceil(meta.count / 10))}
                        onNext={() => setPage(p => p + 1)}
                        onPrev={() => setPage(p => p - 1)}
                        onView={handleViewResponse}
                        hasNext={!!meta.next}
                        hasPrev={!!meta.previous}
                    />
                )}
            </section>

            <section className="space-y-3">
                <SurveyStatsDashboard
                    statsData={stats}
                    isLoading={isLoadingStats}
                />
            </section>

            <AlertDialog open={isDeleteModalOpen} onOpenChange={(open) => !open && setIsDeleteModalOpen(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar Respuesta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará la respuesta de forma permanente y no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteResponse}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
};

export default SurveyResponsesPage;