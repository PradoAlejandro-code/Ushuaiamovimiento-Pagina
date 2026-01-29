import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getContactosDb, saveContacto, deleteContacto, importContactos, getSurvey } from "../api";
import { ArrowLeft, Loader, Download, MessageCircle, Search, Plus, Upload, Trash2, Edit2, X, Save, Phone, Tag, User } from "lucide-react";
import Card from '../components/ui/Card';

const ContactViewerPage = () => {
    const { id } = useParams(); // ID de la encuesta, si venimos de una
    const navigate = useNavigate();

    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [surveyName, setSurveyName] = useState("");

    // Modals state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Form state for Create/Edit
    const [currentContact, setCurrentContact] = useState({ nombre: '', celular: '', tag: '' });
    const [saving, setSaving] = useState(false);

    // Form state for Import
    const [importData, setImportData] = useState('');
    const [importTag, setImportTag] = useState('importado');
    const [importing, setImporting] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar datos de contactos (Centralizado)
            const data = await getContactosDb();
            setContacts(data);

            // Si hay ID, solo cargamos el nombre de la encuesta para contexto, pero mostramos todos los contactos
            // (O en el futuro filtraríamos si el backend lo soporta)
            if (id) {
                const sData = await getSurvey(id);
                setSurveyName(sData.nombre);
            }
        } catch (error) {
            console.error("Error loading contacts", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    const filteredContacts = contacts.filter(c =>
        (c.nombre || "").toLowerCase().includes(filter.toLowerCase()) ||
        (c.tag || "").toLowerCase().includes(filter.toLowerCase()) ||
        (c.celular || "").includes(filter)
    );

    // --- Actions ---

    const handleCreateClick = () => {
        setCurrentContact({ nombre: '', celular: '', tag: 'manual' });
        setIsEditModalOpen(true);
    };

    const handleEditClick = (contact) => {
        setCurrentContact(contact);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = async (contactId) => {
        if (!window.confirm("¿Seguro que deseas eliminar este contacto?")) return;
        try {
            await deleteContacto(contactId);
            setContacts(contacts.filter(c => c.id !== contactId));
        } catch (error) {
            console.error("Error deleting contact", error);
            alert("Error al eliminar contacto");
        }
    };

    const handleSaveContact = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const saved = await saveContacto(currentContact);
            if (currentContact.id) {
                // Update list
                setContacts(contacts.map(c => c.id === saved.id ? saved : c));
            } else {
                // Add to list
                setContacts([saved, ...contacts]);
            }
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Error saving contact", error);
            alert("Error al guardar contacto. Verifique que el número no esté duplicado.");
        } finally {
            setSaving(false);
        }
    };

    const handleImportContacts = async (e) => {
        e.preventDefault();
        setImporting(true);
        try {
            let parsedData;
            try {
                parsedData = JSON.parse(importData);
            } catch (err) {
                alert("El JSON no es válido.");
                setImporting(false);
                return;
            }

            if (!Array.isArray(parsedData)) {
                alert("El JSON debe ser una lista de objetos.");
                setImporting(false);
                return;
            }

            const result = await importContactos(parsedData, importTag);
            alert(`Importación completada: ${result.creados} creados, ${result.actualizados} actualizados.`);
            setIsImportModalOpen(false);
            setImportData('');
            loadData(); // Reload list
        } catch (error) {
            console.error("Error importing", error);
            alert("Hubo un error en la importación.");
        } finally {
            setImporting(false);
        }
    };

    const [downloading, setDownloading] = useState(false);
    const handleDownload = async () => {
        setDownloading(true);
        try {
            const token = localStorage.getItem('access_token');
            // Usamos el endpoint global de exportación si no hay ID, o el de encuesta si lo hay (aunque ahora la lista es global, el export puede ser contextual)
            // Si queremos exportar LO QUE VEMOS (la tabla), deberíamos apuntar a un export de Contactos.
            // Asumiremos que el backend tiene un export para contactos. Si no, usamos el fallback.
            // Por ahora mantenemos la lógica existente o apuntamos a `api/surveys/contactos/exportar/` si existiera.
            // Usaremos la ruta 'all' antigua que mapeaba a todos.
            const url = id
                ? `${API_URL}/api/surveys/${id}/exportar-csv/`
                : `${API_URL}/api/surveys/contactos/all/exportar-csv/`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Error al descargar");

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `contactos_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);

        } catch (error) {
            console.error("Falló la descarga:", error);
            alert("No se pudo descargar el archivo.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-brand-blue" /></div>;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(id ? `/surveys/${id}` : '/surveys')} className="p-2 hover:bg-surface-secondary rounded-full shadow-sm text-content-secondary hover:text-content-primary transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-content-primary">
                            Visualizador de Contactos
                        </h1>
                        <p className="text-content-secondary text-sm">
                            {surveyName ? `Contexto: ${surveyName}` : "Base de Datos Centralizada"}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-surface-secondary border border-border-base text-content-primary rounded-lg hover:bg-surface-tertiary transition-colors"
                    >
                        <Upload size={18} />
                        <span className="hidden md:inline">Importar JSON</span>
                    </button>
                    <button
                        onClick={handleCreateClick}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        <span className="hidden md:inline">Nuevo Contacto</span>
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <Card className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between !p-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 text-content-secondary" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, tag o celular..."
                        className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 text-content-primary placeholder-content-secondary/50"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg shadow-sm w-full md:w-auto justify-center font-medium
                        ${downloading
                            ? 'bg-surface-secondary text-content-secondary cursor-not-allowed border border-border-base'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                >
                    {downloading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                    {downloading ? 'Generando...' : 'Descargar CSV'}
                </button>
            </Card>

            {/* Table */}
            <Card className="!p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-secondary border-b border-border-base text-xs font-semibold text-content-secondary uppercase tracking-wider">
                                <th className="p-4 pl-6">Nombre</th>
                                <th className="p-4">Teléfono</th>
                                <th className="p-4">Tag</th>
                                <th className="p-4 text-right">Actualizado</th>
                                <th className="p-4 text-right pr-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-base">
                            {filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-content-secondary">
                                        {filter ? "No hay resultados para tu búsqueda." : "No se encontraron contactos."}
                                    </td>
                                </tr>
                            ) : (
                                filteredContacts.map((c) => (
                                    <tr key={c.id || c.celular} className="hover:bg-brand-blue/5 group transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue font-bold border border-brand-blue/20 text-sm">
                                                    {(c.nombre && c.nombre !== "No especificado") ? c.nombre.charAt(0).toUpperCase() : <User size={16} />}
                                                </div>
                                                <span className="font-semibold text-content-primary text-sm">
                                                    {c.nombre || "Sin Nombre"}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-content-primary font-mono text-sm">{c.celular}</span>
                                                <a
                                                    href={`https://wa.me/${c.celular.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 opacity-70 group-hover:opacity-100 transition-opacity"
                                                    title="Abrir WhatsApp"
                                                >
                                                    <MessageCircle size={16} />
                                                </a>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-secondary text-content-secondary border border-border-base">
                                                <Tag size={12} />
                                                {c.tag || 'General'}
                                            </span>
                                        </td>

                                        <td className="p-4 text-right text-sm text-content-secondary">
                                            {c.ultima_actualizacion ? new Date(c.ultima_actualizacion).toLocaleDateString() : '-'}
                                        </td>

                                        <td className="p-4 text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(c)}
                                                    className="p-1.5 text-content-secondary hover:text-brand-blue hover:bg-brand-blue/10 rounded transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(c.id)}
                                                    className="p-1.5 text-content-secondary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal Create/Edit */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-surface-primary rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-border-base flex justify-between items-center bg-surface-secondary">
                            <h2 className="text-lg font-bold text-content-primary">
                                {currentContact.id ? 'Editar Contacto' : 'Nuevo Contacto'}
                            </h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-content-secondary hover:text-content-primary">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveContact} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-content-secondary mb-1">Nombre Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 text-content-secondary" size={18} />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none bg-surface-primary text-content-primary"
                                        placeholder="Juan Pérez"
                                        value={currentContact.nombre}
                                        onChange={(e) => setCurrentContact({ ...currentContact, nombre: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-content-secondary mb-1">Celular (Único)</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 text-content-secondary" size={18} />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none bg-surface-primary text-content-primary"
                                        placeholder="+54 9 11 1234 5678"
                                        value={currentContact.celular}
                                        onChange={(e) => setCurrentContact({ ...currentContact, celular: e.target.value })}
                                    />
                                </div>
                                <p className="text-xs text-content-secondary mt-1">El número será limpiado y guardado como identificador.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-content-secondary mb-1">Tag / Etiqueta</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-2.5 text-content-secondary" size={18} />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none bg-surface-primary text-content-primary"
                                        placeholder="cliente, proveedor, encuesta..."
                                        value={currentContact.tag}
                                        onChange={(e) => setCurrentContact({ ...currentContact, tag: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-border-base rounded-lg text-content-secondary hover:bg-surface-secondary transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
                                >
                                    {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Import */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-surface-primary rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-border-base flex justify-between items-center bg-surface-secondary">
                            <h2 className="text-lg font-bold text-content-primary">Importar Contactos (JSON)</h2>
                            <button onClick={() => setIsImportModalOpen(false)} className="text-content-secondary hover:text-content-primary">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleImportContacts} className="p-6 space-y-4">
                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-blue-800">
                                <p className="font-semibold mb-1">Formato Esperado:</p>
                                <code className="block bg-white/50 p-2 rounded border border-blue-200 text-xs font-mono">
                                    [<br />
                                    &nbsp;&nbsp;{"{ \"nombre\": \"Juan\", \"celular\": \"11223344\" }"},<br />
                                    &nbsp;&nbsp;{"{ \"nombre\": \"Ana\", \"celular\": \"55667788\" }"}<br />
                                    ]
                                </code>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-content-secondary mb-1">Tag para estos importados</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none bg-surface-primary text-content-primary"
                                    value={importTag}
                                    onChange={(e) => setImportTag(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-content-secondary mb-1">Datos JSON</label>
                                <textarea
                                    required
                                    rows={6}
                                    className="w-full px-4 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none bg-surface-primary text-content-primary font-mono text-xs"
                                    placeholder='[{ "nombre": "...", "celular": "..." }]'
                                    value={importData}
                                    onChange={(e) => setImportData(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-border-base rounded-lg text-content-secondary hover:bg-surface-secondary transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={importing}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2"
                                >
                                    {importing ? <Loader size={18} className="animate-spin" /> : <Upload size={18} />}
                                    Importar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactViewerPage;