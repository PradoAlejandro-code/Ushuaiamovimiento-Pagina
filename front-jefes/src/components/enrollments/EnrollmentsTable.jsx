import React from 'react';
import {
    flexRender
} from "@tanstack/react-table";
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';

const EnrollmentsTable = ({ table, totalRowCount, isLoading, isFetching, showFilters }) => {
    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-content-secondary uppercase bg-surface-secondary border-b border-border-base sticky top-0 z-10">
                        {table.getHeaderGroups().map(hg => (
                            <React.Fragment key={hg.id}>
                                <tr>
                                    {hg.headers.map(header => (
                                        <th key={header.id} style={{ width: header.getSize(), minWidth: header.getSize() }} className="px-4 py-3 font-semibold border-r border-border-base/50 last:border-r-0 bg-surface-secondary text-content-secondary">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                                {showFilters && (
                                    <tr className="bg-surface-primary border-b border-border-base">
                                        {hg.headers.map(header => (
                                            <th key={`filter-${header.id}`} style={{ width: header.getSize(), minWidth: header.getSize() }} className="px-4 py-2 border-r border-border-base/50 last:border-r-0">
                                                {header.column.getCanFilter() ? (
                                                    header.column.columnDef.meta?.filterElement ? (
                                                        header.column.columnDef.meta.filterElement(header.column)
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={(header.column.getFilterValue() ?? '')}
                                                            onChange={e => header.column.setFilterValue(e.target.value)}
                                                            placeholder="buscar..."
                                                            className="w-full bg-transparent border-b border-border-base py-1 text-content-primary focus:border-brand-blue outline-none transition-colors lowercase font-normal"
                                                        />
                                                    )
                                                ) : null}
                                            </th>
                                        ))}
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-border-base">
                        {isLoading || isFetching ? (
                            <tr><td colSpan={table.getAllColumns().length} className="px-6 py-10 text-center text-content-secondary">Cargando...</td></tr>
                        ) : table.getRowModel().rows.map(row => (
                            <tr key={row.id} className="hover:bg-brand-orange/20 dark:hover:bg-brand-blue/20 transition-colors duration-150">
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} style={{ width: cell.column.getSize(), minWidth: cell.column.getSize() }} className="px-4 py-3 border-r border-border-base/50 last:border-r-0">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-border-base bg-surface-secondary/10 flex items-center justify-between gap-4">
                <div className="text-sm text-content-secondary font-medium">
                    Mostrando {table.getRowModel().rows.length} de {totalRowCount} resultados
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <button
                            className="p-2 text-content-secondary hover:bg-surface-secondary rounded-lg disabled:opacity-30 transition-colors"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsLeft size={18} />
                        </button>
                        <button
                            className="p-2 text-content-secondary hover:bg-surface-secondary rounded-lg disabled:opacity-30 transition-colors"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft size={18} />
                        </button>
                    </div>

                    <span className="flex items-center gap-1 text-sm font-semibold text-content-primary mx-2">
                        Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            className="p-2 text-content-secondary hover:bg-surface-secondary rounded-lg disabled:opacity-30 transition-colors"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button
                            className="p-2 text-content-secondary hover:bg-surface-secondary rounded-lg disabled:opacity-30 transition-colors"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnrollmentsTable;