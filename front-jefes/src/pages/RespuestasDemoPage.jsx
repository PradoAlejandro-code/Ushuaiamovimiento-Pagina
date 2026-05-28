import React, { useState } from 'react';
import { Download, FileImage, FileSpreadsheet, ChevronDown, Hash, Filter, CheckCircle2, X, Trash2 } from 'lucide-react';
import SurveysResponsesListCard from '@/components/survey/SurveysResponsesListCard';
import SurveyStatsDashboard from '@/components/survey/SurveyStatsDashboard';

// Local CustomMultiSelect for clean embedded design inside the column card
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
                className="w-full flex items-center justify-between bg-surface-secondary border border-border-base rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer text-left transition-colors text-content-primary"
            >
                <div className="truncate pr-4 flex-1">
                    {selectedOptions.length > 0
                        ? `${selectedOptions.length} sel. (${selectedOptions.slice(0, 1).join(', ')}${selectedOptions.length > 1 ? '...' : ''})`
                        : placeholder}
                </div>
                <ChevronDown size={16} className={`text-content-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[40]" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute z-[50] top-[100%] left-0 right-0 mt-2 bg-surface-primary border border-border-base rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-60 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                        {options.map(opt => (
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
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const mockStatsData = [
    {
        id: 'participation',
        title: 'Participación por Usuario',
        type: 'bar',
        data: [
            {
                name: 'Micaela Ledesma',
                value: 55,
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80'
            },
            {
                name: 'Candela vidoni',
                value: 53,
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80'
            },
            {
                name: 'Geraldine Estefani González',
                value: 50,
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'
            },
            {
                name: 'Ariel Alejandro Salina',
                value: 45,
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80'
            },
            {
                name: 'Facundo Gómez',
                value: 41,
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80'
            },
            {
                name: 'Sofía Martínez',
                value: 36,
                avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80'
            },
            {
                name: 'Lautaro Pérez',
                value: 31,
                avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&h=100&q=80'
            },
            {
                name: 'Martina Silva',
                value: 27,
                avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&h=100&q=80'
            },
            {
                name: 'Mateo Rodríguez',
                value: 20,
                avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=100&h=100&q=80'
            },
            {
                name: 'Valentina Díaz',
                value: 13,
                avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&h=100&q=80'
            }
        ]
    },
    {
        id: 'afiliado',
        title: 'Es afiliado',
        type: 'pie',
        data: [
            { name: 'Afiliado', value: 98 },
            { name: 'No Afiliado', value: 68 }
        ]
    },
    {
        id: 'estudio',
        title: 'Nivel de estudio',
        type: 'bar',
        data: [
            { name: 'Primario Completo', value: 12 },
            { name: 'Secundario Incompleto', value: 18 },
            { name: 'Secundario Completo', value: 35 },
            { name: 'Terciario/Universitario', value: 12 }
        ]
    },
    {
        id: 'agua',
        title: '¿Hay agua potable y red cloacal?',
        type: 'bar',
        data: [
            { name: 'Ambos servicios', value: 182 },
            { name: 'Solo agua potable', value: 54 },
            { name: 'Solo red cloacal', value: 8 },
            { name: 'Ninguno', value: 30 }
        ]
    },
    {
        id: 'calles_pav',
        title: '¿Estan las calles pavimentadas?',
        type: 'bar',
        data: [
            { name: 'Sí, totalmente', value: 124 },
            { name: 'Parcialmente', value: 98 },
            { name: 'No, son de tierra', value: 54 }
        ]
    },
    {
        id: 'estado_pav',
        title: '¿Estado del pavimento?',
        type: 'bar',
        data: [
            { name: 'Bueno', value: 82 },
            { name: 'Regular', value: 120 },
            { name: 'Malo', value: 60 }
        ]
    },
    {
        id: 'arreglo',
        title: '¿Cada cuanto es el arreglo de las calles?',
        type: 'bar',
        data: [
            { name: 'Frecuentemente', value: 24 },
            { name: 'Ocasionalmente', value: 78 },
            { name: 'Raras veces', value: 92 },
            { name: 'Nunca', value: 58 }
        ]
    },
    {
        id: 'cordon',
        title: '¿Hay cordon cuneta?',
        type: 'bar',
        data: [
            { name: 'Sí', value: 184 },
            { name: 'No', value: 87 }
        ]
    }
];

export default function RespuestasDemoPage() {
    const [searchIdText, setSearchIdText] = useState('');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    // Form inputs state
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedSections, setSelectedSections] = useState([]);
    const [selectedBarrios, setSelectedBarrios] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Mock responses matching the user's uploaded screenshot
    const mockResponses = [
        {
            id: 644,
            usuario: { 
                nombre: "Candela vidoni", 
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80" 
            },
            fecha_display: "2026-05-27",
            seccion: "F. LA CANTERA",
            barrio: ""
        },
        {
            id: 643,
            usuario: { 
                nombre: "Candela vidoni", 
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80" 
            },
            fecha_display: "2026-05-27",
            seccion: "F. LA CANTERA",
            barrio: ""
        },
        {
            id: 642,
            usuario: { 
                nombre: "Candela vidoni", 
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80" 
            },
            fecha_display: "2026-05-27",
            seccion: "F. LOS MORROS",
            barrio: ""
        },
        {
            id: 641,
            usuario: { 
                nombre: "Geraldine Estefani González", 
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80" 
            },
            fecha_display: "2026-05-26",
            seccion: "F. PARQUE",
            barrio: ""
        },
        {
            id: 640,
            usuario: { 
                nombre: "Micaela Ledesma", 
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80" 
            },
            fecha_display: "2026-05-26",
            seccion: "B. KAREKEN",
            barrio: ""
        },
        {
            id: 639,
            usuario: { 
                nombre: "Micaela Ledesma", 
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80" 
            },
            fecha_display: "2026-05-23",
            seccion: "B. KAREKEN",
            barrio: ""
        },
        {
            id: 638,
            usuario: { 
                nombre: "Micaela Ledesma", 
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80" 
            },
            fecha_display: "2026-05-23",
            seccion: "B. KAREKEN",
            barrio: ""
        },
        {
            id: 637,
            usuario: { 
                nombre: "Micaela Ledesma", 
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80" 
            },
            fecha_display: "2026-05-21",
            seccion: "B. TOLKAR",
            barrio: ""
        },
        {
            id: 635,
            usuario: { 
                nombre: "Ariel Alejandro Salina", 
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80" 
            },
            fecha_display: "2026-05-21",
            seccion: "B. TOLKAR",
            barrio: ""
        },
        {
            id: 634,
            usuario: { 
                nombre: "Ariel Alejandro Salina", 
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80" 
            },
            fecha_display: "2026-05-21",
            seccion: "B. TOLKAR",
            barrio: ""
        }
    ];

    const handleResetAll = () => {
        setSelectedUser('');
        setSelectedSections([]);
        setSelectedBarrios([]);
        setStartDate('');
        setEndDate('');
    };

    // Advanced dynamic filtering on the UI mock data
    const filteredResponses = mockResponses.filter(rta => {
        // 1. Search ID input
        if (searchIdText && !String(rta.id).includes(searchIdText)) {
            return false;
        }
        // 2. User dropdown filter
        if (selectedUser) {
            const userMap = {
                '1': 'Candela vidoni',
                '2': 'Geraldine Estefani González',
                '3': 'Micaela Ledesma',
                '4': 'Ariel Alejandro Salina'
            };
            if (rta.usuario.nombre !== userMap[selectedUser]) {
                return false;
            }
        }
        // 3. Sections (Múltiple) - mapped to sections in our mock
        if (selectedSections.length > 0) {
            const secMap = {
                'Sección A': ['CANTERA'],
                'Sección B': ['LOS MORROS'],
                'Sección C': ['PARQUE'],
                'Sección D': ['KAREKEN', 'TOLKAR']
            };
            const matches = selectedSections.some(secName => {
                const keywords = secMap[secName] || [];
                return keywords.some(keyword => rta.seccion.includes(keyword));
            });
            if (!matches) return false;
        }
        // 4. Barrios (Múltiple) - mapped directly by keyword match
        if (selectedBarrios.length > 0) {
            const matchesBarrio = selectedBarrios.some(b => rta.seccion.toLowerCase().includes(b.toLowerCase()));
            if (!matchesBarrio) return false;
        }
        // 5. Date ranges
        if (startDate && rta.fecha_display < startDate) {
            return false;
        }
        if (endDate && rta.fecha_display > endDate) {
            return false;
        }
        return true;
    });

    return (
        <div className="w-full pb-12 space-y-4 animate-in fade-in duration-300">
            {/* Header resembling survey responses page, without the filter */}
            <div className="grid grid-cols-5 gap-4 w-full items-center">
                <div className="col-span-4 flex items-center">
                    <h1 className="text-2xl font-black text-content-primary tracking-tight">
                        Respuestas Demo
                    </h1>
                </div>
                <div className="col-span-1 flex items-center justify-center gap-2 w-full relative">
                    <div className="relative flex-1 min-w-[100px] sm:min-w-[130px] max-w-[170px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Hash size={16} className="text-content-secondary" />
                        </div>
                        <input
                            type="number"
                            placeholder="Buscar ID"
                            className="w-full bg-surface-primary border border-border-base rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-content-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:_textfield]"
                            value={searchIdText}
                            onChange={(e) => setSearchIdText(e.target.value)}
                        />
                    </div>
                    
                    <div className="relative flex-1 min-w-[105px] sm:min-w-[130px] max-w-[170px]">
                        <button
                            type="button"
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-all w-full h-full cursor-pointer"
                        >
                            <div className="flex items-center gap-1.5">
                                <Download size={16} className="shrink-0" />
                                <span className="truncate">Exportar</span>
                            </div>
                            <ChevronDown size={16} className={`shrink-0 transition-transform ${isExportMenuOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isExportMenuOpen && (
                            <div className="absolute top-12 right-0 w-56 bg-surface-primary border border-border-base rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <button
                                    type="button"
                                    onClick={() => setIsExportMenuOpen(false)}
                                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-content-primary hover:bg-surface-secondary transition-colors border-b border-border-base flex items-center gap-2"
                                >
                                    <FileImage size={14} className="text-content-secondary" />
                                    <span className="truncate">Exportar con Fotos (.zip)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsExportMenuOpen(false)}
                                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-content-primary hover:bg-surface-secondary transition-colors flex items-center gap-2"
                                >
                                    <FileSpreadsheet size={14} className="text-content-secondary" />
                                    <span className="truncate">Solo Excel (.xlsx)</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-4 w-full pt-4">
                {/* Card de respuestas (col-span-4 row-span-2) */}
                <div className="col-span-4 row-span-2">
                    <SurveysResponsesListCard 
                        responses={filteredResponses}
                        isLoading={false}
                        currentPage={1}
                        totalPages={1}
                        onNext={() => {}}
                        onPrev={() => {}}
                        onView={() => {}}
                        hasNext={false}
                        hasPrev={false}
                    />
                </div>

                {/* Filtros avanzados directamente en fila 1, columna 5 (col-span-1 row-span-2) */}
                <div className="col-span-1 row-span-2">
                    <div className="shadow-xl border border-border-base bg-surface-primary rounded-2xl overflow-visible flex flex-col h-full min-h-[760px] justify-between">
                        {/* Header */}
                        <div className="p-4 md:p-6 border-b border-border-base/50 flex items-center justify-between bg-surface-secondary/20 flex-shrink-0 rounded-t-2xl relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-blue/10 rounded-lg text-brand-blue">
                                    <Filter size={18} />
                                </div>
                                <h3 className="font-black uppercase tracking-widest text-[11px] md:text-xs text-content-primary">Configurar Filtros Avanzados</h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="p-2 hover:bg-surface-secondary rounded-full text-content-secondary transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 md:p-6 space-y-5 overflow-visible relative flex-1">
                            {/* Cargado por */}
                            <div className="space-y-2 relative z-10">
                                <label className="text-[10px] font-black text-content-secondary uppercase tracking-widest ml-1">Cargado por</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-surface-secondary border border-border-base rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none cursor-pointer text-content-primary"
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                    >
                                        <option value="">Todos los usuarios</option>
                                        <option value="1">Candela vidoni</option>
                                        <option value="2">Geraldine Estefani González</option>
                                        <option value="3">Micaela Ledesma</option>
                                        <option value="4">Ariel Alejandro Salina</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-content-secondary">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Secciones (Múltiple) */}
                            <CustomMultiSelect
                                label="Secciones (Múltiple)"
                                placeholder="Seleccionar secciones"
                                options={["Sección A", "Sección B", "Sección C", "Sección D"]}
                                selectedOptions={selectedSections}
                                onChange={(val) => {
                                    setSelectedSections(prev => 
                                        prev.includes(val) ? prev.filter(item => item !== val) : [...prev, val]
                                    );
                                }}
                                onClear={() => setSelectedSections([])}
                            />

                            {/* Barrios (Múltiple) */}
                            <CustomMultiSelect
                                label="Barrios (Múltiple)"
                                placeholder="Seleccionar barrios"
                                options={["La Cantera", "Los Morros", "Parque", "Kareken", "Tolkar", "El Bosque"]}
                                selectedOptions={selectedBarrios}
                                onChange={(val) => {
                                    setSelectedBarrios(prev => 
                                        prev.includes(val) ? prev.filter(item => item !== val) : [...prev, val]
                                    );
                                }}
                                onClear={() => setSelectedBarrios([])}
                            />

                            {/* Rango de Fecha */}
                            <div className="space-y-2 relative z-10">
                                <label className="text-[10px] font-black text-content-secondary uppercase tracking-widest ml-1">Rango de Fecha</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <input
                                        type="date"
                                        className="w-full bg-surface-secondary border border-border-base rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 color-scheme-dark shadow-none text-content-primary"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                    <input
                                        type="date"
                                        className="w-full bg-surface-secondary border border-border-base rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 color-scheme-dark shadow-none text-content-primary"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 md:p-6 bg-surface-secondary/30 border-t border-border-base/50 flex items-center justify-center flex-shrink-0 rounded-b-2xl relative z-10 w-full">
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="flex items-center justify-center gap-2 text-xs font-black uppercase text-red-500 hover:bg-red-500/10 px-6 py-3 rounded-xl transition-all cursor-pointer w-full border border-red-500/20 hover:border-red-500/40"
                            >
                                <Trash2 size={16} />
                                <span>Limpiar Filtros</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Analítica (col-span-5 row-span-2) */}
                <div className="col-span-5 row-span-2 h-[760px]">
                    <SurveyStatsDashboard
                        statsData={mockStatsData}
                        isLoading={false}
                        className="h-full"
                    />
                </div>

                {/* Resto de celdas de cuadrícula discontinuas de 5x12 (filas 5 a 12 de forma adaptada) */}
                {Array.from({ length: 40 }).map((_, idx) => (
                    <div 
                        key={idx} 
                        className="w-full aspect-square border border-dashed border-red-500/70 rounded-2xl select-none pointer-events-none"
                    />
                ))}
            </div>
        </div>
    );
}
