import React from 'react';
import { Filter, FilterX } from 'lucide-react';
import EnrollmentsTable from './EnrollmentsTable';
import EnrollmentsConfigMenu from './EnrollmentsConfigMenu';

const TablePageLayout = ({
    title,
    subtitle,
    icon: Icon,
    iconColorClass = "bg-brand-blue/10 text-brand-blue border-brand-blue/20",
    badgeCount,
    headerActions,
    navigation,
    toolbarActions,
    configMenu,
    table,
    totalRowCount,
    isLoading,
    isFetching,
    showFilters,
    setShowFilters,
    setColumnFilters
}) => {
    return (
        <div className="w-full max-w-full overflow-hidden h-[calc(100vh-3rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 px-0">
            <div className="flex flex-1 min-h-0 min-w-0 relative gap-6 overflow-hidden px-4 py-2">
                
                {/* Main Content Area Container */}
                <div className="flex-1 min-w-0 h-full bg-surface-primary rounded-2xl relative overflow-hidden border border-border-base shadow-sm flex flex-col">
                    
                    {/* Standardized Header */}
                    <div className="py-2 px-6 min-h-[4.75rem] flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-base bg-surface-secondary/10 gap-4 shrink-0">
                        <div className="flex items-center gap-3 py-1">
                            {Icon && (
                                <div className={`p-3 rounded-2xl border shadow-sm ${iconColorClass}`}>
                                    <Icon size={24} />
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-content-primary">
                                        {title}
                                    </h2>
                                    {badgeCount !== undefined && (
                                        <span className="text-xs font-bold bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full">
                                            {badgeCount}
                                        </span>
                                    )}
                                </div>
                                {subtitle && (
                                    <p className="text-xs text-content-secondary mt-0.5">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Custom Header Actions (e.g. Quick assignment bars, buttons) */}
                        {headerActions && (
                            <div className="flex items-center gap-2">
                                {headerActions}
                            </div>
                        )}
                    </div>

                    {/* Standardized Navigation / Tabs (rendered only if present) */}
                    {navigation && (
                        <div className="flex items-center justify-between border-b border-border-base bg-surface-secondary/5 px-6 shrink-0">
                            {navigation}
                        </div>
                    )}

                    {/* Standardized Toolbar */}
                    <div className="flex items-center justify-end p-2 px-6 border-b border-border-base gap-2 shrink-0 bg-surface-primary">
                        {toolbarActions && (
                            <div className="flex items-center gap-2 mr-auto">
                                {toolbarActions}
                            </div>
                        )}
                        
                        {/* Standardized Borderless Filter Toggle Button */}
                        <button
                            onClick={() => {
                                if (showFilters && setColumnFilters) {
                                    setColumnFilters([]);
                                }
                                if (setShowFilters) {
                                    setShowFilters(!showFilters);
                                }
                            }}
                            className={`h-9 px-3 rounded-xl transition-colors flex items-center gap-2 text-xs font-semibold ${
                                showFilters 
                                    ? 'bg-brand-blue/10 text-brand-blue' 
                                    : 'bg-surface-secondary text-content-secondary hover:bg-surface-secondary/80'
                            }`}
                        >
                            {showFilters ? <FilterX size={16} /> : <Filter size={16} />}
                            {showFilters ? 'Quitar filtros' : 'Filtrar'}
                        </button>

                        {/* Table Config Menu Gear */}
                        {configMenu || <EnrollmentsConfigMenu table={table} />}
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-hidden relative">
                        <EnrollmentsTable
                            table={table}
                            totalRowCount={totalRowCount}
                            isLoading={isLoading}
                            isFetching={isFetching}
                            showFilters={showFilters}
                        />
                    </div>

                </div>

            </div>
        </div>
    );
};

export default TablePageLayout;
