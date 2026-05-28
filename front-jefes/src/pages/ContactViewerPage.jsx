import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContactsList, useSaveContact, useDeleteContact, useImportContacts } from '@/queries/useContacts';
import { useSurveyDetail, useSurveyResponseDetail } from '@/queries/useSurveys';
import { useExportContacts, useExportContactsExcel } from '@/queries/useExport';
import {
    ArrowLeft, Loader, Download, MessageCircle, Search, Plus,
    Upload, Trash2, Edit2, Mail, CreditCard, Tag, User, X, Phone, ChevronDown,
    Users, LayoutGrid, ClipboardList
} from "lucide-react";

import Card from '../components/ui/Card';
import WhatsAppQRButton from '../components/ui/WhatsAppQRButton';
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
import ContactEditModal from "../components/contact/ContactEditModal"; // Lógica de contacto separada
import SurveyResponseDetailCard from '../components/survey/SurveyResponseDetailCard';
import MyButton from '../components/ui/MyButton';

const ContactViewerPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: contactsData, isLoading: loading } = useContactsList(id);
    const contacts = contactsData?.results || contactsData || [];

    const { data: surveyData } = useSurveyDetail(id);
    const surveyName = surveyData?.nombre || "";

    const [originResponseId, setOriginResponseId] = useState(null);
    const { data: originResponseRaw, isLoading: loadingOrigin } = useSurveyResponseDetail(originResponseId);

    const originResponse = useMemo(() => {
        if (!originResponseRaw) return null;
        const data = { ...originResponseRaw };
        const sourceDetails = data.detalles_completos || data.detalles || [];
        if (sourceDetails.length) {
            data.detalles = sourceDetails.map(detalle => ({
                ...detalle,
                pregunta_id: detalle.pregunta_id !== undefined ? detalle.pregunta_id : detalle.pregunta
            }));
        }
        return data;
    }, [originResponseRaw]);

    // ==========================================
    // 2. ESTADOS LOCALES DE UI
    // ==========================================
    const [filter, setFilter] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [currentContact, setCurrentContact] = useState(null);
    const [saveContactStatus, setSaveContactStatus] = useState(null);
    const [importData, setImportData] = useState(null);
    const [importTag, setImportTag] = useState('importado');
    const [importStatus, setImportStatus] = useState(null);

    const [exportStatus, setExportStatus] = useState(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    // ==========================================
    // 3. MUTACIONES Y ACCIONES (React Query)
    // ==========================================
    const { mutateAsync: saveContactMut, isPending: saving } = useSaveContact();
    const { mutateAsync: deleteContactMut, isPending: isDeleting } = useDeleteContact();
    const { mutateAsync: importContactsMut, isPending: importing } = useImportContacts();

    // Lógica de filtrado local (sesgada por la página actual de la API)
    const filteredContacts = contacts.filter(c =>
        (c.nombre || "").toLowerCase().includes(filter.toLowerCase()) ||
        (c.tag || "").toLowerCase().includes(filter.toLowerCase()) ||
        (c.celular || "").includes(filter) ||
        (c.email || "").toLowerCase().includes(filter.toLowerCase()) ||
        (c.dni || "").includes(filter)
    );

    // --- ACCIONES DE CONTACTO ---

    const handleAddClick = () => {
        setCurrentContact({ nombre: '', celular: '', email: '', dni: '', tag: 'manual' });
        setIsEditModalOpen(true);
    };

    const handleEditClick = (contact) => {
        setCurrentContact(contact);
        setIsEditModalOpen(true);
    };

    const handleSaveContact = async (formData) => {
        setSaveContactStatus(null);
        try {
            await saveContactMut(formData);
            setSaveContactStatus('success');
            setTimeout(() => {
                setIsEditModalOpen(false);
                setSaveContactStatus(null);
            }, 1000);
        } catch (error) {
            alert("Error al guardar: verifique si el celular ya existe.");
            setSaveContactStatus('error');
            setTimeout(() => setSaveContactStatus(null), 2000);
        }
    };

    const handleDeleteRequest = (contact) => {
        setCurrentContact(contact);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteContactMut(currentContact.id);
            setIsConfirmModalOpen(false);
        } catch (error) {
            alert("Error al eliminar.");
        }
    };

    const handleViewOrigin = (respuestaId) => {
        setOriginResponseId(respuestaId);
    };

    // --- IMPORTACIÓN Y EXPORTACIÓN ---
    const { mutateAsync: exportContactsMut, isPending: downloading } = useExportContacts();
    const { mutateAsync: exportContactsExcelMut, isPending: downloadingExcel } = useExportContactsExcel();

    const handleImportContacts = async (e) => {
        e.preventDefault();
        if (!importData) return;
        setImportStatus(null);
        try {
            const formData = new FormData();
            formData.append('file', importData);
            formData.append('tag', importTag);

            const result = await importContactsMut(formData);

            alert(result.message);
            setImportStatus('success');
            setTimeout(() => {
                setIsImportModalOpen(false);
                setImportData(null);
                setImportStatus(null);
            }, 1000);
        } catch (error) {
            alert("Error en la importación.");
            setImportStatus('error');
            setTimeout(() => setImportStatus(null), 2000);
        }
    };

    const handleDownload = async () => {
        setExportStatus(null);
        try {
            const params = { search: filter };
            const response = await exportContactsMut(params);

            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);

            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.setAttribute('download', `contactos_${new Date().toISOString().slice(0, 10)}.zip`);
            document.body.appendChild(anchor);
            anchor.click();

            anchor.parentNode.removeChild(anchor);
            window.URL.revokeObjectURL(url);

            setExportStatus('success');
            setTimeout(() => setExportStatus(null), 2000);
        } catch (error) {
            console.error("Error al exportar contactos:", error);
            alert("Ocurrió un error al intentar generar el archivo exportado.");
            setExportStatus('error');
            setTimeout(() => setExportStatus(null), 2000);
        }
    };

    const handleDownloadExcel = async () => {
        setIsExportMenuOpen(false);
        setExportStatus(null);
        try {
            const params = { search: filter };
            const response = await exportContactsExcelMut(params);

            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);

            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.setAttribute('download', `contactos_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(anchor);
            anchor.click();

            anchor.parentNode.removeChild(anchor);
            window.URL.revokeObjectURL(url);

            setExportStatus('success');
            setTimeout(() => setExportStatus(null), 2000);
        } catch (error) {
            console.error("Error al exportar contactos a Excel:", error);
            alert("Ocurrió un error al intentar generar el archivo Excel exportado.");
            setExportStatus('error');
            setTimeout(() => setExportStatus(null), 2000);
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-brand-blue" /></div>;

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 bg-surface-primary text-content-primary min-h-screen">

            {/* --- HEADER DESNUDO (ESTILO SIN CARD) --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-surface-secondary rounded-full transition-colors text-content-secondary"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-black tracking-tight">Agenda de Seguimiento</h1>
                        {surveyName && (
                            <p className="text-content-secondary text-[10px] font-black uppercase tracking-widest mt-0.5">
                                {surveyName}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-secondary border border-border-base rounded-xl font-bold text-sm hover:bg-surface-tertiary transition-all"
                    >
                        <Upload size={18} /> Importar
                    </button>
                    <button
                        onClick={handleAddClick}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-blue text-white rounded-xl shadow-lg shadow-blue-900/20 font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Plus size={18} /> Nuevo
                    </button>
                </div>
            </div>

            {/* --- TOOLBAR --- */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
                <div className="md:col-span-8 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-secondary" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, tag, celular..."
                        className="w-full pl-12 pr-4 py-3 bg-surface-secondary border border-border-base rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none font-medium transition-all"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <div className="md:col-span-4 relative flex flex-col items-end">
                    <button
                        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                        disabled={downloading || downloadingExcel}
                        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-md hover:bg-emerald-700 disabled:opacity-50 transition-all"
                    >
                        <div className="flex items-center gap-2">
                            {downloading || downloadingExcel ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                            {downloading ? "Exportando CSV..." : downloadingExcel ? "Exportando Excel..." : "Exportar"}
                        </div>
                        <ChevronDown size={18} className={`transition-transform ${isExportMenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isExportMenuOpen && (
                        <div className="absolute top-14 left-0 w-full bg-surface-primary border border-border-base rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <button
                                onClick={handleDownload}
                                className="w-full text-left px-4 py-3 text-sm font-bold text-content-primary hover:bg-surface-secondary transition-colors border-b border-border-base flex items-center gap-3"
                            >
                                <Users size={16} className="text-content-secondary" />
                                Exportar Google Contacts (.csv)
                            </button>
                            <button
                                onClick={handleDownloadExcel}
                                className="w-full text-left px-4 py-3 text-sm font-bold text-content-primary hover:bg-surface-secondary transition-colors flex items-center gap-3"
                            >
                                <LayoutGrid size={16} className="text-content-secondary" />
                                Exportar Reporte Excel (.xlsx)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- LISTA DE CONTACTOS RESPONSIVA --- */}

            {/* MÓVIL: Vista de Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredContacts.map(c => (
                    <Card key={c.id || c.celular} className="p-4 border-border-base bg-surface-primary shadow-sm flex flex-col gap-4">
                        {/* Fila 1: Nombre y Teléfono */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 shrink-0 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center font-black border border-brand-blue/10">
                                {c.nombre?.charAt(0).toUpperCase() || <User size={18} />}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-content-primary truncate">{c.nombre || "Sin nombre"}</h3>
                                <p className="text-xs text-content-secondary font-mono font-bold">{c.celular}</p>
                            </div>
                        </div>

                        {/* Fila 2: Botones de acciones */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border-base/50">
                            {c.primera_respuesta_id && (
                                <button
                                    onClick={() => handleViewOrigin(c.primera_respuesta_id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm transition-all"
                                    title="Ver Respuesta Original"
                                >
                                    <ClipboardList size={14} />
                                    Origen
                                </button>
                            )}
                            <div className="flex gap-1 ml-auto">
                                <button onClick={() => handleEditClick(c)} className="p-2 text-content-secondary hover:text-brand-blue bg-surface-secondary rounded-lg transition-colors border border-border-base">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDeleteRequest(c)} className="p-2 text-red-500 hover:text-red-600 bg-red-50 rounded-lg transition-colors border border-red-100">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Fila 3: Comunicación (WhatsApp y QR) */}
                        <div className="flex gap-2">
                            <a
                                href={`https://wa.me/${c.celular?.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                            >
                                <MessageCircle size={18} />
                            </a>
                            <WhatsAppQRButton phoneNumber={c.celular} name={c.nombre} />
                        </div>

                        {/* Fila 4: Tags */}
                        <div className="flex flex-wrap gap-1">
                            {(c.tag ? c.tag.split(',') : ['General']).map((t, i) => (
                                <span key={i} className="px-2.5 py-1 bg-surface-secondary rounded-lg text-[10px] font-black uppercase tracking-widest text-content-secondary flex items-center gap-1.5 border border-border-base">
                                    {i === 0 && <Tag size={10} />}
                                    {t.trim()}
                                </span>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>

            {/* ESCRITORIO: Tabla Clásica */}
            <div className="hidden md:block">
                <Card className="!p-0 overflow-hidden border-border-base shadow-xl rounded-2xl bg-surface-primary">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-secondary/50 border-b border-border-base text-[10px] font-black text-content-secondary uppercase tracking-widest">
                                <th className="p-4 pl-6">Nombre</th>
                                <th className="p-4">Teléfono / WhatsApp</th>
                                <th className="p-4">Etiqueta</th>
                                <th className="p-4 text-right pr-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-base">
                            {filteredContacts.map(c => (
                                <tr key={c.id} className="hover:bg-brand-blue/5 transition-colors group">
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-brand-blue/10 text-brand-blue rounded-lg flex items-center justify-center font-black text-xs border border-brand-blue/10">
                                                {c.nombre?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-sm text-content-primary">{c.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-sm font-bold text-content-primary">{c.celular}</span>
                                            <div className="flex items-center gap-1">
                                                <a
                                                    href={`https://wa.me/${c.celular?.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors"
                                                >
                                                    <MessageCircle size={14} />
                                                </a>
                                                <WhatsAppQRButton phoneNumber={c.celular} name={c.nombre} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(c.tag ? c.tag.split(',') : ['General']).map((t, i) => (
                                                <span key={i} className="px-2 py-1 bg-surface-secondary rounded-lg text-[10px] font-black uppercase tracking-wider text-content-secondary border border-border-base">
                                                    {t.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right pr-6 space-x-1">
                                        {c.primera_respuesta_id && (
                                            <button
                                                onClick={() => handleViewOrigin(c.primera_respuesta_id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm transition-all mr-1"
                                                title="Ver Respuesta Original"
                                            >
                                                <ClipboardList size={14} />
                                                Origen
                                            </button>
                                        )}
                                        <button onClick={() => handleEditClick(c)} className="p-2 text-content-secondary hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-all"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteRequest(c)} className="p-2 text-content-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>

            {/* --- MODALES --- */}

            <ContactEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveContact}
                contact={currentContact}
                saving={saving}
                saveStatus={saveContactStatus}
            />

            <AlertDialog open={isConfirmModalOpen} onOpenChange={(open) => !open && setIsConfirmModalOpen(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {`Estás borrando a ${currentContact?.nombre}. Esta acción no se puede deshacer.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal de Importación (Simplificado e integrado) */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-surface-primary border border-border-base rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-border-base flex justify-between items-center bg-surface-secondary/50">
                            <h2 className="text-lg font-black text-content-primary">Importar CSV</h2>
                            <button onClick={() => setIsImportModalOpen(false)} className="text-content-secondary hover:text-content-primary"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleImportContacts} className="p-6 space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-content-secondary uppercase tracking-widest mb-1.5 ml-1">Etiqueta del lote</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-surface-secondary border border-border-base rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none text-content-primary font-bold text-sm"
                                    value={importTag}
                                    onChange={(e) => setImportTag(e.target.value)}
                                    placeholder="ej: relevamiento-2026"
                                />
                            </div>
                            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-border-base border-dashed rounded-2xl cursor-pointer bg-surface-secondary/30 hover:bg-surface-secondary/50 transition-all">
                                <Upload className="w-8 h-8 mb-3 text-content-secondary" />
                                <p className="text-sm text-content-primary font-bold">Seleccionar archivo CSV</p>
                                <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && setImportData(e.target.files[0])} />
                                {importData && <p className="text-xs text-emerald-500 mt-2 font-black uppercase tracking-tighter">{importData.name}</p>}
                            </label>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsImportModalOpen(false)} className="flex-1 px-4 py-3 border border-border-base rounded-xl text-content-secondary font-bold text-sm">Cancelar</button>
                                <MyButton
                                    type="submit"
                                    disabled={importing || !importData}
                                    status={importing ? 'loading' : importStatus}
                                    defaultText="Importar"
                                    loadingText="Importando..."
                                    successText="Importado"
                                    errorText="Error"
                                    defaultIcon={<Upload size={18} />}
                                    className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Respuesta de Origen */}
            {(originResponse || loadingOrigin) && (
                <div className="fixed top-0 right-0 bottom-0 left-0 lg:left-20 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 pt-16 md:p-6 animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl relative h-full max-h-screen md:max-h-[90vh]">
                        <SurveyResponseDetailCard
                            respuesta={originResponse}
                            isLoading={loadingOrigin}
                            onBack={() => setOriginResponseId(null)}
                        />
                    </div>
                </div>
            )}

        </div>
    );
};

export default ContactViewerPage;