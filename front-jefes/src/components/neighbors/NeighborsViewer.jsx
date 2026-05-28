import React, { useState, useMemo, useEffect } from 'react';
import apiClient from '@/api/client';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
    Plus, Edit2, MoreVertical, ArrowDownAZ, ArrowUpZA,
    EyeOff, Filter, FilterX, Trash2, ChevronDown, Users
} from 'lucide-react';
import {
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import TablePageLayout from '../enrollments/TablePageLayout';
import { useEnrollmentLists, usePersonCities, usePersonWorkplaces, usePersonEmploymentStatuses } from '@/queries/useEnrollments';

const NeighborsViewer = () => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const { data: listsRaw } = useEnrollmentLists();
    const allLists = useMemo(() => listsRaw?.results || listsRaw || [], [listsRaw]);

    const { data: citiesData } = usePersonCities();
    const { data: workplacesData } = usePersonWorkplaces();
    const { data: employmentStatusesData } = usePersonEmploymentStatuses();

    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});

    // === SOLUCIÓN AL ERROR 404 ===
    // Resetea la página a 1 (index 0) cada vez que el usuario cambia un filtro
    useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [columnFilters]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState(null);

    const { data: peopleData, isFetching, isLoading, refetch } = useQuery({
        queryKey: ['neighbors', pagination.pageIndex, pagination.pageSize, columnFilters, sorting],
        queryFn: async () => {
            let ordering = undefined;
            if (sorting.length > 0) {
                ordering = sorting[0].desc ? `-${sorting[0].id}` : sorting[0].id;
            }

            const queryParams = {
                page: pagination.pageIndex + 1,
                page_size: pagination.pageSize,
                ordering: ordering
            };

            columnFilters.forEach(f => {
                if (f.value !== 'all' && f.value !== '') {
                    queryParams[f.id] = f.value;
                }
            });

            const response = await apiClient.get('/api/enrollments/people/', { params: queryParams });
            return response;
        },
        placeholderData: keepPreviousData,
    });

    const data = useMemo(() => peopleData?.results ?? [], [peopleData]);
    const totalRowCount = peopleData?.count ?? 0;
    const pageCount = Math.ceil(totalRowCount / pagination.pageSize);

    const columns = useMemo(() => {
        const selectionColumn = {
            id: 'select',
            header: ({ table }) => (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border-base text-brand-blue focus:ring-brand-blue"
                        checked={table.getIsAllPageRowsSelected()}
                        onChange={table.getToggleAllPageRowsSelectedHandler()}
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border-base text-brand-blue focus:ring-brand-blue"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                    />
                </div>
            ),
            size: 40,
            enableSorting: false,
            enableColumnFilter: false,
        };

        const personFields = [
            { id: 'dni', header: 'DNI', size: 100 },
            { id: 'last_name', header: 'Apellido', size: 140 },
            { id: 'first_name', header: 'Nombre', size: 140 },
            { id: 'gender', header: 'Género', size: 90 },
            { id: 'age', header: 'Edad', size: 75 },
            { id: 'email', header: 'Email', size: 160 },
            { id: 'phone', header: 'Teléfono', size: 120 },
            { id: 'birth_date', header: 'Fecha Nac.', size: 110 },
            { id: 'address', header: 'Domicilio', size: 200 },
            { id: 'profession', header: 'Profesión', size: 130 },
            { id: 'employment_status', header: 'Estado Empleado', size: 140 },
            { id: 'workplace', header: 'Lugar de Trabajo', size: 150 },
            { id: 'city', header: 'Ciudad', size: 130 },
            { id: 'is_affiliate', header: 'Afiliado', size: 130 },
            { id: 'padrones', header: 'Padrones Vinculados', size: 180 },
        ];

        const base = personFields.map(col => {
            let filterMeta = undefined;

            if (col.id === 'is_affiliate') {
                const options = [
                    { value: 'all', label: 'TODOS' },
                    { value: 'true', label: 'AFILIADOS', className: 'text-green-500' },
                    { value: 'false', label: 'NO AFILIADOS', className: 'text-red-500' },
                ];
                filterMeta = {
                    filterElement: (column) => (
                        <Select
                            value={column.getFilterValue() ?? 'all'}
                            onValueChange={(value) => column.setFilterValue(value)}
                        >
                            <SelectTrigger className="w-full h-9 bg-surface-primary border border-border-base px-3 text-[12px] font-bold uppercase focus:ring-1 focus:ring-brand-blue/20">
                                <SelectValue placeholder="TODOS" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="bg-surface-primary border-border-base w-[--radix-select-trigger-width]">
                                {options.map(opt => (
                                    <SelectItem 
                                        key={opt.value} 
                                        value={opt.value}
                                        className={cn("text-[13px] py-2.5 font-bold uppercase cursor-pointer", opt.className)}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )
                };
            } else if (col.id === 'city') {
                const options = [
                    { value: 'all', label: 'TODOS' },
                    ...(citiesData || []).map(c => ({
                        value: c.city,
                        label: `${c.city} (${c.count})`
                    }))
                ];
                filterMeta = {
                    filterElement: (column) => (
                        <Select
                            value={column.getFilterValue() ?? 'all'}
                            onValueChange={(value) => column.setFilterValue(value)}
                        >
                            <SelectTrigger className="w-full h-8 bg-surface-primary border border-border-base px-2 text-[11px] font-bold uppercase focus:ring-1 focus:ring-brand-blue/20">
                                <SelectValue placeholder="TODOS" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="bg-surface-primary border-border-base w-[--radix-select-trigger-width] max-h-72 overflow-y-auto">
                                {options.map(opt => (
                                    <SelectItem 
                                        key={opt.value} 
                                        value={opt.value}
                                        className="text-[11px] font-bold uppercase cursor-pointer"
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )
                };
            } else if (col.id === 'workplace') {
                const options = [
                    { value: 'all', label: 'TODOS' },
                    ...(workplacesData || []).map(w => ({
                        value: w.workplace,
                        label: `${w.workplace} (${w.count})`
                    }))
                ];
                filterMeta = {
                    filterElement: (column) => (
                        <Select
                            value={column.getFilterValue() ?? 'all'}
                            onValueChange={(value) => column.setFilterValue(value)}
                        >
                            <SelectTrigger className="w-full h-8 bg-surface-primary border border-border-base px-2 text-[11px] font-bold uppercase focus:ring-1 focus:ring-brand-blue/20">
                                <SelectValue placeholder="TODOS" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="bg-surface-primary border-border-base w-[--radix-select-trigger-width] max-h-72 overflow-y-auto">
                                {options.map(opt => (
                                    <SelectItem 
                                        key={opt.value} 
                                        value={opt.value}
                                        className="text-[11px] font-bold uppercase cursor-pointer"
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )
                };
            } else if (col.id === 'employment_status') {
                const options = [
                    { value: 'all', label: 'TODOS' },
                    ...(employmentStatusesData || []).map(s => ({
                        value: s.employment_status,
                        label: `${s.employment_status} (${s.count})`
                    }))
                ];
                filterMeta = {
                    filterElement: (column) => (
                        <Select
                            value={column.getFilterValue() ?? 'all'}
                            onValueChange={(value) => column.setFilterValue(value)}
                        >
                            <SelectTrigger className="w-full h-8 bg-surface-primary border border-border-base px-2 text-[11px] font-bold uppercase focus:ring-1 focus:ring-brand-blue/20">
                                <SelectValue placeholder="TODOS" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="bg-surface-primary border-border-base w-[--radix-select-trigger-width] max-h-72 overflow-y-auto">
                                {options.map(opt => (
                                    <SelectItem 
                                        key={opt.value} 
                                        value={opt.value}
                                        className="text-[11px] font-bold uppercase cursor-pointer"
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )
                };
            } else if (col.id === 'padrones') {
                filterMeta = {
                    filterElement: (column) => (
                        <Select
                            value={column.getFilterValue() ?? 'all'}
                            onValueChange={(value) => column.setFilterValue(value)}
                        >
                            <SelectTrigger className="w-full h-9 bg-surface-primary border border-border-base px-3 text-[12px] font-bold uppercase focus:ring-1 focus:ring-brand-blue/20">
                                <SelectValue placeholder="TODOS" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="bg-surface-primary border-border-base w-[--radix-select-trigger-width] max-h-60 overflow-y-auto">
                                <SelectItem value="all" className="text-[13px] py-2.5 font-bold uppercase cursor-pointer">TODOS</SelectItem>
                                {allLists.map(list => (
                                    <SelectItem 
                                        key={list.id} 
                                        value={list.name}
                                        className="text-[13px] py-2.5 font-bold uppercase cursor-pointer"
                                    >
                                        {list.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )
                };
            }

            return {
                id: col.id,
                accessorKey: col.id,
                headerLabel: col.header,
                size: col.size,
                header: ({ column }) => (
                    <div className="flex items-center justify-between group min-w-[140px]">
                        <span className="truncate font-semibold text-content-primary">{col.header}</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-tertiary text-content-secondary transition-all outline-none">
                                <MoreVertical size={14} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-surface-primary border-border-base text-content-primary z-50 shadow-xl rounded-xl">
                                <DropdownMenuItem onClick={() => column.toggleSorting(false)} className="cursor-pointer hover:bg-surface-secondary"><ArrowDownAZ className="mr-2 h-4 w-4" /> Ascendente</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => column.toggleSorting(true)} className="cursor-pointer hover:bg-surface-secondary"><ArrowUpZA className="mr-2 h-4 w-4" /> Descendente</DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border-base" />
                                <DropdownMenuItem onClick={() => column.toggleVisibility(false)} className="cursor-pointer hover:bg-surface-secondary text-red-500"><EyeOff className="mr-2 h-4 w-4" /> Ocultar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
                cell: ({ getValue }) => {
                    const val = getValue();
                    if (col.id === 'is_affiliate') {
                        const isTrue = val === true;
                        return (
                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${isTrue ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                {isTrue ? 'AFILIADO' : 'NO AFILIADO'}
                            </div>
                        );
                    }
                    if (col.id === 'padrones') {
                        const items = val?.split(', ').filter(Boolean) || [];
                        if (items.length === 0) {
                            return <span className="text-content-tertiary italic text-[10px]">Sin vincular</span>;
                        }
                        if (items.length === 1) {
                            return (
                                <span 
                                    className="px-2 py-0.5 bg-brand-blue/10 text-brand-blue text-[10px] font-bold rounded-full whitespace-nowrap w-fit h-fit truncate max-w-[110px] inline-block select-none"
                                    title={items[0]}
                                >
                                    {items[0]}
                                </span>
                            );
                        }
                        
                        return (
                            <div 
                                className="grid grid-rows-2 grid-flow-col gap-1.5 items-start content-start max-w-[280px] overflow-x-auto scrollbar-none py-1 pr-2 shrink-0 select-none" 
                                style={{ maxHeight: '48px' }}
                                title={items.join(', ')}
                            >
                                {items.map((p, i) => (
                                    <span 
                                        key={i} 
                                        className="px-2 py-0.5 bg-brand-blue/10 text-brand-blue text-[10px] font-bold rounded-full whitespace-nowrap w-fit h-fit truncate max-w-[110px] inline-block"
                                    >
                                        {p}
                                    </span>
                                ))}
                            </div>
                        );
                    }
                    if (col.id === 'birth_date' && val) {
                        try {
                            const dateStr = String(val).trim();
                            if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
                                const parts = dateStr.split('T')[0].split('-');
                                if (parts.length === 3) {
                                    return <div className="truncate text-content-primary">{`${parts[2]}/${parts[1]}/${parts[0]}`}</div>;
                                }
                            }
                        } catch (e) {
                            console.error("Error formatting date:", e);
                        }
                    }
                    return <div className="truncate text-content-primary">{val}</div>;
                },
                meta: filterMeta
            };
        });

        const actionColumn = {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <button onClick={() => { setSelectedPerson(row.original); setIsModalOpen(true); }} className="p-1.5 text-content-secondary hover:text-brand-blue hover:bg-brand-blue/10 rounded-md transition-colors"><Edit2 size={16} /></button>
            ),
            size: 50,
            enableColumnFilter: false,
        };

        return [selectionColumn, actionColumn, ...base];
    }, [data]);

    const table = useReactTable({
        data, columns, pageCount, state: { sorting, columnFilters, pagination, columnVisibility, rowSelection },
        onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, onPaginationChange: setPagination,
        onColumnVisibilityChange: setColumnVisibility, onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(),
        manualFiltering: true, manualPagination: true, manualSorting: true,
        getRowId: (row) => row.id,
    });

    if (!mounted) return null;

    return (
        <TablePageLayout
            title="Vecinos"
            subtitle="Listado general de vecinos registrados y gestión de afiliaciones."
            icon={Users}
            iconColorClass="bg-brand-blue/10 text-brand-blue border-brand-blue/20"
            badgeCount={totalRowCount}
            table={table}
            totalRowCount={totalRowCount}
            isLoading={isLoading}
            isFetching={isFetching}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            setColumnFilters={setColumnFilters}
        />
    );
};

export default NeighborsViewer;