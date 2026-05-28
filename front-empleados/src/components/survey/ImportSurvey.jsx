import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { getSurvey, submitSurvey, getLocations, getUsers } from '../../api';
import MyButton from '../ui/MyButton';
import Card from '../ui/Card';
import { UploadCloud, CheckCircle, AlertCircle, Loader, ArrowRight, Eye, Play } from 'lucide-react';

const ImportSurvey = ({ surveys, relevamiento }) => {
    const allSurveys = [];
    if (relevamiento) allSurveys.push(relevamiento);
    if (surveys) allSurveys.push(...surveys.filter(s => !s.es_relevamiento));

    const [selectedSurveyId, setSelectedSurveyId] = useState("");
    const [surveyMapData, setSurveyMapData] = useState(null);
    const [locations, setLocations] = useState([]);
    const [users, setUsers] = useState([]);

    const [fileData, setFileData] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [mappings, setMappings] = useState({});

    // Global Valores
    const [globalValues, setGlobalValues] = useState({});

    // Step 1 or 2
    const [step, setStep] = useState(1);

    // Row State for Step 2
    const [rowsState, setRowsState] = useState([]);
    const [isImportingAll, setIsImportingAll] = useState(false);

    useEffect(() => {
        if (!selectedSurveyId) {
            setSurveyMapData(null);
            setStep(1);
            return;
        }

        const fetchDetails = async () => {
            try {
                const sData = await getSurvey(selectedSurveyId);
                setSurveyMapData(sData);

                if (sData.requiere_ubicacion) {
                    const locs = await getLocations();
                    setLocations(locs.results || locs || []);
                }
                if (sData.activar_encuestador_manual) {
                    const usrs = await getUsers();
                    setUsers(usrs.results || usrs || []);
                }
            } catch (err) {
                console.error("Error loading survey details", err);
                alert("Error al cargar la encuesta seleccionada.");
            }
        };
        fetchDetails();
    }, [selectedSurveyId]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];

            const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
            if (data.length > 0) {
                // Filter out empty headers like __EMPTY
                const cols = Object.keys(data[0]).filter(c => c && !String(c).includes('__EMPTY'));
                setHeaders(cols);
                setFileData(data);

                if (surveyMapData) {
                    const autoMappings = {};
                    surveyMapData.preguntas.forEach(q => {
                        const match = cols.find(c => c.toLowerCase().trim() === q.titulo.toLowerCase().trim());
                        if (match) autoMappings[`q_${q.id}`] = match;
                    });
                    setMappings(autoMappings);
                }
            } else {
                alert("El archivo parece estar vacío.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleMappingChange = (fieldKey, headerValue) => {
        setMappings(prev => ({ ...prev, [fieldKey]: headerValue }));
    };

    const handleGlobalChange = (fieldKey, value) => {
        setGlobalValues(prev => ({ ...prev, [fieldKey]: value }));
    };

    const getBarriosForSeccion = (seccionName) => {
        const loc = locations.find(l => l.nombre === seccionName);
        return loc ? loc.barrios : [];
    };

    const prepareRows = () => {
        const prepared = fileData.map((row, idx) => {
            // Evaluamos si las obligatorias están
            let missingRequired = false;
            if (surveyMapData) {
                missingRequired = surveyMapData.preguntas.some(q => {
                    if (q.obligatoria) {
                        const h = mappings[`q_${q.id}`];
                        return !h || row[h] === undefined || row[h] === "";
                    }
                    return false;
                });
            }

            // Para encuestador, barrio, seccion: usamos los valores globales asignados en el Paso 1
            let initEncuestador = "";
            let initSeccion = "";
            let initBarrio = "";
            let initFecha = "";

            if (surveyMapData?.activar_encuestador_manual) {
                initEncuestador = globalValues["manual_surveyor"] || "";
            }

            if (surveyMapData?.requiere_ubicacion) {
                initSeccion = globalValues["seccion"] || "";
                initBarrio = globalValues["barrio"] || "";
            }

            if (surveyMapData?.incluir_fecha) {
                initFecha = globalValues["fecha_custom"] || "";
            }

            return {
                id: idx,
                originalRow: row,
                status: missingRequired ? 'error' : 'pending', // 'pending', 'importing', 'success', 'error'
                errorMsg: missingRequired ? 'Faltan campos obligatorios' : null,
                seccion: initSeccion,
                barrio: initBarrio,
                surveyor: initEncuestador,
                fecha_custom: initFecha
            };
        });

        setRowsState(prepared);
        setStep(2);
    };

    const updateRow = (id, field, value) => {
        setRowsState(prev => prev.map(r => {
            if (r.id === id) {
                const newRow = { ...r, [field]: value };
                if (field === 'seccion') newRow.barrio = ''; // reset barrio si cambia seccion
                return newRow;
            }
            return r;
        }));
    };

    const importSingleRow = async (rowIndex) => {
        const rState = rowsState[rowIndex];
        if (rState.status === 'success' || rState.status === 'importing') return;

        // Validation limits
        if (surveyMapData.requiere_ubicacion && (!rState.seccion || !rState.barrio)) {
            updateRow(rowIndex, 'status', 'error');
            updateRow(rowIndex, 'errorMsg', "Falta Sección o Barrio");
            return;
        }

        if (surveyMapData.activar_encuestador_manual && !rState.surveyor) {
            updateRow(rowIndex, 'status', 'error');
            updateRow(rowIndex, 'errorMsg', "Se debe elegir un Encuestador");
            return;
        }

        updateRow(rowIndex, 'status', 'importing');

        try {
            const respuestasList = [];
            surveyMapData.preguntas.forEach(q => {
                const headerMapped = mappings[`q_${q.id}`];
                if (headerMapped && rState.originalRow[headerMapped] !== undefined && rState.originalRow[headerMapped] !== "") {
                    respuestasList.push({ pregunta_id: q.id, valor: rState.originalRow[headerMapped] });
                }
            });

            const jsonData = {
                respuestas: respuestasList,
                seccion: rState.seccion || null,
                barrio: rState.barrio || null,
                fecha_custom: rState.fecha_custom || null
            };

            if (surveyMapData.activar_encuestador_manual) {
                jsonData.usuario_id = rState.surveyor;
                if (rState.fecha_custom) {
                    jsonData.fecha_manual = rState.fecha_custom;
                }
            }

            await submitSurvey(surveyMapData.id, jsonData);

            updateRow(rowIndex, 'status', 'success');
            updateRow(rowIndex, 'errorMsg', null);

        } catch (err) {
            updateRow(rowIndex, 'status', 'error');
            updateRow(rowIndex, 'errorMsg', err.message);
        }
    };

    const runImportAll = async () => {
        setIsImportingAll(true);
        for (let i = 0; i < rowsState.length; i++) {
            if (rowsState[i].status === 'pending' || rowsState[i].status === 'error') {
                await importSingleRow(i);
            }
        }
        setIsImportingAll(false);
    };

    return (
        <Card className="p-4 space-y-6">
            <h2 className="text-xl font-bold text-content-primary flex items-center gap-2">
                <UploadCloud /> Importador Filas Asistido
            </h2>

            {step === 1 && (
                <div className="space-y-4">
                    {/* 1. Seleccionar Encuesta */}
                    <div>
                        <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">Seleccionar Encuesta Destino</label>
                        <select
                            className="w-full p-3 rounded-lg border border-border-base bg-surface-primary text-content-primary focus:ring-2 focus:ring-brand-blue/50"
                            value={selectedSurveyId}
                            onChange={(e) => setSelectedSurveyId(e.target.value)}
                        >
                            <option value="">Selecciona...</option>
                            {allSurveys.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre || s.titulo}</option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Cargar Archivo */}
                    {surveyMapData && (
                        <div>
                            <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">Cargar Archivo Excel (.xlsx)</label>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileUpload}
                                className="block w-full text-sm text-content-secondary
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-brand-blue/10 file:text-brand-blue
                                    hover:file:bg-brand-blue/20 cursor-pointer"
                            />
                        </div>
                    )}

                    {/* 3. Mapeador y Valores Globales */}
                    {headers.length > 0 && surveyMapData && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Mapeo de Columnas (Respuestas reales) */}
                            <div className="bg-surface-primary p-4 rounded-xl border border-border-base">
                                <h3 className="font-bold text-sm mb-3">Asignar Columnas de Preguntas</h3>
                                <div className="space-y-3">
                                    {surveyMapData.preguntas.map(q => {
                                        if (q.tipo === 'foto') return null;
                                        return (
                                            <MappingRow
                                                key={q.id}
                                                label={`${q.titulo} ${q.obligatoria ? '*' : ''}`}
                                                targetId={`q_${q.id}`}
                                                headers={headers}
                                                mappings={mappings}
                                                onChange={handleMappingChange}
                                            />
                                        );
                                    })}
                                    {surveyMapData.preguntas.filter(q => q.tipo !== 'foto').length === 0 && (
                                        <p className="text-xs text-content-secondary italic">No hay preguntas de texto para mapear.</p>
                                    )}
                                </div>
                            </div>

                            {/* Valores Fijos / Globales */}
                            <div className="bg-surface-primary p-4 rounded-xl border border-border-base">
                                <h3 className="font-bold text-sm mb-1">Valores Globales</h3>
                                <p className="text-xs text-content-secondary mb-4 italic">Si se dejan en blanco, se deberán configurar fila a fila.</p>

                                <div className="space-y-3">
                                    {surveyMapData.requiere_ubicacion && (
                                        <>
                                            <GlobalSelectRow label="Sección" targetId="seccion" value={globalValues["seccion"]} options={locations.map(l => ({ value: l.nombre, label: l.nombre }))} onChange={handleGlobalChange} />
                                            <GlobalSelectRow label="Barrio" targetId="barrio" value={globalValues["barrio"]} options={getBarriosForSeccion(globalValues["seccion"]).map(b => ({ value: b.nombre, label: b.nombre }))} onChange={handleGlobalChange} />
                                        </>
                                    )}
                                    {surveyMapData.incluir_fecha && (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 p-2 rounded-lg hover:bg-surface-secondary transition-colors text-sm border-b border-border-base last:border-0">
                                            <span className="font-medium w-full sm:w-1/2 text-content-primary">Fecha</span>
                                            <input
                                                type="date"
                                                className="w-full sm:w-1/2 p-2 rounded border border-border-base bg-surface-primary text-sm focus:ring-1 focus:ring-brand-blue/50 outline-none"
                                                value={globalValues["fecha_custom"] || ""}
                                                onChange={(e) => handleGlobalChange("fecha_custom", e.target.value)}
                                            />
                                        </div>
                                    )}
                                    {surveyMapData.activar_encuestador_manual && (
                                        <GlobalSelectRow label="Encuestador" targetId="manual_surveyor" value={globalValues["manual_surveyor"]} options={users.map(u => ({ value: u.id, label: u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username }))} onChange={handleGlobalChange} />
                                    )}
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Boton de inicio */}
                    {headers.length > 0 && surveyMapData && (
                        <div className="mt-8 px-4 lg:px-0">
                            <MyButton onClick={prepareRows} className="w-full bg-brand-blue text-white hover:bg-brand-blue/90 font-semibold py-3 flex items-center justify-center gap-2">
                                <Eye size={18} /> Mapear y Revisar Filas ({fileData.length})
                            </MyButton>
                        </div>
                    )}
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-primary p-4 rounded-xl border border-border-base shadow-sm">
                        <div>
                            <h3 className="font-bold text-lg">Revisión Fila a Fila</h3>
                            <p className="text-sm text-content-secondary">
                                Total: {rowsState.length} |
                                Completadas: <span className="text-emerald-500 font-bold">{rowsState.filter(r => r.status === 'success').length}</span> |
                                Pendientes: <span className="text-amber-500 font-bold">{rowsState.filter(r => r.status === 'pending' || r.status === 'error').length}</span>
                            </p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto overflow-hidden">
                            <MyButton
                                onClick={() => setStep(1)}
                                disabled={isImportingAll}
                                className="bg-transparent border border-border-base text-content-primary hover:bg-surface-secondary text-sm px-3"
                                style={{ width: 'auto' }}
                            >
                                Volver
                            </MyButton>
                            <MyButton
                                onClick={runImportAll}
                                disabled={isImportingAll || rowsState.filter(r => r.status === 'pending' || r.status === 'error').length === 0}
                                className="bg-emerald-500 text-white hover:bg-emerald-600 text-sm flex items-center gap-2 flex-1 sm:flex-none justify-center shrink-0"
                                style={{ width: 'auto' }}
                            >
                                {isImportingAll ? <><Loader size={16} className="animate-spin" /> Importando...</> : <><Play size={16} /> Importar Pendientes</>}
                            </MyButton>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {rowsState.map((r, rowIndex) => (
                            <div key={r.id} className={`p-4 rounded-xl border ${r.status === 'success' ? 'border-emerald-500/50 bg-emerald-500/5' : (r.status === 'error' ? 'border-red-500/50 bg-red-500/5' : 'border-border-base bg-surface-primary')} shadow-sm transition-colors`}>
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-bold text-sm">Fila Excel #{r.id + 2}</h4>
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        {r.status === 'success' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={14} /> Enviada</span>}
                                        {r.status === 'importing' && <span className="text-brand-blue flex items-center gap-1"><Loader size={14} className="animate-spin" /> Enviando...</span>}
                                        {r.status === 'error' && <span className="text-red-500 flex items-center gap-1"><AlertCircle size={14} /> {r.errorMsg}</span>}
                                        {r.status === 'pending' && <span className="text-content-secondary text-xs bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">Lista para revisar</span>}
                                    </div>
                                </div>

                                {/* Info Row: Show the first 2 mapped questions just as a preview so they know who this row belongs to */}
                                <div className="mb-4 text-xs text-content-secondary line-clamp-1 italic bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                                    Datos: {surveyMapData?.preguntas.slice(0, 3).map(q => {
                                        const h = mappings[`q_${q.id}`];
                                        return h && r.originalRow[h] ? `[${q.titulo}: ${r.originalRow[h]}] ` : '';
                                    }).join(" ")} ...
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                    {/* Selects for Missing data. Allow them to change even if pre-filled, unless it's success. */}
                                    {surveyMapData?.activar_encuestador_manual && (
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-content-secondary mb-1">Encuestador Real</label>
                                            <select
                                                className={`w-full p-2 text-xs rounded-lg border ${!r.surveyor ? 'border-red-300 dark:border-red-500/50 ring-1 ring-red-500/20' : 'border-border-base'} bg-surface-primary outline-none focus:ring-1 focus:ring-brand-blue disabled:opacity-50`}
                                                value={r.surveyor}
                                                onChange={(e) => updateRow(r.id, 'surveyor', e.target.value)}
                                                disabled={r.status === 'success' || r.status === 'importing'}
                                            >
                                                <option value="">-- Elige quién la hizo --</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {surveyMapData?.requiere_ubicacion && (
                                        <>
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-content-secondary mb-1">Sección</label>
                                                <select
                                                    className={`w-full p-2 text-xs rounded-lg border ${!r.seccion ? 'border-red-300 dark:border-red-500/50 ring-1 ring-red-500/20' : 'border-border-base'} bg-surface-primary outline-none focus:ring-1 focus:ring-brand-blue disabled:opacity-50`}
                                                    value={r.seccion}
                                                    onChange={(e) => updateRow(r.id, 'seccion', e.target.value)}
                                                    disabled={r.status === 'success' || r.status === 'importing'}
                                                >
                                                    <option value="">-- Sección --</option>
                                                    {locations.map(l => <option key={l.id} value={l.nombre}>{l.nombre}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-content-secondary mb-1">Barrio</label>
                                                <select
                                                    className={`w-full p-2 text-xs rounded-lg border ${(!r.barrio && r.seccion) ? 'border-red-300 dark:border-red-500/50 ring-1 ring-red-500/20' : 'border-border-base'} bg-surface-primary outline-none focus:ring-1 focus:ring-brand-blue disabled:opacity-50`}
                                                    value={r.barrio}
                                                    onChange={(e) => updateRow(r.id, 'barrio', e.target.value)}
                                                    disabled={!r.seccion || r.status === 'success' || r.status === 'importing'}
                                                >
                                                    <option value="">{!r.seccion ? "Elige Sección" : "-- Barrio --"}</option>
                                                    {getBarriosForSeccion(r.seccion).map(b => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {surveyMapData?.incluir_fecha && (
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-content-secondary mb-1">Fecha de Encuesta</label>
                                            <input
                                                type="date"
                                                className="w-full p-2 text-xs rounded-lg border border-border-base bg-surface-primary outline-none focus:ring-1 focus:ring-brand-blue disabled:opacity-50"
                                                value={r.fecha_custom || ""}
                                                onChange={(e) => updateRow(r.id, 'fecha_custom', e.target.value)}
                                                disabled={r.status === 'success' || r.status === 'importing'}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};

const MappingRow = ({ label, targetId, headers, mappings, onChange }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 p-2 rounded-lg hover:bg-surface-secondary transition-colors text-sm border-b border-border-base last:border-0">
        <div className="font-medium w-full sm:w-1/2 break-words text-content-primary">{label}</div>
        <ArrowRight className="hidden sm:block text-border-base opacity-50" size={14} />
        <select
            className="w-full sm:w-1/2 p-2 rounded border border-border-base bg-surface-primary text-sm focus:ring-1 focus:ring-brand-blue/50 outline-none"
            value={mappings[targetId] || ""}
            onChange={(e) => onChange(targetId, e.target.value)}
        >
            <option value="">-- Ignorar / No mapear --</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
    </div>
);

const GlobalSelectRow = ({ label, targetId, value, options, onChange }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 p-2 rounded-lg hover:bg-surface-secondary transition-colors text-sm border-b border-border-base last:border-0">
        <span className="font-medium w-full sm:w-1/2 text-content-primary">{label}</span>
        <select
            className="w-full sm:w-1/2 p-2 rounded border border-border-base bg-surface-primary text-sm focus:ring-1 focus:ring-brand-blue/50 outline-none"
            value={value || ""}
            onChange={(e) => onChange(targetId, e.target.value)}
        >
            <option value="">(Asignar Manual)</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
);

export default ImportSurvey;
