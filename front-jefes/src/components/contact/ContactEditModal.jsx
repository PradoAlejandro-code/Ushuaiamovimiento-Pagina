import React from 'react';
import { X, User, Phone, Mail, CreditCard, Tag, Save, Loader } from 'lucide-react';
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

const ContactEditModal = ({ isOpen, onClose, onSave, contact, saving, saveStatus }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = React.useState(contact);
    const [tagInputValue, setTagInputValue] = React.useState('');
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    // Convertimos la cadena separada por comas en un arreglo para renderizar visualmente
    const tagsArray = formData.tag ? formData.tag.split(',').map(t => t.trim()).filter(Boolean) : [];

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (tagInputValue.trim()) {
                const newTags = [...tagsArray, tagInputValue.trim()];
                setFormData({ ...formData, tag: newTags.join(', ') });
                setTagInputValue('');
            }
        }
    };

    const removeTag = (indexToRemove) => {
        const newTags = tagsArray.filter((_, idx) => idx !== indexToRemove);
        setFormData({ ...formData, tag: newTags.join(', ') });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsConfirmOpen(true);
    };

    const confirmSubmit = () => {
        setIsConfirmOpen(false);
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-surface-primary border border-border-base rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-border-base flex justify-between items-center bg-surface-secondary/50">
                    <h2 className="text-lg font-black text-content-primary">
                        {contact.id ? 'Editar Contacto' : 'Nuevo Contacto'}
                    </h2>
                    <button onClick={onClose} className="text-content-secondary hover:text-content-primary transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-black text-content-secondary uppercase tracking-wider mb-1.5">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 text-content-secondary" size={18} />
                                <input
                                    type="text" required
                                    className="w-full pl-10 pr-4 py-2.5 bg-surface-secondary border border-border-base rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none text-content-primary font-bold text-sm"
                                    placeholder="Juan Pérez"
                                    value={formData.nombre || ''}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-content-secondary uppercase tracking-wider mb-1.5">Celular</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 text-content-secondary" size={18} />
                                <input
                                    type="text" required
                                    className="w-full pl-10 pr-4 py-2.5 bg-surface-secondary border border-border-base rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none text-content-primary font-bold text-sm"
                                    placeholder="+54 9..."
                                    value={formData.celular || ''}
                                    onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-black text-content-secondary uppercase tracking-wider mb-1.5">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2.5 bg-surface-secondary border border-border-base rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none text-content-primary font-bold text-sm"
                                    placeholder="juan@email.com"
                                    value={formData.email || ''}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-content-secondary uppercase tracking-wider mb-1.5">DNI</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-surface-secondary border border-border-base rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none text-content-primary font-bold text-sm"
                                    placeholder="12345678"
                                    value={formData.dni || ''}
                                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-content-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Tag size={12} /> Etiquetas
                            </label>
                            <div className="w-full min-h-[46px] p-1.5 bg-surface-secondary border border-border-base rounded-xl focus-within:border-brand-blue/40 focus-within:ring-2 focus-within:ring-brand-blue/20 flex flex-wrap gap-1.5 items-center transition-all">
                                {tagsArray.map((t, idx) => (
                                    <span key={idx} className="flex items-center gap-1.5 pl-2.5 pr-2 py-1 bg-surface-primary shadow-sm rounded-lg text-xs font-black uppercase tracking-wider text-content-primary border border-border-base group">
                                        {t}
                                        <button type="button" onClick={() => removeTag(idx)} className="text-content-secondary hover:text-red-500 opacity-60 group-hover:opacity-100 transition-all bg-surface-secondary rounded-full p-0.5">
                                            <X size={12} strokeWidth={3} />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    className="flex-1 min-w-[140px] bg-transparent outline-none text-content-primary font-bold text-sm px-2 py-1 placeholder:text-content-secondary/50"
                                    placeholder={tagsArray.length === 0 ? "Escribe y presiona Enter..." : "Añadir otra etiqueta..."}
                                    value={tagInputValue}
                                    onChange={(e) => setTagInputValue(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button" onClick={onClose}
                            className="flex-1 px-4 py-3 border border-border-base rounded-xl text-content-secondary hover:bg-surface-secondary font-bold text-sm transition-all"
                        >
                            Cancelar
                        </button>
                        <MyButton
                            type="submit"
                            disabled={saving}
                            status={saving ? 'loading' : saveStatus}
                            defaultText="Guardar"
                            defaultIcon={<Save size={18} />}
                            className="flex-1 px-4 py-3 bg-brand-blue text-white rounded-xl hover:bg-blue-700 font-bold text-sm transition-all shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                </form>
            </div>

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Guardar Contacto</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro que deseas guardar este contacto?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSubmit} className="bg-brand-blue hover:bg-blue-600 shadow-blue-500/20">Sí, guardar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ContactEditModal;