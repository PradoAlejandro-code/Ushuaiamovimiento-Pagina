import React, { useState, useEffect } from 'react';
import { procesarDatosParaGraficos, procesarParticipacionPorUsuario } from '../utils/analyticsHelpers';
import ChartCard from '../components/Analytics/ChartCard';
import { getAllSurveys, getSurvey, getSurveyResponses, updateResponse } from '../api';
import {
    ArrowLeft, Loader, FileText, Calendar, Download, ChevronLeft, ChevronRight,
    X, MapPin, User, Edit2, Save, Eye
} from 'lucide-react';
import Card from '../components/ui/Card';
import ImageCarousel from '../components/ui/ImageCarousel';

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

    // Estado para Edición
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ seccion: '', barrio: '', respuestas: {} });
    const [photosToDelete, setPhotosToDelete] = useState([]);
    const [saving, setSaving] = useState(false);

    // --- CONFIGURACIÓN DE PAGINACIÓN ---
    const [paginaActual, setPaginaActual] = useState(1);
    const respuestasPorPagina = 10;

    // Helper para texto compacto
    const CompactText = ({ text }) => {
        const [expanded, setExpanded] = useState(false);
        if (!text || String(text).length < 60) return <span>{text}</span>;
        return (
            <div>
                {expanded ? text : String(text).slice(0, 60) + "..."}
                <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }} className="text-xs text-brand-blue ml-1 hover:underline font-medium">
                    {expanded ? "ver menos" : "ver más"}
                </button>
            </div>
        )
    };

    useEffect(() => {
        fetchSurveys();
    }, []);

    const getSecureUrl = (url) => {
        if (!url) return "";
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
        setPaginaActual(1);
        setIsEditing(false);

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

    // --- LÓGICA DE PAGINACIÓN ---
    const indexOfLast = paginaActual * respuestasPorPagina;
    const indexOfFirst = indexOfLast - respuestasPorPagina;
    const respuestasPaginadas = respuestas.slice(indexOfFirst, indexOfLast);
    const totalPaginas = Math.ceil(respuestas.length / respuestasPorPagina);

    // --- LÓGICA DE EDICIÓN ---
    const handleEditClick = () => {
        setIsEditing(true);
        // Inicializar el formulario con los datos actuales
        const initialRespuestas = {};
        selectedResponse.detalles.forEach(d => {
            initialRespuestas[d.pregunta] = d.valor_texto || d.valor_numero || "";
        });

        setEditForm({
            seccion: selectedResponse.seccion || "",
            barrio: selectedResponse.barrio || "",
            respuestas: initialRespuestas
        });
        setPhotosToDelete([]);
    };

    const handleSaveResponse = async () => {
        setSaving(true);
        try {
            await updateResponse(selectedResponse.id, editForm, photosToDelete);
            alert("Respuesta actualizada correctamente");

            // Recargar datos para ver cambios
            await verDetalleEncuesta(encuestaSeleccionada);
            setSelectedResponse(null);
            setIsEditing(false);
        } catch (error) {
            console.error("Error guardando:", error);
            alert("Error al guardar los cambios.");
        } finally {
            setSaving(false);
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

    // --- RENDERIZADO PRINCIPAL ---
    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 min-h-screen">
            {vista === 'lista' ? (
                /* VISTA DE SELECCIÓN DE ENCUESTA */
                <div>
                    <h1 className="text-2xl font-bold mb-6 text-content-primary">Panel de Resultados</h1>
                    {loading ? (
                        <div className="flex justify-center p-20"><Loader className="animate-spin text-brand-blue" /></div>
                    ) : (
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
                    )}
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
                                                    <span className="text-sm text-content-secondary">
                                                        Página {paginaActual} de {totalPaginas}
                                                    </span>
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
                                    {isEditing ? `Editando Respuesta #${selectedResponse.id}` : `Detalle de Respuesta #${selectedResponse.id}`}
                                </h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-content-secondary">
                                    <span className="flex items-center gap-1"><User size={14} /> {selectedResponse.usuario_nombre || "Anónimo"}</span>
                                    <span className="flex items-center gap-1"><Calendar size={14} /> {selectedResponse.fecha_envio}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isEditing && (
                                    <button
                                        onClick={handleEditClick}
                                        className="p-2 text-brand-blue hover:bg-brand-blue/10 rounded-full transition-colors"
                                        title="Editar Respuesta"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                )}
                                <button
                                    onClick={() => { setSelectedResponse(null); setIsEditing(false); }}
                                    className="p-2 hover:bg-surface-secondary rounded-full text-content-secondary transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Contenido del Modal */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-surface-secondary/10">
                            {/* Información de Ubicación */}
                            {(isEditing || selectedResponse.seccion || selectedResponse.barrio) && (
                                <div className="bg-white border border-border-base p-5 rounded-xl flex flex-wrap gap-6 shadow-sm">
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="text-[10px] uppercase font-bold text-content-secondary mb-1">Sección</div>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-blue/20 outline-none"
                                                value={editForm.seccion}
                                                onChange={e => setEditForm({ ...editForm, seccion: e.target.value })}
                                            />
                                        ) : (
                                            <div className="text-sm font-semibold text-content-primary flex items-center gap-1.5">
                                                <MapPin size={14} className="text-brand-blue" /> {selectedResponse.seccion || "-"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="text-[10px] uppercase font-bold text-content-secondary mb-1">Barrio</div>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-blue/20 outline-none"
                                                value={editForm.barrio}
                                                onChange={e => setEditForm({ ...editForm, barrio: e.target.value })}
                                            />
                                        ) : (
                                            <div className="text-sm font-semibold text-content-primary flex items-center gap-1.5">
                                                <MapPin size={14} className="text-brand-blue" /> {selectedResponse.barrio || "-"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Desglose de Preguntas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedResponse.detalles.map((d, idx) => {
                                    const preg = preguntas.find(p => p.id === d.pregunta);
                                    const pregTitulo = preg?.titulo || `Pregunta ${d.pregunta}`;
                                    // Preparar imagenes
                                    let images = [];
                                    if (d.fotos_extra && d.fotos_extra.length > 0) {
                                        images = d.fotos_extra.map(f => ({ id: f.id, url: f.imagen, isLegacy: false }));
                                    } else if (d.valor_foto) {
                                        images = [{ id: d.id, url: d.valor_foto, isLegacy: true }];
                                    }

                                    // Filtrar borradas en modo edición
                                    if (isEditing) {
                                        images = images.filter(img => !photosToDelete.includes(img.id));
                                    }

                                    const hasPhotos = images.length > 0;

                                    return (
                                        <div key={idx} className={`p-4 rounded-xl border border-border-base bg-white shadow-sm hover:shadow-md transition-shadow ${hasPhotos ? 'md:col-span-2' : ''}`}>
                                            <div className="text-xs font-bold text-brand-blue uppercase mb-2 tracking-wider">{pregTitulo}</div>

                                            {hasPhotos ? (
                                                <div className="mt-2">
                                                    {isEditing ? (
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                            {images.map(img => (
                                                                <div key={img.id} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-border-base">
                                                                    <img src={getSecureUrl(img.url)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                                    <button
                                                                        onClick={() => {
                                                                            if (!img.isLegacy) {
                                                                                setPhotosToDelete([...photosToDelete, img.id]);
                                                                            } else {
                                                                                alert("No se puede borrar esta foto antigua en modo edición rápida. Contacte a soporte.");
                                                                            }
                                                                        }}
                                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                                                                        title="Borrar foto"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <div className="flex items-center justify-center border-2 border-dashed border-border-base rounded-lg text-content-secondary text-xs text-center p-2">
                                                                (Subida bloqueada en edición)
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <ImageCarousel images={images} />
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-content-primary font-medium text-base whitespace-pre-wrap">
                                                    {isEditing ? (
                                                        preg?.tipo === 'numero' ? (
                                                            <input
                                                                type="number"
                                                                className="w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-blue/20 outline-none"
                                                                value={editForm.respuestas[d.pregunta] || ""}
                                                                onChange={e => setEditForm({
                                                                    ...editForm,
                                                                    respuestas: { ...editForm.respuestas, [d.pregunta]: e.target.value }
                                                                })}
                                                            />
                                                        ) : (
                                                            <textarea
                                                                className="w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-blue/20 outline-none min-h-[80px]"
                                                                value={editForm.respuestas[d.pregunta] || ""}
                                                                onChange={e => setEditForm({
                                                                    ...editForm,
                                                                    respuestas: { ...editForm.respuestas, [d.pregunta]: e.target.value }
                                                                })}
                                                            />
                                                        )
                                                    ) : (
                                                        (d.valor_texto || d.valor_numero)
                                                            ? <CompactText text={d.valor_texto || d.valor_numero} />
                                                            : <span className="text-content-secondary italic text-sm">Sin respuesta</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer del Modal */}
                        <div className="p-4 border-t border-border-base bg-surface-secondary/30 flex justify-end gap-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-content-secondary hover:bg-surface-secondary rounded-lg transition-colors font-medium border border-transparent hover:border-border-base"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveResponse}
                                        disabled={saving}
                                        className="px-6 py-2 bg-brand-blue text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-brand-blue/20 flex items-center gap-2"
                                    >
                                        {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                        Guardar Cambios
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setSelectedResponse(null)}
                                    className="px-6 py-2 bg-surface-secondary border border-border-base text-content-primary rounded-lg font-medium hover:bg-surface-tertiary transition-colors"
                                >
                                    Cerrar Detalle
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}