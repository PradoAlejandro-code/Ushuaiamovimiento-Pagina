import React, { useState } from 'react';
import { Save, XCircle, MapPin, Trash2, User, Plus, Image as ImageIcon } from 'lucide-react';
import Card from '../ui/Card';
import MyButton from '../ui/MyButton';
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

const SurveyResponseEditCard = ({
    respuesta,
    isSaving,
    saveStatus,
    onCancel,
    onSave
}) => {
    const [edits, setEdits] = useState(() => {
        const initial = {
            seccion: respuesta.seccion || '',
            barrio: respuesta.barrio || ''
        };
        const detalles = respuesta.detalles_completos || respuesta.detalles || [];
        detalles.forEach(d => {
            initial[`p_${d.pregunta_id}`] = d.valor_texto || d.valor_numero || '';
        });
        return initial;
    });

    const [deletedMainFotos, setDeletedMainFotos] = useState([]);
    const [deletedExtraFotos, setDeletedExtraFotos] = useState([]);
    const [newPhotos, setNewPhotos] = useState([]); // Nuevas fotos seleccionadas
    const [showEmpties, setShowEmpties] = useState(false);

    // Estado para validación visual de borrado de foto
    const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
    const [confirmSaveModalOpen, setConfirmSaveModalOpen] = useState(false);
    const [photoToDelete, setPhotoToDelete] = useState(null);

    const handleRequestDeletePhoto = (photoId, isNew = false, newIndex = null) => {
        setPhotoToDelete({ id: photoId, isNew, newIndex });
        setConfirmDeleteModalOpen(true);
    };

    const confirmDeletePhoto = () => {
        if (!photoToDelete) return;

        if (photoToDelete.isNew) {
            setNewPhotos(prev => prev.filter((_, i) => i !== photoToDelete.newIndex));
        } else {
            setDeletedMainFotos(prev => [...prev, photoToDelete.id]);
        }

        setConfirmDeleteModalOpen(false);
        setPhotoToDelete(null);
    };

    const handleSaveClick = () => {
        if (isSaving) return;
        setConfirmSaveModalOpen(true);
    };

    const confirmSave = () => {
        setConfirmSaveModalOpen(false);

        // 1. Extraer Sección y Barrio
        const { seccion, barrio, ...rest } = edits;

        // 2. Transformar p_{id} a array de detalles
        const detalles = Object.entries(rest)
            .filter(([key]) => key.startsWith('p_'))
            .map(([key, value]) => ({
                pregunta_id: parseInt(key.replace('p_', ''), 10),
                valor: value
            }));

        const payload = {
            id: respuesta.id,
            seccion: seccion,
            barrio: barrio,
            detalles: detalles,
            borrar_foto_principal_ids: deletedMainFotos,
            borrar_fotos_extra_ids: deletedExtraFotos
        };

        // Si hay fotos nuevas, usamos FormData
        if (newPhotos.length > 0) {
            const formData = new FormData();
            formData.append('data', JSON.stringify(payload));

            // Buscamos el ID de la primera pregunta de tipo foto para adjuntarlas ahí
            const photoPreguntaId = (respuesta.detalles_completos || respuesta.detalles || [])
                .find(d => d.pregunta_tipo === 'foto')?.pregunta_id;

            if (photoPreguntaId) {
                newPhotos.forEach(file => {
                    formData.append(`foto_${photoPreguntaId}`, file);
                });
            } else {
                // Si no hay pregunta de foto, las mandamos como 'foto_extra'
                // El backend actual parece esperar foto_ID, así que mejor enviamos un alert o usamos un ID genérico
                // Por ahora asumimos que hay una pregunta de foto si hay una galería.
                newPhotos.forEach(file => {
                    formData.append('foto_extra', file);
                });
            }
            onSave(formData);
        } else {
            onSave(payload);
        }
    };

    const fields = [
        { id: 'seccion', label: 'Sección', isLocation: true },
        { id: 'barrio', label: 'Barrio', isLocation: true },
        ...(respuesta.detalles_completos || respuesta.detalles || []).map(d => ({
            id: `p_${d.pregunta_id}`,
            pregunta_id: d.pregunta_id,
            pregunta_tipo: d.pregunta_tipo,
            detalle_id: d.detalle_id,
            label: d.pregunta_titulo || `Pregunta #${d.pregunta_id}`,
            foto: d.valor_foto,
            fotos_extra: d.fotos_extra || []
        }))
    ];

    const visibleFields = fields.filter(field => {
        // HIDE if it is a photo question
        if (field.pregunta_tipo === 'foto') return false;

        if (showEmpties) return true;
        // Siempre mostrar campos de ubicación
        if (field.isLocation) return true;
        // Mostrar si tiene valor en `edits` (texto/num), o si tiene foto original o extra
        const hasValue = edits[field.id];
        const hasPhoto = field.foto || (field.fotos_extra && field.fotos_extra.length > 0);
        return hasValue || hasPhoto;
    });

    return (
        <Card className="!p-0 overflow-hidden border-brand-blue/30 bg-surface-primary shadow-2xl shadow-brand-blue/5 rounded-2xl flex flex-col animate-in fade-in zoom-in-95 duration-300 h-[760px] max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] w-full max-w-full ring-1 ring-brand-blue/20">
            <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 bg-brand-blue/5 border-b border-brand-blue/20 gap-4">
                <div className="flex items-center gap-4 min-w-0 max-w-full flex-1">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-surface-primary shadow-sm bg-brand-blue flex items-center justify-center text-white shrink-0">
                        {respuesta.usuario?.avatar || respuesta.usuario_foto ? <img src={respuesta.usuario?.avatar || respuesta.usuario_foto} alt="Avatar" className="w-full h-full object-cover" /> : <User size={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base md:text-lg font-black text-content-primary leading-tight truncate overflow-hidden">
                            Editando {respuesta.usuario?.nombre || respuesta.usuario_nombre || "Anónimo"}
                        </h2>
                        <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-brand-blue mt-1">
                            <span className="uppercase tracking-widest px-2 py-0.5 bg-brand-blue/10 rounded-md">Modo Edición</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <label className="flex items-center gap-2 text-xs font-bold text-content-secondary cursor-pointer bg-white px-3 py-2 rounded-lg border border-border-base hover:border-brand-blue transition-colors select-none">
                        <input
                            type="checkbox"
                            checked={showEmpties}
                            onChange={(e) => setShowEmpties(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                        />
                        Mostrar vacías
                    </label>

                    <div className="flex items-center gap-2">
                        <button onClick={onCancel} disabled={isSaving} className="flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl bg-surface-primary border border-border-base text-content-secondary hover:text-red-500 font-bold transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            <XCircle size={18} />
                        </button>
                        <MyButton
                            onClick={handleSaveClick}
                            disabled={isSaving}
                            status={isSaving ? 'loading' : saveStatus}
                            defaultText="Guardar"
                            defaultIcon={<Save size={18} />}
                            className="!w-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-white shadow-lg bg-emerald-600 shadow-emerald-900/20 font-bold hover:bg-emerald-700 transition-all active:scale-95 text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 bg-surface-primary overflow-y-auto overscroll-contain custom-scrollbar">
                <div className="flex flex-col gap-6">
                    {/* GALERÍA CENTRALIZADA EN EDICIÓN */}
                    <div className="p-4 rounded-xl border border-brand-blue/20 bg-brand-blue/5">
                        <div className="flex items-center gap-2 mb-4">
                            <ImageIcon size={18} className="text-brand-purple" />
                            <h4 className="text-sm font-black text-content-primary uppercase tracking-wide">Galería</h4>
                            <span className="text-xs font-bold px-2 py-0.5 bg-brand-purple/10 text-brand-purple rounded-full">
                                {((respuesta.fotos_agrupadas?.length || 0) - deletedMainFotos.length + newPhotos.length)} Fotos
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {/* Fotos Existentes */}
                            {(respuesta.fotos_agrupadas || []).map((foto) => {
                                if (deletedMainFotos.includes(foto.id)) return null;
                                return (
                                    <div key={foto.id} className="relative group shrink-0 overflow-hidden rounded-lg border-2 border-transparent hover:border-red-500 transition-all w-24 h-24 shadow-sm">
                                        <img src={foto.archivo} alt="Evidencia" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => handleRequestDeletePhoto(foto.id, false)}
                                            className="absolute inset-0 bg-red-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            title="Eliminar foto"
                                        >
                                            <Trash2 size={24} className="text-white drop-shadow-md" />
                                        </button>
                                    </div>
                                );
                            })}

                            {/* Nuevas Fotos (Previews) */}
                            {newPhotos.map((file, idx) => (
                                <div key={`new-${idx}`} className="relative group shrink-0 overflow-hidden rounded-lg border-2 border-brand-orange w-24 h-24 shadow-sm animate-in zoom-in-95 duration-200">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                                    />
                                    <div className="absolute top-0 right-0 p-1 bg-brand-orange text-white rounded-bl-lg font-bold text-[8px] uppercase tracking-tighter">NUEVA</div>
                                    <button
                                        onClick={() => handleRequestDeletePhoto(null, true, idx)}
                                        className="absolute inset-0 bg-red-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                        <Trash2 size={24} className="text-white drop-shadow-md" />
                                    </button>
                                </div>
                            ))}

                            {/* Botón de Carga */}
                            <label className="w-24 h-24 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-blue/30 bg-surface-primary text-brand-blue hover:bg-brand-blue/5 hover:border-brand-blue cursor-pointer transition-all active:scale-95 group">
                                <Plus size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase mt-1">Agregar</span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        setNewPhotos(prev => [...prev, ...files]);
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 content-start">
                        {visibleFields.map((field) => {
                            const isMainDeleted = deletedMainFotos.includes(field.detalle_id);
                            const extraFotosVisibles = (field.fotos_extra || []).filter(fx => !deletedExtraFotos.includes(fx.id));

                            return (
                                <div key={field.id} className="flex flex-col p-4 rounded-xl bg-surface-primary border border-brand-blue/20 shadow-sm transition-colors focus-within:border-brand-blue focus-within:ring-1 focus-within:ring-brand-blue/30">
                                    <div className="flex items-start gap-2 mb-2">
                                        {field.isLocation && <MapPin size={14} className="text-brand-orange mt-0.5 shrink-0" />}
                                        <h4 className="text-[11px] font-black text-content-secondary uppercase tracking-wider leading-relaxed">{field.label}</h4>
                                    </div>

                                    <textarea
                                        className="w-full bg-surface-secondary/20 border border-border-base rounded-lg px-3 py-2 text-sm text-content-primary focus:border-brand-blue focus:bg-surface-primary outline-none transition-all resize-none font-medium"
                                        rows={2}
                                        value={edits[field.id] || ''}
                                        onChange={(e) => setEdits({ ...edits, [field.id]: e.target.value })}
                                        placeholder="Escribir respuesta..."
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <AlertDialog open={confirmDeleteModalOpen} onOpenChange={(open) => !open && setConfirmDeleteModalOpen(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Ocultar foto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La foto desaparecerá de la vista, pero los cambios no serán permanentes hasta que hagas clic en 'Guardar'.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeletePhoto}>Sí, ocultar foto</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={confirmSaveModalOpen} onOpenChange={(open) => !open && setConfirmSaveModalOpen(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Guardar Cambios</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro que deseas guardar los cambios realizados en esta respuesta?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSave} className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20">Sí, guardar cambios</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};

export default SurveyResponseEditCard;