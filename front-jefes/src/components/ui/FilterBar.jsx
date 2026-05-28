import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Calendar, MapPin, CheckCircle2, X, Trash2 } from 'lucide-react';
import Card from './Card';
import MyButton from './MyButton';

const FilterBar = ({
    onApply,
    showLocation = false,
    sections = [],
    users = [],
    initialFilters = {}
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempFilters, setTempFilters] = useState({
        seccion: "",
        barrio: "",
        usuario: "",
        fecha_desde: "",
        fecha_hasta: "",
        ...initialFilters
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    const activeFiltersCount = useMemo(() => {
        return Object.values(tempFilters).filter(v => v !== "").length;
    }, [tempFilters]);

    const sectionNames = useMemo(() => sections?.map(s => s.nombre) || [], [sections]);

    const currentBarrios = useMemo(() => {
        if (!showLocation || !sections) return [];
        if (!tempFilters.seccion) {
            const allBarrios = sections.flatMap(s => s.barrios ? s.barrios.map(b => b.nombre) : []);
            return [...new Set(allBarrios)].sort();
        }
        const selectedSecObj = sections.find(s => s.nombre === tempFilters.seccion);
        return selectedSecObj?.barrios?.map(b => b.nombre).sort() || [];
    }, [sections, tempFilters.seccion, showLocation]);

    const handleApply = () => {
        const cleanFilters = Object.fromEntries(
            Object.entries(tempFilters).filter(([_, v]) => v !== "")
        );
        onApply(cleanFilters);
        setIsOpen(false);
    };

    const handleResetAll = () => {
        const cleared = { seccion: "", barrio: "", usuario: "", fecha_desde: "", fecha_hasta: "" };
        setTempFilters(cleared);
        onApply({});
        setIsOpen(false);
    };

    return (
        <>
            {/* BOTÓN DISPARADOR */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => setIsOpen(true)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border shadow-sm ${activeFiltersCount > 0
                            ? 'bg-brand-blue/5 border-brand-blue text-brand-blue'
                            : 'bg-surface-primary border-border-base text-content-secondary hover:border-content-secondary shadow-none'
                        }`}
                >
                    <Filter size={14} />
                    <span>Filtros</span>
                    {activeFiltersCount > 0 && (
                        <span className="bg-brand-blue text-white min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[9px]">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
            </div>

            {/* MODAL (OVERLAY) */}
            {isOpen && (
                /* lg:pl-20 es lo que lo centra respecto al contenido, ignorando la sidebar */
                <div className="fixed inset-0 z-[999] flex items-center justify-center lg:pl-20 p-4 transition-all">

                    {/* Backdrop - Oscurece toda la pantalla (incluida la sidebar) */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* CARD - Centrada en el espacio de trabajo */}
                    <div className="relative w-full max-w-lg animate-in zoom-in-95 fade-in duration-200">
                        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-none bg-surface-primary !p-0 overflow-hidden ring-1 ring-black/5">

                            {/* Header */}
                            <div className="p-6 border-b border-border-base/50 flex items-center justify-between bg-surface-secondary/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-blue/10 rounded-lg text-brand-blue">
                                        <Filter size={20} />
                                    </div>
                                    <h3 className="font-black uppercase tracking-widest text-xs text-content-primary">Configurar Filtros</h3>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-surface-secondary rounded-full text-content-secondary transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Cuerpo */}
                            <div className="p-8 space-y-6">
                                {/* Filtro Usuario */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-content-secondary uppercase tracking-widest ml-1">Cargado por</label>
                                    <select
                                        className="w-full bg-surface-secondary border border-border-base rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none cursor-pointer"
                                        value={tempFilters.usuario}
                                        onChange={(e) => setTempFilters({ ...tempFilters, usuario: e.target.value })}
                                    >
                                        <option value="">Todos los usuarios</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.first_name ? `${u.first_name} ${u.last_name}` : u.username}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Ubicación */}
                                {showLocation && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-content-secondary uppercase tracking-widest ml-1">Sección</label>
                                            <select
                                                className="w-full bg-surface-secondary border border-border-base rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none cursor-pointer"
                                                value={tempFilters.seccion}
                                                onChange={(e) => setTempFilters({ ...tempFilters, seccion: e.target.value, barrio: "" })}
                                            >
                                                <option value="">Todas</option>
                                                {sectionNames.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-content-secondary uppercase tracking-widest ml-1">Barrio</label>
                                            <select
                                                className="w-full bg-surface-secondary border border-border-base rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none cursor-pointer"
                                                value={tempFilters.barrio}
                                                onChange={(e) => setTempFilters({ ...tempFilters, barrio: e.target.value })}
                                            >
                                                <option value="">Todos</option>
                                                {currentBarrios.map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Fechas */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-content-secondary uppercase tracking-widest ml-1">Rango de Fecha</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="date"
                                            className="w-full bg-surface-secondary border border-border-base rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 color-scheme-dark shadow-none"
                                            value={tempFilters.fecha_desde}
                                            onChange={(e) => setTempFilters({ ...tempFilters, fecha_desde: e.target.value })}
                                        />
                                        <input
                                            type="date"
                                            className="w-full bg-surface-secondary border border-border-base rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 color-scheme-dark shadow-none"
                                            value={tempFilters.fecha_hasta}
                                            onChange={(e) => setTempFilters({ ...tempFilters, fecha_hasta: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 bg-surface-secondary/30 border-t border-border-base/50 flex items-center justify-between">
                                <button
                                    onClick={handleResetAll}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-all"
                                >
                                    <Trash2 size={14} />
                                    <span>Limpiar</span>
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-content-secondary hover:bg-surface-secondary transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                    <MyButton
                                        onClick={handleApply}
                                        className="!w-auto bg-brand-blue text-white px-8 py-2.5 rounded-xl shadow-lg shadow-blue-900/20 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest"
                                    >
                                        <CheckCircle2 size={18} />
                                        Aplicar
                                    </MyButton>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </>
    );
};

export default FilterBar;