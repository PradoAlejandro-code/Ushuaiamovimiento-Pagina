import React, { useState } from 'react';
import { useBirthdaysList, useDeliverBirthday } from '../../queries/useBirthdays';
import Card from '../ui/CustomCard';
import { Cake, Gift, Phone, MapPin, CreditCard, ChevronDown, ChevronUp, User, ShieldCheck, ShieldAlert, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BirthdayList = ({ currentUser }) => {
    const [expandedId, setExpandedId] = useState(null);
    const [deliveringIds, setDeliveringIds] = useState(new Set());
    const [localDeliveredIds, setLocalDeliveredIds] = useState(new Set());
    const [selectedPersonForDelivery, setSelectedPersonForDelivery] = useState(null);
    const [observationText, setObservationText] = useState('');

    // Fetch Birthdays using React Query
    const { data: birthdaysData, isLoading: loading } = useBirthdaysList('today');
    const birthdays = birthdaysData?.results || birthdaysData || [];

    // Deliver Mutation
    const { mutateAsync: sendDelivery } = useDeliverBirthday();

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleMarkDelivered = async (personId, observacion = '') => {
        setDeliveringIds(prev => {
            const next = new Set(prev);
            next.add(personId);
            return next;
        });

        try {
            await sendDelivery({ personId, observacion });
            
            // Marcamos como entregado localmente para disparar la animación de salida
            setLocalDeliveredIds(prev => {
                const next = new Set(prev);
                next.add(personId);
                return next;
            });
        } catch (err) {
            console.error("Error marking birthday as delivered:", err);
            alert("No se pudo marcar como entregado. Inténtalo de nuevo.");
        } finally {
            setDeliveringIds(prev => {
                const next = new Set(prev);
                next.delete(personId);
                return next;
            });
        }
    };

    const handleConfirmDelivery = () => {
        if (!selectedPersonForDelivery) return;
        const personId = selectedPersonForDelivery.id;
        setSelectedPersonForDelivery(null);
        handleMarkDelivered(personId, observationText);
    };

    // Filtramos para mostrar únicamente los cumpleaños que están asignados al empleado actual y no han sido entregados
    const assignedToMeAndNotDelivered = birthdays.filter(person => {
        const assignment = person.asignacion_actual;
        const isAssignedToMe = assignment && currentUser && Number(assignment.empleado_id) === Number(currentUser.id);
        const isNotDelivered = assignment && !assignment.entregado && !localDeliveredIds.has(person.id);
        return isAssignedToMe && isNotDelivered;
    });

    return (
        <div className="w-full space-y-4 max-w-md mx-auto">
            {/* Header / Title */}
            <div className="flex items-center gap-3 mb-2 px-1">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                    <Cake size={20} className="animate-pulse" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-content-primary">Calendario de Cumpleaños</h3>
                    <p className="text-[10px] text-content-secondary uppercase tracking-widest font-black">Visitas de Hoy</p>
                </div>
            </div>

            {/* Content List with Framer Motion AnimatePresence */}
            <div className="space-y-3 min-h-[250px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
                        <span className="text-xs text-content-secondary font-bold uppercase tracking-wider animate-pulse">Cargando visitas...</span>
                    </div>
                ) : assignedToMeAndNotDelivered.length === 0 ? (
                    <div className="text-center py-16 text-content-secondary bg-surface-primary/50 backdrop-blur-sm rounded-3xl border border-dashed border-border-base flex flex-col items-center justify-center px-4">
                        <Gift size={40} className="mb-2 opacity-25 text-content-secondary animate-pulse" />
                        <p className="text-xs font-bold uppercase tracking-wider">Sin visitas pendientes</p>
                        <p className="text-[10px] opacity-70 mt-1 max-w-[220px]">¡Buen trabajo! No tienes cumpleaños asignados pendientes de entrega para hoy.</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {assignedToMeAndNotDelivered.map((person) => {
                            const isExpanded = expandedId === person.id;
                            const isDelivering = deliveringIds.has(person.id);

                            return (
                                <motion.div
                                    key={person.id}
                                    layout
                                    initial={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -20, height: 0, marginBottom: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="group overflow-hidden rounded-2xl border border-emerald-500/40 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.04] shadow-[0_0_15px_rgba(16,185,129,0.04)] transition-all duration-300"
                                >
                                    {/* Header del Cumpleañero */}
                                    <div
                                        onClick={() => toggleExpand(person.id)}
                                        className="p-4 flex items-center justify-between cursor-pointer select-none"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2.5 rounded-xl shrink-0 bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-105">
                                                <User size={18} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[13px] font-black text-content-primary uppercase truncate leading-tight">
                                                    {person.last_name} {person.first_name}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {person.age && (
                                                        <span className="text-[10px] font-black uppercase text-content-secondary bg-surface-secondary px-1.5 py-0.5 rounded border border-border-base">
                                                            {person.age} Años
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {isExpanded ? (
                                                <ChevronUp size={16} className="text-content-secondary transition-transform duration-200" />
                                            ) : (
                                                <ChevronDown size={16} className="text-content-secondary transition-transform duration-200" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Contenido Expandible */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                                className="border-t border-border-base/50"
                                            >
                                                <div className="p-4 bg-surface-secondary/20 space-y-3 text-xs text-content-primary">
                                                    {/* Grid de Datos */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="p-2 bg-surface-secondary/40 rounded-xl border border-border-base/30">
                                                            <span className="text-[8px] font-black uppercase tracking-wider text-content-secondary block mb-0.5">DNI</span>
                                                            <span className="font-bold flex items-center gap-1.5"><CreditCard size={12} className="opacity-50" /> {person.dni || 'S/D'}</span>
                                                        </div>
                                                        <div className="p-2 bg-surface-secondary/40 rounded-xl border border-border-base/30">
                                                            <span className="text-[8px] font-black uppercase tracking-wider text-content-secondary block mb-0.5">Teléfono</span>
                                                            {person.phone ? (
                                                                <a href={`tel:${person.phone}`} className="font-bold text-brand-blue flex items-center gap-1.5 hover:underline"><Phone size={12} className="opacity-50" /> {person.phone}</a>
                                                            ) : (
                                                                <span className="font-bold flex items-center gap-1.5"><Phone size={12} className="opacity-50" /> S/D</span>
                                                            )}
                                                        </div>
                                                        <div className="col-span-2 p-2 bg-surface-secondary/40 rounded-xl border border-border-base/30">
                                                            <span className="text-[8px] font-black uppercase tracking-wider text-content-secondary block mb-0.5">Domicilio</span>
                                                            <span className="font-bold flex items-center gap-1.5 truncate" title={person.address || 'S/D'}><MapPin size={12} className="opacity-50 shrink-0" /> {person.address || 'S/D'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Detalle de Afiliación */}
                                                    <div className="flex items-center p-2.5 rounded-xl border border-border-base/30 bg-surface-primary/50 text-[10px] font-black uppercase tracking-wider">
                                                        <div className="flex items-center gap-1.5">
                                                            {person.is_affiliate ? (
                                                                <>
                                                                    <ShieldCheck size={14} className="text-emerald-500" />
                                                                    <span className="text-emerald-600 dark:text-emerald-400">Afiliado</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ShieldAlert size={14} className="text-red-500" />
                                                                    <span className="text-red-600 dark:text-red-400">No Afiliado</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* BOTÓN ENTREGAR REGALO */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedPersonForDelivery({
                                                                id: person.id,
                                                                name: `${person.last_name} ${person.first_name}`
                                                            });
                                                            setObservationText('');
                                                        }}
                                                        disabled={isDelivering}
                                                        className="w-full mt-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-600/50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                                                    >
                                                        {isDelivering ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <Check size={14} strokeWidth={3} />
                                                        )}
                                                        <span>{isDelivering ? 'Registrando...' : 'Marcar como Entregado'}</span>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
            {/* Modal de Observaciones de Entrega */}
            <AnimatePresence>
                {selectedPersonForDelivery && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div 
                            className="absolute inset-0" 
                            onClick={() => setSelectedPersonForDelivery(null)}
                        />
                        
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="relative w-full max-w-sm bg-surface-primary border border-border-base rounded-3xl p-5 shadow-2xl z-10 flex flex-col gap-4 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                                    <Gift size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-content-primary">Confirmar Entrega</h4>
                                    <p className="text-[10px] text-content-secondary uppercase font-black tracking-widest mt-0.5">Visitas de Hoy</p>
                                </div>
                            </div>

                            <div className="text-xs text-content-secondary leading-relaxed bg-surface-secondary/40 p-3 rounded-2xl border border-border-base/50">
                                ¿Deseas agregar alguna observación o detalle sobre la entrega a <strong className="text-content-primary uppercase">{selectedPersonForDelivery.name}</strong>?
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-black uppercase tracking-wider text-content-secondary">Observaciones (Opcional)</label>
                                <textarea
                                    value={observationText}
                                    onChange={(e) => setObservationText(e.target.value)}
                                    placeholder="Ej. Se entregó en mano, se dejó con un familiar, etc..."
                                    rows={3}
                                    className="w-full p-3 bg-surface-secondary border border-border-base rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-xs text-content-primary font-bold transition-all resize-none"
                                />
                            </div>

                            <div className="flex gap-2.5 mt-2">
                                <button
                                    onClick={() => setSelectedPersonForDelivery(null)}
                                    className="flex-1 py-3 bg-surface-secondary hover:bg-surface-tertiary border border-border-base rounded-xl text-xs font-black uppercase tracking-wider text-content-secondary transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmDelivery}
                                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 active:scale-98 cursor-pointer"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BirthdayList;
