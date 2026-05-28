import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAvatarUrl } from '@/utils/chartConfig';
import { Download, FileImage, FileSpreadsheet, ChevronDown, Loader, Hash, Filter, CheckCircle2, X, Trash2 } from 'lucide-react';

import SurveysResponsesListCard from '@/components/survey/SurveysResponsesListCard';
import SurveyStatsDashboard from '@/components/survey/SurveyStatsDashboard';
import SurveyResponseDetailCard from '@/components/survey/SurveyResponseDetailCard';
import SurveyResponseEditCard from '@/components/survey/SurveyResponseEditCard';
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

// Local CustomMultiSelect for clean embedded design inside the column card
const CustomMultiSelect = ({ label, options = [], selectedOptions = [], onChange, onClear, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="space-y-2 relative">
            <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-black text-content-secondary uppercase tracking-widest ml-1">{label}</label>
                {selectedOptions.length > 0 && (
                    <button type="button" onClick={onClear} className="text-[9px] text-brand-blue font-bold uppercase hover:underline">Limpiar</button>
                )}
            </div>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-surface-secondary border border-border-base rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer text-left transition-colors text-content-primary"
            >
                <div className="truncate pr-4 flex-1">
                    {selectedOptions.length > 0
                        ? `${selectedOptions.length} sel. (${selectedOptions.slice(0, 1).join(', ')}${selectedOptions.length > 1 ? '...' : ''})`
                        : placeholder}
                </div>
                <ChevronDown size={16} className={`text-content-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[40]" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute z-[50] top-[100%] left-0 right-0 mt-2 bg-surface-primary border border-border-base rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-60 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                        {options.length === 0 ? (
                            <span className="text-xs text-content-secondary p-4 block text-center">No hay opciones</span>
                        ) : (
                            options.map(opt => (
                                <label key={opt} className="flex items-center gap-3 p-2.5 hover:bg-surface-secondary rounded-lg cursor-pointer transition-colors w-full group">
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedOptions.includes(opt)}
                                        onChange={() => onChange(opt)}
                                    />
                                    <div className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedOptions.includes(opt) ? 'bg-brand-blue border-brand-blue text-white' : 'border-content-secondary/30 bg-surface-primary group-hover:border-brand-blue/50'}`}>
                                        {selectedOptions.includes(opt) && <CheckCircle2 size={12} />}
                                    </div>
                                    <span className={`text-sm font-bold truncate transition-colors ${selectedOptions.includes(opt) ? 'text-brand-blue' : 'text-content-primary'}`}>{opt}</span>
                                </label>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const SurveyResponsesPage = ({ isRelevamiento = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Filtros y paginación
    const [page, setPage] = useState(1);
    const [searchIdText, setSearchIdText] = useState('');
    const [debouncedSearchId, setDebouncedSearchId] = useState('');
    const [selectedResponseId, setSelectedResponseId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form inputs state (reactive filters)
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedSections, setSelectedSections] = useState([]);
    const [selectedBarrios, setSelectedBarrios] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Export & Save statuses
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

    // useMemo for actual filters passed to React Query
    const filters = useMemo(() => {
        const clean = {};
        if (selectedSections.length > 0) clean.seccion = selectedSections;
        if (selectedBarrios.length > 0) clean.barrio = selectedBarrios;
        if (selectedUser) clean.usuario = selectedUser;
        if (startDate) clean.fecha_desde = startDate;
        if (endDate) clean.fecha_hasta = endDate;
        return clean;
    }, [selectedUser, selectedSections, selectedBarrios, startDate, endDate]);

    // ==========================================
    // 1. LECTURA (Peticiones con React Query)
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

    // ==========================================
    // 3. EXPORTACIONES
    // ==========================================
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

    // ==========================================
    // 4. LÓGICA DE FILTRADO REACTIVO LOCAL
    // ==========================================
    const sectionNames = useMemo(() => availableSections?.map(s => s.nombre) || [], [availableSections]);

    const currentBarrios = useMemo(() => {
        if (!encuesta?.requiere_ubicacion || !availableSections) return [];
        if (selectedSections.length === 0) {
            const allBarrios = availableSections.flatMap(s => s.barrios ? s.barrios.map(b => b.nombre) : []);
            return [...new Set(allBarrios)].sort();
        }
        const selectedSecObjs = availableSections.filter(s => selectedSections.includes(s.nombre));
        const filteredBarrios = selectedSecObjs.flatMap(s => s.barrios ? s.barrios.map(b => b.nombre) : []);
        return [...new Set(filteredBarrios)].sort();
    }, [availableSections, selectedSections, encuesta?.requiere_ubicacion]);

    const handleSectionChange = (val) => {
        setSelectedSections(prev => {
            const newArray = prev.includes(val) ? prev.filter(item => item !== val) : [...prev, val];
            if (newArray.length === 0) {
                setSelectedBarrios([]);
            }
            return newArray;
        });
        setPage(1);
    };

    const handleBarrioChange = (val) => {
        setSelectedBarrios(prev => 
            prev.includes(val) ? prev.filter(item => item !== val) : [...prev, val]
        );
        setPage(1);
    };

    const handleResetAll = () => {
        setSelectedUser('');
        setSelectedSections([]);
        setSelectedBarrios([]);
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    const formattedResponses = useMemo(() => {
        return respuestas.map(rta => ({
            id: rta.id,
            usuario: {
                nombre: rta.usuario_nombre || "Anónimo",
                avatar: getAvatarUrl(rta.usuario_foto),
            },
            fecha_display: rta.fecha_format,
            seccion: rta.seccion,
            barrio: rta.barrio,
        }));
    }, [respuestas]);

    return (
        <div className="w-full pb-12 space-y-4 animate-in fade-in duration-300">
            {/* Header con título y controles */}
            <div className="grid grid-cols-5 gap-4 w-full items-center">
                <div className="col-span-4 flex items-center">
                    <h1 className="text-2xl font-black text-content-primary tracking-tight">
                        {encuesta?.nombre || <span className="animate-pulse opacity-50">Cargando datos...</span>}
                    </h1>
                </div>
                <div className="col-span-1 flex items-center justify-center gap-2 w-full relative">
                    <div className="relative flex-1 min-w-[100px] sm:min-w-[130px] max-w-[170px]">
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
                    
                    <div className="relative flex-1 min-w-[105px] sm:min-w-[130px] max-w-[170px]">
                        <button
                            type="button"
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            disabled={downloading || downloadingExcel || !resolvedSurveyId}
                            className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 disabled:opacity-50 transition-all w-full h-full cursor-pointer"
                        >
                            <div className="flex items-center gap-1.5">
                                {downloading || downloadingExcel ? (
                                    <Loader size={16} className="animate-spin shrink-0" />
                                ) : (
                                    <Download size={16} className="shrink-0" />
                                )}
                                <span className="truncate">
                                    {downloading ? "Zip..." : downloadingExcel ? "Excel..." : "Exportar"}
                                </span>
                            </div>
                            <ChevronDown size={16} className={`shrink-0 transition-transform ${isExportMenuOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isExportMenuOpen && (
                            <div className="absolute top-12 right-0 w-56 bg-surface-primary border border-border-base rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-content-primary hover:bg-surface-secondary transition-colors border-b border-border-base flex items-center gap-2"
                                >
                                    <FileImage size={14} className="text-content-secondary" />
                                    <span className="truncate">Exportar con Fotos (.zip)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownloadExcel}
                                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-content-primary hover:bg-surface-secondary transition-colors flex items-center gap-2"
                                >
                                    <FileSpreadsheet size={14} className="text-content-secondary" />
                                    <span className="truncate">Solo Excel (.xlsx)</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-4 w-full pt-4">
                {/* Card de respuestas (col-span-4 row-span-2) */}
                <div className="col-span-4 row-span-2">
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
                </div>

                {/* Filtros avanzados directamente en fila 1, columna 5 (col-span-1 row-span-2) */}
                <div className="col-span-1 row-span-2">
                    <div className="shadow-xl border border-border-base bg-surface-primary rounded-2xl overflow-visible flex flex-col h-full min-h-[760px] justify-between">
                        {/* Header */}
                        <div className="p-4 md:p-6 border-b border-border-base/50 flex items-center justify-between bg-surface-secondary/20 flex-shrink-0 rounded-t-2xl relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-blue/10 rounded-lg text-brand-blue">
                                    <Filter size={18} />
                                </div>
                                <h3 className="font-black uppercase tracking-widest text-[11px] md:text-xs text-content-primary">Configurar Filtros</h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="p-2 hover:bg-surface-secondary rounded-full text-content-secondary transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 md:p-6 space-y-5 overflow-visible relative flex-1">
                            {/* Cargado por */}
                            <div className="space-y-2 relative z-10">
                                <label className="text-[10px] font-black text-content-secondary uppercase tracking-widest ml-1">Cargado por</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-surface-secondary border border-border-base rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none cursor-pointer text-content-primary"
                                        value={selectedUser}
                                        onChange={(e) => { setSelectedUser(e.target.value); setPage(1); }}
                                    >
                                        <option value="">Todos los usuarios</option>
                                        {availableUsers.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.first_name ? `${u.first_name} ${u.last_name}` : u.username}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-content-secondary">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Secciones (Múltiple) - Solo si requiere ubicación */}
                            {encuesta?.requiere_ubicacion && (
                                <>
                                    <CustomMultiSelect
                                        label="Secciones (Múltiple)"
                                        placeholder="Seleccionar secciones"
                                        options={sectionNames}
                                        selectedOptions={selectedSections}
                                        onChange={handleSectionChange}
                                        onClear={() => { setSelectedSections([]); setSelectedBarrios([]); setPage(1); }}
                                    />

                                    {/* Barrios (Múltiple) */}
                                    <CustomMultiSelect
                                        label="Barrios (Múltiple)"
                                        placeholder="Seleccionar barrios"
                                        options={currentBarrios}
                                        selectedOptions={selectedBarrios}
                                        onChange={handleBarrioChange}
                                        onClear={() => { setSelectedBarrios([]); setPage(1); }}
                                    />
                                </>
                            )}

                            {/* Rango de Fecha */}
                            <div className="space-y-2 relative z-10">
                                <label className="text-[10px] font-black text-content-secondary uppercase tracking-widest ml-1">Rango de Fecha</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <input
                                        type="date"
                                        className="w-full bg-surface-secondary border border-border-base rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 color-scheme-dark shadow-none text-content-primary"
                                        value={startDate}
                                        onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                    />
                                    <input
                                        type="date"
                                        className="w-full bg-surface-secondary border border-border-base rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 color-scheme-dark shadow-none text-content-primary"
                                        value={endDate}
                                        onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 md:p-6 bg-surface-secondary/30 border-t border-border-base/50 flex items-center justify-center flex-shrink-0 rounded-b-2xl relative z-10 w-full">
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="flex items-center justify-center gap-2 text-xs font-black uppercase text-red-500 hover:bg-red-500/10 px-6 py-3 rounded-xl transition-all cursor-pointer w-full border border-red-500/20 hover:border-red-500/40"
                            >
                                <Trash2 size={16} />
                                <span>Limpiar Filtros</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Analítica (col-span-5 row-span-2) */}
                <div className="col-span-5 row-span-2 h-[760px]">
                    <SurveyStatsDashboard
                        statsData={stats}
                        isLoading={isLoadingStats}
                        className="h-full"
                    />
                </div>
            </div>

            {/* Diálogo de alerta para eliminar */}
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