import React, { useState } from 'react';
import { Gift, Eye, User, CreditCard, Phone, Mail, Calendar, Briefcase, MapPin, ShieldCheck, ShieldAlert } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const BirthdayCard = ({ title, people = [], className = "" }) => {
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewDetail = (person) => {
        setSelectedPerson(person);
        setIsModalOpen(true);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'S/D';
        try {
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateStr;
        }
    };

    const InfoItem = ({ label, value, icon: Icon }) => (
        <div className="p-3 bg-surface-secondary/50 rounded-xl border border-border-base/50 flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-1 text-content-tertiary">
                <Icon size={12} className="shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-sm font-bold text-content-primary truncate" title={value || 'S/D'}>
                {value || 'S/D'}
            </p>
        </div>
    );

    return (
        <div className={`bg-surface-secondary border border-border-base rounded-2xl p-5 flex flex-col min-h-0 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-blue/10 rounded-lg">
                        <Gift size={18} className="text-brand-blue" />
                    </div>
                    <h3 className="text-[13px] font-bold text-content-primary uppercase tracking-wider">{title}</h3>
                </div>
                <span className="bg-surface-secondary text-content-secondary text-[10px] font-bold px-2 py-0.5 rounded-full border border-border-base">
                    {people.length}
                </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {people.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 py-10">
                        <User size={32} className="mb-2" />
                        <p className="text-[11px] font-bold uppercase">Sin cumpleaños</p>
                    </div>
                ) : (
                    people.map((person) => (
                        <div
                            key={person.id}
                            className="flex items-center justify-between p-3 bg-surface-secondary/30 rounded-xl border border-border-base/50 hover:border-brand-blue/30 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${person.is_affiliate
                                        ? 'bg-green-500 shadow-green-500/20'
                                        : 'bg-red-500 shadow-red-500/20'
                                    }`} />

                                <div className="flex flex-col">
                                    <span className="text-[12px] font-bold text-content-primary uppercase truncate max-w-[120px]">
                                        {person.last_name}
                                    </span>
                                    <span className="text-[10px] text-content-tertiary uppercase truncate max-w-[120px]">
                                        {person.first_name}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleViewDetail(person)}
                                className="p-2 text-content-secondary hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-all"
                                title="Ver detalle"
                            >
                                <Eye size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-2xl bg-surface-primary border-border-base p-0 overflow-hidden">
                    <DialogHeader className="p-6 border-b border-border-base bg-surface-secondary/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-2xl">
                                <User size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-content-primary">Detalle de Persona</DialogTitle>
                                <p className="text-xs text-content-tertiary uppercase tracking-widest font-medium">Información Registrada</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar text-content-primary">
                        {selectedPerson && (
                            <>
                                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${selectedPerson.is_affiliate
                                        ? 'bg-green-500/10 border-green-500/20 text-green-500'
                                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                                    }`}>
                                    {selectedPerson.is_affiliate ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                                    <span className="text-sm font-bold uppercase tracking-wider">
                                        {selectedPerson.is_affiliate ? 'Afiliado' : 'No Afiliado'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <InfoItem label="Apellido" value={selectedPerson.last_name} icon={User} />
                                    <InfoItem label="Nombre" value={selectedPerson.first_name} icon={User} />
                                    <InfoItem label="DNI" value={selectedPerson.dni} icon={CreditCard} />
                                    <InfoItem label="Teléfono" value={selectedPerson.phone} icon={Phone} />
                                    <InfoItem label="Email" value={selectedPerson.email} icon={Mail} />
                                    <InfoItem label="Fecha Nac." value={formatDate(selectedPerson.birth_date)} icon={Calendar} />
                                    <InfoItem label="Profesión" value={selectedPerson.profession} icon={Briefcase} />
                                    <InfoItem label="Domicilio" value={selectedPerson.address} icon={MapPin} />
                                    <InfoItem label="Ciudad" value={selectedPerson.city} icon={MapPin} />
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BirthdayCard;