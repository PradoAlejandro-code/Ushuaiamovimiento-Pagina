import React from 'react';
import { Settings, Users, Info } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

const EnrollmentsConfigMenu = ({ table, onMigrate, onOpenInfo }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="p-1.5 text-content-secondary hover:bg-surface-secondary rounded-md outline-none transition-colors">
                <Settings size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-surface-primary border-border-base text-content-primary shadow-xl rounded-xl w-72 p-2">
                <DropdownMenuLabel className="text-sm font-bold text-content-tertiary px-2 py-2 uppercase tracking-wider">
                    Configuración
                </DropdownMenuLabel>

                {/* Renderizado condicional de los botones específicos de Padrones */}
                {(onOpenInfo || onMigrate) && (
                    <div className="px-2 py-1 mb-2 space-y-1.5">
                        {onOpenInfo && (
                            <button
                                onClick={onOpenInfo}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold bg-surface-secondary text-content-primary hover:bg-surface-secondary/80 rounded-lg transition-colors border border-border-base"
                            >
                                <Info size={16} className="text-brand-blue" />
                                Información y Nombre
                            </button>
                        )}
                        {onMigrate && (
                            <button
                                onClick={onMigrate}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 rounded-lg transition-colors"
                            >
                                <Users size={16} />
                                Migrar a Personas
                            </button>
                        )}
                    </div>
                )}

                <div className="px-2 py-2 border-t border-border-base mt-1">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-content-tertiary uppercase tracking-wider">Visibilidad</span>
                        <button
                            onClick={() => table.toggleAllColumnsVisible(true)}
                            className="text-xs font-bold text-brand-blue hover:underline"
                        >
                            Mostrar todo
                        </button>
                    </div>

                    <div className="space-y-1 max-h-80 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {table.getAllLeafColumns()
                            .filter(column => column.id !== 'actions' && column.id !== 'select')
                            .map(column => (
                                <div
                                    key={column.id}
                                    className="flex items-center justify-between py-2 px-1 hover:bg-surface-secondary/50 rounded-md transition-colors"
                                >
                                    <span className="text-[13px] font-medium text-content-secondary capitalize truncate mr-2">
                                        {column.columnDef.headerLabel || column.id.replace(/_/g, ' ')}
                                    </span>
                                    <Switch
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        className="scale-90 origin-right"
                                    />
                                </div>
                            ))
                        }
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default EnrollmentsConfigMenu;