import React, { useState, useEffect, useMemo } from 'react';
import { Filter, CheckCircle2, X, Trash2, ChevronDown } from 'lucide-react';
import Card from './Card';
import MyButton from './MyButton';

// Componente genérico para dropdowns multi-select
const CustomMultiSelect = ({ label, options, selectedOptions, onChange, onClear, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="space-y-2 relative">
            <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-black text-content-secondary uppercase tracking-widest ml-1">{label}</label>
                {selectedOptions.length > 0 && (
                    <button type="button" onClick={onClear} className="text-[9px] text-brand-blue font-bold uppercase hover:underline">Limpiar</button>
                )}
            </div>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-surface-secondary border border-border-base rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer text-left transition-colors"
                title={selectedOptions.join(', ')}
            >
                <div className="truncate pr-4 text-content-primary flex-1">
                    {selectedOptions.length > 0
                        ? `${selectedOptions.length} seleccionado(s) (${selectedOptions.slice(0, 2).join(', ')}${selectedOptions.length > 2 ? '...' : ''})`
                        : placeholder}
                </div>
                <ChevronDown size={16} className={`text-content-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Overlay invisible para cerrar el dropdown al hacer clic fuera */}
                    <div className="fixed object-cover inset-0 z-[40]" onClick={() => setIsOpen(false)}></div>

                    {/* Menú desplegable flotante */}
                    <div className="absolute z-[50] top-[100%] left-0 right-0 mt-2 bg-surface-primary border border-border-base rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-60 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                        {options.length === 0 ? (
                            <span className="text-xs text-content-secondary p-4 block text-center">No hay opciones listadas</span>
                        ) : (
                            options.map(opt => (
                                <label key={opt} className="flex items-center gap-3 p-2.5 hover:bg-surface-secondary rounded-lg cursor-pointer transition-colors w-full group">
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedOptions.includes(opt)}
                                        onChange={() => onChange(opt)}
                                    />
                                    <div className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedOptions.includes(opt) ? 'bg-brand-blue border-brand-blue text-white' : 'border-content-secondary/30 bg-surface-primary group-hover:border-brand-blue/50'}`}>
                                        {selectedOptions.includes(opt) && <CheckCircle2 size={12} />}
                                    </div>
                                    <span className={`text-sm font-bold truncate transition-colors ${selectedOptions.includes(opt) ? 'text-brand-blue' : 'text-content-primary'}`}>{opt}</span>
                                </label>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const MultiSelectFilterBar = ({
    onApply,
    showLocation = false,
    sections = [],
    users = [],
    initialFilters = {}
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Convertimos los filtros iniciales en arreglos si no lo son
    const [tempFilters, setTempFilters] = useState({
        seccion: Array.isArray(initialFilters.seccion) ? initialFilters.seccion : (initialFilters.seccion ? [initialFilters.seccion] : []),
        barrio: Array.isArray(initialFilters.barrio) ? initialFilters.barrio : (initialFilters.barrio ? [initialFilters.barrio] : []),
        usuario: initialFilters.usuario || "",
        fecha_desde: initialFilters.fecha_desde || "",
        fecha_hasta: initialFilters.fecha_hasta || ""
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (tempFilters.seccion.length > 0) count += 1;
        if (tempFilters.barrio.length > 0) count += 1;
        if (tempFilters.usuario !== "") count += 1;
        if (tempFilters.fecha_desde !== "" || tempFilters.fecha_hasta !== "") count += 1;
        return count;
    }, [tempFilters]);

    const sectionNames = useMemo(() => sections?.map(s => s.nombre) || [], [sections]);

    const currentBarrios = useMemo(() => {
        if (!showLocation || !sections) return [];
        if (tempFilters.seccion.length === 0) {
            const allBarrios = sections.flatMap(s => s.barrios ? s.barrios.map(b => b.nombre) : []);
            return [...new Set(allBarrios)].sort();
        }
        const selectedSecObjs = sections.filter(s => tempFilters.seccion.includes(s.nombre));
        const filteredBarrios = selectedSecObjs.flatMap(s => s.barrios ? s.barrios.map(b => b.nombre) : []);
        return [...new Set(filteredBarrios)].sort();
    }, [sections, tempFilters.seccion, showLocation]);

    const toggleSelection = (type, value) => {
        setTempFilters(prev => {
            const array = prev[type];
            const newArray = array.includes(value) ? array.filter(item => item !== value) : [...array, value];

            // Si deseleccionamos todas las secciones, limpiamos los barrios pre-seleccionados para evitar cruces
            if (type === 'seccion' && newArray.length === 0) {
                return { ...prev, [type]: newArray, barrio: [] };
            }
            return { ...prev, [type]: newArray };
        });
    };

    const handleApply = () => {
        const cleanFilters = {};
        if (tempFilters.seccion.length > 0) cleanFilters.seccion = tempFilters.seccion;
        if (tempFilters.barrio.length > 0) cleanFilters.barrio = tempFilters.barrio;
        if (tempFilters.usuario) cleanFilters.usuario = tempFilters.usuario;
        if (tempFilters.fecha_desde) cleanFilters.fecha_desde = tempFilters.fecha_desde;
        if (tempFilters.fecha_hasta) cleanFilters.fecha_hasta = tempFilters.fecha_hasta;

        onApply(cleanFilters);
        setIsOpen(false);
    };

    const handleResetAll = () => {
        const cleared = { seccion: [], barrio: [], usuario: "", fecha_desde: "", fecha_hasta: "" };
        setTempFilters(cleared);
        onApply({});
        setIsOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`flex w-full items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-black text-sm transition-all border shadow-sm ${activeFiltersCount > 0
                    ? 'bg-brand-blue/5 border-brand-blue text-brand-blue'
                    : 'bg-surface-primary border-border-base text-content-secondary hover:border-content-secondary shadow-none'
                    }`}
            >
                <Filter size={18} />
                <span>Filtro</span>
                {activeFiltersCount > 0 && (
                    <span className="bg-brand-blue text-white min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[9px]">
                        {activeFiltersCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center lg:pl-20 p-4 transition-all">
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="relative w-full max-w-2xl animate-in zoom-in-95 fade-in duration-200">
                        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-none bg-surface-primary !p-0 overflow-visible ring-1 ring-black/5 flex flex-col max-h-[90vh]">

                            <div className="p-6 border-b border-border-base/50 flex items-center justify-between bg-surface-secondary/20 flex-shrink-0 rounded-t-2xl relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-blue/10 rounded-lg text-brand-blue">
                                        <Filter size={20} />
                                    </div>
                                    <h3 className="font-black uppercase tracking-widest text-xs text-content-primary">Configurar Filtros Avanzados</h3>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-surface-secondary rounded-full text-content-secondary transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6 overflow-visible relative">
                                <div className="space-y-2 relative z-10">
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

                                {showLocation && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-30">
                                        <CustomMultiSelect
                                            label="Secciones (Múltiple)"
                                            placeholder="Seleccionar secciones"
                                            options={sectionNames}
                                            selectedOptions={tempFilters.seccion}
                                            onChange={(val) => toggleSelection('seccion', val)}
                                            onClear={() => setTempFilters({ ...tempFilters, seccion: [], barrio: [] })}
                                        />

                                        <CustomMultiSelect
                                            label="Barrios (Múltiple)"
                                            placeholder="Seleccionar barrios"
                                            options={currentBarrios}
                                            selectedOptions={tempFilters.barrio}
                                            onChange={(val) => toggleSelection('barrio', val)}
                                            onClear={() => setTempFilters({ ...tempFilters, barrio: [] })}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2 relative z-10">
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

                            <div className="p-6 bg-surface-secondary/30 border-t border-border-base/50 flex flex-col sm:flex-row gap-4 sm:gap-0 items-center justify-between flex-shrink-0 rounded-b-2xl relative z-10">
                                <button
                                    onClick={handleResetAll}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-all w-full sm:w-auto justify-center"
                                >
                                    <Trash2 size={14} />
                                    <span>Limpiar</span>
                                </button>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-content-secondary hover:bg-surface-secondary transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                    <MyButton
                                        onClick={handleApply}
                                        className="!w-auto flex-1 md:flex-none bg-brand-blue text-white px-8 py-2.5 rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 text-[10px] uppercase font-black tracking-widest"
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

export default MultiSelectFilterBar;
