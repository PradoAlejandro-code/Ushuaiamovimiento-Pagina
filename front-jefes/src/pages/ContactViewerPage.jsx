import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getContactosDb, saveContacto, deleteContacto, importContactos, getSurvey } from "../api";
import { ArrowLeft, Loader, Download, MessageCircle, Search, Plus, Upload, Trash2, Edit2, X, Save, Phone, Tag, User, Mail, CreditCard } from "lucide-react";
import Card from '../components/ui/Card';
import WhatsAppQRButton from '../components/ui/WhatsAppQRButton';

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
    const [currentContact, setCurrentContact] = useState({ nombre: '', celular: '', email: '', dni: '', tag: '' });
    const [saving, setSaving] = useState(false);

    // Form state for Import
    const [importData, setImportData] = useState(null);
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
        (c.celular || "").includes(filter) ||
        (c.email || "").toLowerCase().includes(filter.toLowerCase()) ||
        (c.dni || "").includes(filter)
    );

    // --- Actions ---

    const handleCreateClick = () => {
        setCurrentContact({ nombre: '', celular: '', email: '', dni: '', tag: 'manual' });
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
        if (!importData) {
            alert("Selecciona un archivo CSV.");
            return;
        }
        setImporting(true);

        try {
            // Enviamos el archivo directamente al backend
            const result = await importContactos(importData, importTag);

            alert(result.message); // El backend devuelve "message" con el resumen

            setIsImportModalOpen(false);
            setImportData(null);
            loadData();
        } catch (error) {
            console.error("Error importing", error);
            alert("Hubo un error en la importación: " + error.message);
        } finally {
            setImporting(false);
        }
    };

    const [downloading, setDownloading] = useState(false);
    const handleDownload = () => {
        setDownloading(true);
        try {
            // Google Contacts CSV Format headers
            const headers = [
                "Name",
                "Given Name",
                "Phone 1 - Type",
                "Phone 1 - Value",
                "E-mail 1 - Type",
                "E-mail 1 - Value",
                "Organization 1 - Name", // Usamos Organization para el Tag
                "Notes" // Usamos Notes para DNI
            ];

            // Helper to escape CSV fields
            const escapeCsv = (text) => {
                if (!text) return "";
                const stringText = String(text);
                if (stringText.includes(",") || stringText.includes('"') || stringText.includes("\n")) {
                    return `"${stringText.replace(/"/g, '""')}"`;
                }
                return stringText;
            };

            const rows = filteredContacts.map(c => {
                return [
                    escapeCsv(c.nombre), // Name
                    escapeCsv(c.nombre), // Given Name (repetimos para asegurar)
                    "Mobile", // Phone 1 - Type
                    escapeCsv(c.celular), // Phone 1 - Value
                    "Home", // E-mail 1 - Type
                    escapeCsv(c.email), // E-mail 1 - Value
                    escapeCsv(c.tag), // Organization as Tag
                    escapeCsv(c.dni ? `DNI: ${c.dni}` : "") // Notes
                ].join(",");
            });

            const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n"); // Add BOM for Excel/UTF-8
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `google_contacts_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);

        } catch (error) {
            console.error("Falló la descarga:", error);
            alert("No se pudo generar el archivo.");
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
                        <span className="hidden md:inline">Importar CSV</span>
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
                        placeholder="Buscar por nombre, email, tag o celular..."
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
                                <th className="p-4">Email / DNI</th>
                                <th className="p-4">Tag</th>
                                <th className="p-4 text-right">Actualizado</th>
                                <th className="p-4 text-right pr-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-base">
                            {filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-content-secondary">
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
                                            <div className="flex items-center gap-2">
                                                <span className="text-content-primary font-mono text-sm">{c.celular}</span>
                                                <a
                                                    href={`https://wa.me/${c.celular.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 opacity-70 group-hover:opacity-100 transition-opacity"
                                                    title="Abrir WhatsApp Web"
                                                >
                                                    <MessageCircle size={16} />
                                                </a>
                                                <WhatsAppQRButton
                                                    phoneNumber={c.celular}
                                                    name={c.nombre}
                                                />
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex flex-col text-sm">
                                                {c.email && (
                                                    <div className="flex items-center gap-1.5 text-content-primary mb-0.5">
                                                        <Mail size={12} className="text-content-secondary" />
                                                        <span>{c.email}</span>
                                                    </div>
                                                )}
                                                {c.dni && (
                                                    <div className="flex items-center gap-1.5 text-content-secondary">
                                                        <CreditCard size={12} />
                                                        <span>{c.dni}</span>
                                                    </div>
                                                )}
                                                {!c.email && !c.dni && <span className="text-content-secondary text-xs italic">Sin datos extra</span>}
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
                                        value={currentContact.nombre || ''}
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
                                        value={currentContact.celular || ''}
                                        onChange={(e) => setCurrentContact({ ...currentContact, celular: e.target.value })}
                                    />
                                </div>
                                <p className="text-xs text-content-secondary mt-1">El número será limpiado y guardado como identificador.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-content-secondary mb-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 text-content-secondary" size={18} />
                                        <input
                                            type="email"
                                            className="w-full pl-10 pr-4 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none bg-surface-primary text-content-primary"
                                            placeholder="juan@email.com"
                                            value={currentContact.email || ''}
                                            onChange={(e) => setCurrentContact({ ...currentContact, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-content-secondary mb-1">DNI</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-2.5 text-content-secondary" size={18} />
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none bg-surface-primary text-content-primary"
                                            placeholder="12345678"
                                            value={currentContact.dni || ''}
                                            onChange={(e) => setCurrentContact({ ...currentContact, dni: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-content-secondary mb-1">Tag / Etiqueta</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-2.5 text-content-secondary" size={18} />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none bg-surface-primary text-content-primary"
                                        placeholder="cliente, proveedor, encuesta..."
                                        value={currentContact.tag || ''}
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
                            <h2 className="text-lg font-bold text-content-primary">Importar Contactos (CSV Google)</h2>
                            <button onClick={() => setIsImportModalOpen(false)} className="text-content-secondary hover:text-content-primary">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleImportContacts} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-content-secondary mb-1">Tag para estos importados</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-2.5 text-content-secondary" size={18} />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none bg-surface-primary text-content-primary"
                                        value={importTag}
                                        onChange={(e) => setImportTag(e.target.value)}
                                        placeholder="ej: lote-enero"
                                    />
                                </div>
                                <p className="text-xs text-content-secondary mt-1">Este tag sobrescribirá el campo 'Organization' del CSV si se deja vacío, o se usará como fallback.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-content-secondary mb-1">Archivo CSV</label>
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border-base border-dashed rounded-lg cursor-pointer bg-surface-secondary hover:bg-surface-tertiary transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-4 text-content-secondary" />
                                            <p className="mb-2 text-sm text-content-secondary"><span className="font-semibold">Click para subir</span> o arrastra</p>
                                            <p className="text-xs text-content-secondary">CSV de Google Contacts</p>
                                        </div>
                                        <input
                                            type="file"
                                            accept=".csv"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setImportData(e.target.files[0]);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                {importData && (
                                    <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                        Archivo seleccionado: {importData.name}
                                    </p>
                                )}
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
                                    disabled={importing || !importData}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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