import React, { useState, useEffect } from 'react';
import { procesarDatosParaGraficos, procesarParticipacionPorUsuario } from '../utils/analyticsHelpers';
import ChartCard from '../components/Analytics/ChartCard';
import { getAllSurveys, getSurvey, getSurveyResponses } from '../api';
import { ArrowLeft, Loader, FileText, Calendar, Download, ChevronDown, ChevronUp, Eye, ChevronLeft, ChevronRight, X, MapPin, User } from 'lucide-react';
import Card from '../components/ui/Card';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function RespuestasDashboard() {
    const [vista, setVista] = useState('lista');
    const [encuestas, setEncuestas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para el detalle
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);
    const [respuestas, setRespuestas] = useState([]);
    const [preguntas, setPreguntas] = useState([]);
    const [datosGraficos, setDatosGraficos] = useState([]);

    // Estado para expansión de filas y modal
    const [expandedRow, setExpandedRow] = useState(null);
    const [selectedResponse, setSelectedResponse] = useState(null);

    // --- CONFIGURACIÓN DE PAGINACIÓN ---
    const [paginaActual, setPaginaActual] = useState(1);
    const respuestasPorPagina = 10; // Mostramos 10 por página en la tabla

    useEffect(() => {
        fetchSurveys();
    }, []);

    const getSecureUrl = (url) => {
        if (!url) return "";
        // Si el backend manda http por error pero estamos en https, forzamos https
        if (url.startsWith('http://api.ushuaiamovimiento.com.ar')) {
            return url.replace('http://', 'https://');
        }
        if (!url.startsWith('http')) {
            return `${API_URL}${url}`;
        }
        return url;
    };

    const fetchSurveys = async () => {
        try {
            const data = await getAllSurveys();
            setEncuestas(data);
        } catch (error) {
            console.error("Error fetching surveys", error);
        } finally {
            setLoading(false);
        }
    };

    const verDetalleEncuesta = async (idEncuesta) => {
        setLoadingDetalle(true);
        setEncuestaSeleccionada(idEncuesta);
        setExpandedRow(null);
        setPaginaActual(1); // Importante: Resetear a página 1 al cambiar de encuesta

        try {
            const [encuestaData, respuestasData] = await Promise.all([
                getSurvey(idEncuesta),
                getSurveyResponses(idEncuesta)
            ]);

            const preguntasData = encuestaData.preguntas;
            const responsesList = respuestasData.map(r => ({
                id: r.id,
                fecha_envio: r.fecha_format,
                usuario_nombre: r.usuario_nombre,
                detalles: r.detalles,
                seccion: r.seccion,
                barrio: r.barrio,
                contacto: r.contacto
            }));

            setPreguntas(preguntasData);
            setRespuestas(responsesList);

            // Procesar gráficos
            const datosProcesados = procesarDatosParaGraficos(preguntasData, responsesList);
            if (respuestasData.length > 0) {
                const datosParticipacion = procesarParticipacionPorUsuario(respuestasData);
                if (datosParticipacion) datosProcesados.unshift(datosParticipacion);
            }

            setDatosGraficos(datosProcesados);
            setVista('detalle');

        } catch (error) {
            console.error("Error fetching details", error);
            alert("No se pudieron cargar los datos de la encuesta.");
            setEncuestaSeleccionada(null);
        } finally {
            setLoadingDetalle(false);
        }
    };

    const handleExportZip = async () => {
        if (downloading || !encuestaSeleccionada) return;
        setDownloading(true);
        try {
            const token = localStorage.getItem('access_token');
            const url = `${API_URL}/api/surveys/${encuestaSeleccionada}/exportar-completo/`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error("Error al exportar");
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `Reporte_Completo_${encuestaSeleccionada}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error("Error descarga ZIP:", error);
            alert("No se pudo generar el reporte.");
        } finally {
            setDownloading(false);
        }
    };

    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    // --- CÁLCULO DE PAGINACIÓN ---
    const indexOfLast = paginaActual * respuestasPorPagina;
    const indexOfFirst = indexOfLast - respuestasPorPagina;
    const respuestasPaginadas = respuestas.slice(indexOfFirst, indexOfLast);
    const totalPaginas = Math.ceil(respuestas.length / respuestasPorPagina);

    if (loading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-brand-blue" /></div>;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen">
            {vista === 'lista' ? (
                /* VISTA DE SELECCIÓN DE ENCUESTA */
                <div>
                    <h1 className="text-2xl font-bold mb-6 text-content-primary">Panel de Resultados</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Relevamientos */}
                        {encuestas.filter(e => e.es_relevamiento).map(encuesta => (
                            <Card
                                key={encuesta.id}
                                onClick={() => verDetalleEncuesta(encuesta.id)}
                                className="!bg-brand-blue !border-brand-blue cursor-pointer group !text-white"
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold">📍 {encuesta.nombre}</h3>
                                    <FileText size={20} className="opacity-70 group-hover:opacity-100" />
                                </div>
                                <p className="mt-2 opacity-90 text-sm">{encuesta.descripcion || "Relevamiento Principal"}</p>
                                <div className="mt-4 text-xs bg-white/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
                                    {encuesta.fecha_creacion ? new Date(encuesta.fecha_creacion).toLocaleDateString() : 'Sin Fecha'}
                                </div>
                            </Card>
                        ))}
                        {/* Encuestas Normales */}
                        {encuestas.filter(e => !e.es_relevamiento).sort((a, b) => b.id - a.id).map(encuesta => (
                            <Card
                                key={encuesta.id}
                                onClick={() => verDetalleEncuesta(encuesta.id)}
                                className="cursor-pointer group hover:border-brand-blue/50"
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-content-primary group-hover:text-brand-blue">{encuesta.nombre}</h3>
                                    <FileText size={20} className="text-content-secondary group-hover:text-brand-blue/70" />
                                </div>
                                <p className="text-sm text-content-secondary mt-2 line-clamp-2 min-h-[2.5rem]">
                                    {encuesta.descripcion || "Sin descripción"}
                                </p>
                                <div className="flex items-center gap-2 mt-4 text-xs text-content-secondary/70">
                                    <Calendar size={12} />
                                    {encuesta.fecha_creacion ? new Date(encuesta.fecha_creacion).toLocaleDateString() : 'Sin Fecha'}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : (
                /* VISTA DETALLE */
                <div>
                    {loadingDetalle ? (
                        <div className="flex justify-center p-20"><Loader className="animate-spin text-brand-blue" /></div>
                    ) : (
                        <>
                            {/* Header y Acciones */}
                            <div className="flex justify-between items-center mb-6">
                                <button onClick={() => setVista('lista')} className="flex items-center gap-2 text-brand-blue hover:text-blue-700 font-medium">
                                    <ArrowLeft size={20} />
                                    Volver a Encuestas
                                </button>
                                <button
                                    onClick={handleExportZip}
                                    disabled={downloading}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm transition-opacity
                                        ${downloading
                                            ? 'bg-surface-secondary text-content-secondary cursor-not-allowed border border-border-base'
                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                                >
                                    {downloading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                                    Descargar ZIP
                                </button>
                            </div>

                            <h1 className="text-3xl font-bold mb-2 text-content-primary">Resultados: {encuestas.find(e => e.id === encuestaSeleccionada)?.nombre}</h1>
                            <p className="text-content-secondary mb-8">Análisis detallado de {respuestas.length} respuestas</p>

                            {/* 1. SECCIÓN RESPUESTAS (TABLA PAGINADA) */}
                            <div className="mb-12">
                                <div className="flex justify-between items-end mb-4">
                                    <h2 className="text-xl font-semibold text-content-primary flex items-center gap-2">
                                        📋 Desglose de Respuestas
                                        <span className="text-sm font-normal text-content-secondary bg-surface-primary border border-border-base px-2 py-1 rounded-full">{respuestas.length} total</span>
                                    </h2>
                                    <span className="text-xs text-content-secondary">
                                        Página {paginaActual} de {totalPaginas}
                                    </span>
                                </div>

                                {respuestas.length === 0 ? (
                                    <div className="text-content-secondary italic">No hay respuestas aún.</div>
                                ) : (
                                    <Card className="!p-0 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-surface-secondary border-b border-border-base text-xs uppercase text-content-secondary font-semibold">
                                                    <tr>
                                                        <th className="p-4 pl-6">ID / Usuario</th>
                                                        <th className="p-4">Fecha</th>
                                                        <th className="p-4">Resumen</th>
                                                        <th className="p-4 text-right pr-6">Acción</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-base">
                                                    {respuestasPaginadas.map((rta) => {
                                                        const isExpanded = expandedRow === rta.id;
                                                        const validDetails = rta.detalles.filter(d => d.valor_texto || d.valor_numero !== null || d.valor_foto);

                                                        return (
                                                            <React.Fragment key={rta.id}>
                                                                <tr className={`hover:bg-brand-blue/5 transition-colors ${isExpanded ? 'bg-brand-blue/5' : ''}`}>
                                                                    <td className="p-4 pl-6">
                                                                        <div className="font-bold text-brand-blue">#{rta.id}</div>
                                                                        {rta.contacto ? (
                                                                            <div className="text-sm font-semibold text-emerald-600 truncate max-w-[150px]" title="Contacto Vinculado">
                                                                                {rta.contacto.nombre}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-xs text-content-secondary italic">Sin Contacto</div>
                                                                        )}
                                                                        <div className="text-[10px] text-content-secondary mt-1">Encuestador: {rta.usuario_nombre || "Anónimo"}</div>
                                                                    </td>
                                                                    <td className="p-4 text-sm text-content-primary">
                                                                        {rta.fecha_envio}
                                                                    </td>
                                                                    <td className="p-4 text-sm text-content-secondary max-w-md">
                                                                        <div className="line-clamp-1">
                                                                            {validDetails.length > 0
                                                                                ? validDetails.slice(0, 2).map(d => d.valor_texto || d.valor_numero || "[Foto]").join(' • ')
                                                                                : <span className="italic text-gray-400">Sin datos</span>}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 text-right pr-6">
                                                                        <button
                                                                            onClick={() => setSelectedResponse(rta)}
                                                                            className="inline-flex items-center gap-1 text-sm font-medium text-brand-blue hover:text-blue-700 bg-brand-blue/10 hover:bg-brand-blue/20 px-3 py-1.5 rounded-lg transition-colors"
                                                                        >
                                                                            <Eye size={16} />
                                                                            Ver más
                                                                        </button>
                                                                    </td>
                                                                </tr>

                                                                {isExpanded && (
                                                                    <tr className="bg-surface-secondary/30">
                                                                        <td colSpan="4" className="p-4 pl-6">
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                                                                                {validDetails.map((d, idx) => {
                                                                                    const pregTitulo = preguntas.find(p => p.id === d.pregunta)?.titulo || `Pregunta ${d.pregunta}`;
                                                                                    let valorDisplay = d.valor_texto || d.valor_numero;

                                                                                    return (
                                                                                        <div key={idx} className="bg-surface-primary p-3 rounded border border-border-base">
                                                                                            <div className="text-xs font-bold text-brand-blue uppercase mb-1">{pregTitulo}</div>
                                                                                            {d.valor_foto ? (
                                                                                                <div className="mt-2">
                                                                                                    <img
                                                                                                        src={getSecureUrl(d.valor_foto)}
                                                                                                        alt="Respuesta"
                                                                                                        className="h-32 w-auto object-cover rounded-md border border-border-base"
                                                                                                    />
                                                                                                    <a href={getSecureUrl(d.valor_foto)} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block">Ver original</a>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="text-content-primary break-words">{valorDisplay}</div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                                {validDetails.length === 0 && <div className="text-content-secondary italic p-2">Esta respuesta no contiene datos visibles.</div>}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* --- CONTROLES DE PAGINACIÓN --- */}
                                        {respuestas.length > respuestasPorPagina && (
                                            <div className="flex justify-between items-center p-4 border-t border-border-base bg-surface-primary">
                                                <button
                                                    disabled={paginaActual === 1}
                                                    onClick={() => setPaginaActual(p => p - 1)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-surface-secondary border border-border-base text-content-primary hover:bg-border-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <ChevronLeft size={16} /> Anterior
                                                </button>

                                                <div className="flex items-center gap-1">
                                                    {/* Indicador simple de páginas */}
                                                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                                                        // Lógica simple para mostrar 1, 2, 3... o alrededor de la actual
                                                        let pageNum = i + 1;
                                                        if (totalPaginas > 5 && paginaActual > 3) {
                                                            pageNum = paginaActual - 2 + i;
                                                        }
                                                        if (pageNum > totalPaginas) return null;

                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => setPaginaActual(pageNum)}
                                                                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors
                                                                    ${paginaActual === pageNum
                                                                        ? 'bg-brand-blue text-white'
                                                                        : 'text-content-secondary hover:bg-surface-secondary'}`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <button
                                                    disabled={indexOfLast >= respuestas.length}
                                                    onClick={() => setPaginaActual(p => p + 1)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-surface-secondary border border-border-base text-content-primary hover:bg-border-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Siguiente <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </Card>
                                )}
                            </div>

                            <hr className="my-10 border-border-base" />

                            {/* 2. SECCIÓN GRÁFICOS */}
                            <div>
                                <h2 className="text-2xl font-bold mb-6 text-content-primary">📊 Estadísticas Visuales</h2>
                                {datosGraficos.length === 0 ? (
                                    <div className="text-content-secondary mb-8 bg-surface-primary p-6 rounded-xl border border-border-base text-center">
                                        No hay datos suficientes para generar gráficos visuales.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                                        {datosGraficos.map((grafico) => (
                                            <ChartCard key={grafico.id} dataPregunta={grafico} forcedHeight={300} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
            {/* MODAL DE DETALLE DE RESPUESTA */}
            {selectedResponse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface-primary w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Header del Modal */}
                        <div className="p-6 border-b border-border-base flex justify-between items-center bg-surface-secondary/50">
                            <div>
                                <h3 className="text-xl font-bold text-content-primary flex items-center gap-2">
                                    <FileText className="text-brand-blue" />
                                    Detalle de Respuesta #{selectedResponse.id}
                                </h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-content-secondary">
                                    <span className="flex items-center gap-1"><User size={14} /> {selectedResponse.usuario_nombre || "Anónimo"}</span>
                                    <span className="flex items-center gap-1"><Calendar size={14} /> {selectedResponse.fecha_envio}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedResponse(null)}
                                className="p-2 hover:bg-surface-secondary rounded-full text-content-secondary transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Contenido del Modal */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Información de Ubicación si aplica */}
                            {(selectedResponse.seccion || selectedResponse.barrio) && (
                                <div className="bg-brand-blue/5 border border-brand-blue/10 p-4 rounded-xl flex flex-wrap gap-6">
                                    {selectedResponse.seccion && (
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-brand-blue/60 mb-0.5">Sección</div>
                                            <div className="text-sm font-semibold text-content-primary flex items-center gap-1.5">
                                                <MapPin size={14} className="text-brand-blue" /> {selectedResponse.seccion}
                                            </div>
                                        </div>
                                    )}
                                    {selectedResponse.barrio && (
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-brand-blue/60 mb-0.5">Barrio</div>
                                            <div className="text-sm font-semibold text-content-primary flex items-center gap-1.5">
                                                <MapPin size={14} className="text-brand-blue" /> {selectedResponse.barrio}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Desglose de Preguntas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedResponse.detalles.map((d, idx) => {
                                    const preg = preguntas.find(p => p.id === d.pregunta);
                                    const pregTitulo = preg?.titulo || `Pregunta ${d.pregunta}`;
                                    const hasPhotos = (d.fotos_extra && d.fotos_extra.length > 0) || d.valor_foto;

                                    return (
                                        <div key={idx} className={`p-4 rounded-xl border border-border-base bg-surface-primary shadow-sm hover:shadow-md transition-shadow ${hasPhotos ? 'md:col-span-2' : ''}`}>
                                            <div className="text-xs font-bold text-brand-blue uppercase mb-2 tracking-wider">{pregTitulo}</div>

                                            {hasPhotos ? (
                                                <div className="space-y-4">
                                                    <div className={`grid gap-4 ${d.fotos_extra?.length > 1 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                                        {d.fotos_extra && d.fotos_extra.length > 0 ? (
                                                            d.fotos_extra.map((foto, fIdx) => (
                                                                <div key={fIdx} className="space-y-2">
                                                                    <img
                                                                        src={getSecureUrl(foto.imagen)}
                                                                        alt={`Foto ${fIdx + 1}`}
                                                                        className="w-full h-64 object-cover rounded-lg border border-border-base shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                                                                        onClick={() => window.open(getSecureUrl(foto.imagen), '_blank')}
                                                                    />
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <img
                                                                    src={getSecureUrl(d.valor_foto)}
                                                                    alt="Respuesta"
                                                                    className="w-full h-64 object-cover rounded-lg border border-border-base shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                                                                    onClick={() => window.open(getSecureUrl(d.valor_foto), '_blank')}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-content-secondary italic text-right">
                                                        Toca una imagen para verla en tamaño completo
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-content-primary font-medium text-base whitespace-pre-wrap">
                                                    {d.valor_texto || d.valor_numero || <span className="text-content-secondary italic text-sm">Sin respuesta</span>}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer del Modal */}
                        <div className="p-4 border-t border-border-base bg-surface-secondary/30 flex justify-end">
                            <button
                                onClick={() => setSelectedResponse(null)}
                                className="px-6 py-2 bg-brand-blue text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-brand-blue/20"
                            >
                                Cerrar Detalle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}