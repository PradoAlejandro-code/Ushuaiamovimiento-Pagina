import React, { useState } from 'react';
import { Upload, Download, ChevronDown, Search, Users, LayoutGrid } from 'lucide-react';

export default function AgendaDemoPage() {
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [searchText, setSearchText] = useState('');

    return (
        <div className="w-full pb-12 space-y-4 animate-in fade-in duration-300">
            {/* Header / Barra de título y botones corregidos */}
            <div className="grid grid-cols-5 gap-4 w-full items-center">
                {/* Título (Columna 1) */}
                <div className="col-span-1 flex items-center min-w-0">
                    <h1 className="text-2xl font-black text-content-primary tracking-tight truncate" title="Agenda de Seguimiento Demo">
                        Agenda Demo
                    </h1>
                </div>

                {/* Input de Búsqueda (Columnas 2 y 3 - Ampliado) */}
                <div className="col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, tag, celular..."
                        className="w-full bg-surface-primary border border-border-base rounded-xl pl-9 pr-3 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all text-content-primary"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>

                {/* Columna 4 (Vacía para mantener la cuadrícula) */}
                <div className="col-span-1" />

                {/* Botones de Control Juntos en una Sola Columna (Columna 5 - Grandes y Centrados) */}
                <div className="col-span-1 flex items-center justify-center gap-2 w-full relative">
                    <button
                        type="button"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-surface-secondary border border-border-base rounded-xl font-bold text-sm hover:bg-surface-tertiary transition-all cursor-pointer text-content-primary whitespace-nowrap"
                    >
                        <Upload size={18} className="shrink-0" />
                        <span>Importar</span>
                    </button>
                    
                    <div className="flex-1 relative">
                        <button
                            type="button"
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-all cursor-pointer whitespace-nowrap"
                        >
                            <Download size={18} className="shrink-0" />
                            <span>Exportar</span>
                            <ChevronDown size={14} className="shrink-0" />
                        </button>

                        {isExportMenuOpen && (
                            <div className="absolute top-12 right-0 w-56 bg-surface-primary border border-border-base rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <button
                                    type="button"
                                    onClick={() => setIsExportMenuOpen(false)}
                                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-content-primary hover:bg-surface-secondary transition-colors border-b border-border-base flex items-center gap-2"
                                >
                                    <Users size={14} className="text-content-secondary" />
                                    <span className="truncate">Google Contacts (.csv)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsExportMenuOpen(false)}
                                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-content-primary hover:bg-surface-secondary transition-colors flex items-center gap-2"
                                >
                                    <LayoutGrid size={14} className="text-content-secondary" />
                                    <span className="truncate">Reporte Excel (.xlsx)</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bento Grid Vacío (Guía de 5 Columnas x 12 Filas = 60 celdas) */}
            <div className="grid grid-cols-5 gap-4 w-full pt-4">
                {Array.from({ length: 60 }).map((_, idx) => (
                    <div 
                        key={idx} 
                        className="w-full aspect-square border border-dashed border-red-500/70 rounded-2xl select-none pointer-events-none"
                    />
                ))}
            </div>
        </div>
    );
}
