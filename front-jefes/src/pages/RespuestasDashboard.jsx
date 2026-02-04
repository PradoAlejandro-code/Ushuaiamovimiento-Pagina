import React, { useState, useEffect } from 'react';
import { procesarDatosParaGraficos, procesarParticipacionPorUsuario } from '../utils/analyticsHelpers';
import ChartCard from '../components/Analytics/ChartCard';
import { getAllSurveys, getSurvey, getSurveyResponses, updateResponse, deleteResponse } from '../api';
import {
    ArrowLeft, Loader, FileText, Calendar, Download, ChevronLeft, ChevronRight,
    X, MapPin, User, Edit2, Save, Eye, Trash2, RefreshCcw, Camera, Image as ImageIcon, Loader2
} from 'lucide-react';
import Card from '../components/ui/Card';
import ImageCarousel from '../components/ui/ImageCarousel';
import imageCompression from 'browser-image-compression';

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
    const [rotatedImages, setRotatedImages] = useState({}); // { [imgId]: degrees }
    const [newPhotos, setNewPhotos] = useState({}); // { [questionId]: [File, ...] }
    const [processingCount, setProcessingCount] = useState(0);

    // --- HELPER DE ROTACIÓN (Canvas) ---
    const getRotatedFile = (imageUrl, degrees) => {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.src = imageUrl;
            // Evitar caché para que el canvas no se ensucie
            image.src = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();

            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Si rotamos 90 o 270, invertimos dimensiones
                if (degrees % 180 !== 0) {
                    canvas.width = image.naturalHeight;
                    canvas.height = image.naturalWidth;
                } else {
                    canvas.width = image.naturalWidth;
                    canvas.height = image.naturalHeight;
                }

                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((degrees * Math.PI) / 180);
                ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Canvas is empty'));
                        return;
                    }
                    resolve(new File([blob], "foto_rotada.jpg", { type: "image/jpeg" }));
                }, 'image/jpeg', 0.9);
            };
            image.onerror = (err) => reject(err);
        });
    };

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
        setRotatedImages({});
        setNewPhotos({});
    };

    const handleRotate = (imgId) => {
        setRotatedImages(prev => ({
            ...prev,
            [imgId]: (prev[imgId] || 0) + 90
        }));
    };

    const handleFileChangeHelper = async (e, questionId) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            setProcessingCount(prev => prev + selectedFiles.length);

            const options = {
                maxSizeMB: 0.8,
                maxWidthOrHeight: 1280,
                useWebWorker: true
            };

            try {
                const compressedFiles = [];
                for (const file of selectedFiles) {
                    if (file.type.startsWith('image/')) {
                        try {
                            const compressed = await imageCompression(file, options);
                            compressedFiles.push(compressed);
                        } catch (err) {
                            console.error("Error compression", err);
                            compressedFiles.push(file); // Fallback
                        }
                    } else {
                        compressedFiles.push(file);
                    }
                }

                setNewPhotos(prev => ({
                    ...prev,
                    [questionId]: [...(prev[questionId] || []), ...compressedFiles]
                }));
            } catch (error) {
                console.error("Error global processing files:", error);
            } finally {
                setProcessingCount(prev => Math.max(0, prev - selectedFiles.length));
                e.target.value = '';
            }
        }
    };

    const handleRemoveNewPhoto = (questionId, index) => {
        setNewPhotos(prev => {
            const current = prev[questionId] || [];
            const updated = current.filter((_, i) => i !== index);
            return { ...prev, [questionId]: updated };
        });
    };

    const handleSaveResponse = async () => {
        if (processingCount > 0) return; // Prevent save while processing
        setSaving(true);
        try {
            // 1. Preparar Payload Base
            // Transformar el objeto respuestas {id: val} a array de detalles [{pregunta_id, valor}]
            // que es lo que espera RespuestaUpdateSerializer
            const detallesPayload = Object.entries(editForm.respuestas).map(([pId, val]) => ({
                pregunta_id: parseInt(pId),
                valor: val
            }));

            const jsonPayload = {
                // ...editForm, // No enviamos todo editForm crudo
                detalles: detallesPayload,
                seccion: editForm.seccion,
                barrio: editForm.barrio,
                delete_extra_ids: [...photosToDelete]
            };

            const formData = new FormData();

            // 2. Procesar Rotaciones
            const rotationPromises = [];

            // Necesitamos saber a qué pregunta pertenece cada imagen rotada
            for (const detalle of selectedResponse.detalles) {
                const extraFotos = detalle.fotos_extra || [];
                const legacyFoto = detalle.valor_foto ? [{ id: detalle.id, imagen: detalle.valor_foto, isLegacy: true }] : [];
                const allFotos = [...extraFotos, ...legacyFoto];

                for (const foto of allFotos) {
                    const definitionId = foto.isLegacy ? foto.id : foto.id;
                    const deg = rotatedImages[definitionId];
                    if (deg && deg % 360 !== 0) {
                        // A. Marcar original para borrado
                        if (!foto.isLegacy) {
                            if (!jsonPayload.delete_extra_ids.includes(definitionId)) {
                                jsonPayload.delete_extra_ids.push(definitionId);
                            }
                        } else {
                            if (!jsonPayload.delete_legacy_detail_ids) jsonPayload.delete_legacy_detail_ids = [];
                            jsonPayload.delete_legacy_detail_ids.push(definitionId);
                        }

                        // B. Generar archivo nuevo
                        const p = getRotatedFile(getSecureUrl(foto.imagen || foto.url), deg).then(file => {
                            formData.append(`foto_${detalle.pregunta}`, file);
                        });
                        rotationPromises.push(p);
                    }
                }
            }

            await Promise.all(rotationPromises);

            // 3. Append Nuevas Fotos (Uploads)
            Object.entries(newPhotos).forEach(([qId, files]) => {
                files.forEach(file => {
                    formData.append(`foto_${qId}`, file);
                });
            });

            // 4. Append JSON Data
            // Usamos el campo 'data' que nuestro backend modificado sabrá parsear
            formData.append('data', JSON.stringify(jsonPayload));

            // 5. Enviar
            await updateResponse(selectedResponse.id, formData);
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

    const handleDeleteResponse = async () => {
        if (!selectedResponse) return;

        if (window.confirm("¿Estás seguro de que deseas eliminar esta respuesta? Esta acción no se puede deshacer.")) {
            setSaving(true);
            try {
                await deleteResponse(selectedResponse.id);
                alert("🗑️ Respuesta eliminada correctamente");

                // Recargar datos
                await verDetalleEncuesta(encuestaSeleccionada);
                setSelectedResponse(null);
                setIsEditing(false);
            } catch (error) {
                console.error("Error eliminando:", error);
                alert("❌ Error al eliminar la respuesta.");
            } finally {
                setSaving(false);
            }
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
                                    <>
                                        <button
                                            onClick={handleDeleteResponse}
                                            disabled={saving}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            title="Eliminar Respuesta"
                                        >
                                            {saving ? <Loader size={20} className="animate-spin" /> : <Trash2 size={20} />}
                                        </button>
                                        <button
                                            onClick={handleEditClick}
                                            className="p-2 text-brand-blue hover:bg-brand-blue/10 rounded-full transition-colors"
                                            title="Editar Respuesta"
                                        >
                                            <Edit2 size={20} />
                                        </button>
                                    </>
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
                                {preguntas.map((preg, idx) => {
                                    // Buscar respuesta existente para esta pregunta (Loose equality allows string/number match)
                                    const d = selectedResponse.detalles.find(det => det.pregunta == preg.id) || {};

                                    const pregTitulo = preg.titulo;

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
                                    const hasTextValue = d.valor_texto || d.valor_numero !== null && d.valor_numero !== undefined;

                                    // Si NO estamos editando y NO hay respuesta, NO mostrar.
                                    // Usamos comprobar contenido real en lugar de solo ID para ser más robustos.
                                    if (!isEditing && !hasPhotos && !hasTextValue) return null;

                                    return (
                                        <div key={preg.id} className={`p-4 rounded-xl border border-border-base bg-white shadow-sm hover:shadow-md transition-shadow ${hasPhotos ? 'md:col-span-2' : ''}`}>
                                            <div className="text-xs font-bold text-brand-blue uppercase mb-2 tracking-wider">{pregTitulo}</div>

                                            {hasPhotos ? (
                                                <div className="mt-2">
                                                    {isEditing ? (
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                            {/* 1. Imágenes Existentes */}
                                                            {images.map(img => (
                                                                <div key={img.id} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-border-base">
                                                                    <img
                                                                        src={getSecureUrl(img.url)}
                                                                        className="w-full h-full object-cover transition-transform duration-300"
                                                                        style={{ transform: `rotate(${rotatedImages[img.id] || 0}deg)` }}
                                                                    />

                                                                    <button
                                                                        onClick={() => {
                                                                            if (!img.isLegacy) {
                                                                                setPhotosToDelete([...photosToDelete, img.id]);
                                                                            } else {
                                                                                alert("No se puede borrar esta foto antigua en modo edición rápida. Contacte a soporte.");
                                                                            }
                                                                        }}
                                                                        className="absolute top-1 right-1 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm z-10"
                                                                        title="Borrar foto"
                                                                    >
                                                                        <X size={18} />
                                                                    </button>

                                                                    <button
                                                                        onClick={() => handleRotate(img.id)}
                                                                        className="absolute bottom-1 right-1 p-2 bg-brand-blue text-white rounded-full hover:bg-blue-600 shadow-sm z-10"
                                                                        title="Rotar 90º"
                                                                    >
                                                                        <RefreshCcw size={18} />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            {/* 2. Nuevas Fotos Uploaded */}
                                                            {(newPhotos[preg.id] || []).map((file, i) => (
                                                                <div key={`new-${i}`} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-border-base border-brand-blue/50">
                                                                    <img
                                                                        src={URL.createObjectURL(file)}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleRemoveNewPhoto(preg.id, i)}
                                                                        className="absolute top-1 right-1 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm z-10"
                                                                    >
                                                                        <X size={18} />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            {/* 3. Botón Upload o Loading */}
                                                            {processingCount > 0 ? (
                                                                <div className="aspect-square rounded-lg border border-dashed border-brand-blue/30 bg-brand-blue/5 flex flex-col items-center justify-center animate-pulse">
                                                                    <Loader2 className="animate-spin text-brand-blue mb-1" size={24} />
                                                                    <span className="text-[10px] text-brand-blue font-black uppercase text-center px-1">Procesando</span>
                                                                </div>
                                                            ) : (
                                                                <div className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border-base rounded-lg text-content-secondary hover:text-brand-blue hover:border-brand-blue transition-all cursor-pointer group">
                                                                    <Camera size={24} className="group-hover:scale-110 transition-transform" />
                                                                    <span className="text-[10px] font-bold mt-1">Añadir</span>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        multiple
                                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                                        onChange={(e) => handleFileChangeHelper(e, preg.id)}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <ImageCarousel images={images} />
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-content-primary font-medium text-base whitespace-pre-wrap">
                                                    {isEditing ? (
                                                        preg?.tipo === 'foto' ? (
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                                                                {/* Nuevas Fotos en pregunta vacía */}
                                                                {(newPhotos[preg.id] || []).map((file, i) => (
                                                                    <div key={`new-${i}`} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-border-base border-brand-blue/50">
                                                                        <img
                                                                            src={URL.createObjectURL(file)}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                        <button
                                                                            onClick={() => handleRemoveNewPhoto(preg.id, i)}
                                                                            className="absolute top-1 right-1 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm z-10"
                                                                        >
                                                                            <X size={18} />
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                                {/* Botón Upload o Loading */}
                                                                {processingCount > 0 ? (
                                                                    <div className="aspect-square rounded-lg border border-dashed border-brand-blue/30 bg-brand-blue/5 flex flex-col items-center justify-center animate-pulse">
                                                                        <Loader2 className="animate-spin text-brand-blue mb-1" size={24} />
                                                                        <span className="text-[10px] text-brand-blue font-black uppercase text-center px-1">Procesando</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border-base rounded-lg text-content-secondary hover:text-brand-blue hover:border-brand-blue transition-all cursor-pointer group">
                                                                        <Camera size={24} className="group-hover:scale-110 transition-transform" />
                                                                        <span className="text-[10px] font-bold mt-1">Añadir</span>
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            multiple
                                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                                            onChange={(e) => handleFileChangeHelper(e, preg.id)}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : preg?.tipo === 'numero' ? (
                                                            <input
                                                                type="number"
                                                                className="w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-blue/20 outline-none"
                                                                value={editForm.respuestas[preg.id] || ""}
                                                                onChange={e => setEditForm({
                                                                    ...editForm,
                                                                    respuestas: { ...editForm.respuestas, [preg.id]: e.target.value }
                                                                })}
                                                            />
                                                        ) : (
                                                            <textarea
                                                                className="w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-blue/20 outline-none min-h-[80px]"
                                                                value={editForm.respuestas[preg.id] || ""}
                                                                onChange={e => setEditForm({
                                                                    ...editForm,
                                                                    respuestas: { ...editForm.respuestas, [preg.id]: e.target.value }
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
                                        disabled={saving || processingCount > 0}
                                        className={`px-6 py-2 bg-brand-blue text-white rounded-lg font-bold transition-all shadow-lg shadow-brand-blue/20 flex items-center gap-2 ${processingCount > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                                    >
                                        {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                        {processingCount > 0 ? "Procesando..." : "Guardar Cambios"}

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