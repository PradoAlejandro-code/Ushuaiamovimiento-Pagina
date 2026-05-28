import React, { useState, useEffect, useMemo } from 'react';
import { 
    Gift, Search, CheckCircle2, XCircle, UserCheck, Calendar, RefreshCw, 
    AlertCircle, ShieldCheck, ShieldAlert, Filter, FilterX, MoreVertical, 
    ArrowDownAZ, ArrowUpZA, EyeOff
} from 'lucide-react';
import { useActiveUsers, useAssignBirthdays } from '@/queries/useBirthdays';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/api/client';
import {
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import TablePageLayout from '@/components/enrollments/TablePageLayout';
import { usePersonEmploymentStatuses } from '@/queries/useEnrollments';

const BirthdaysPage = () => {
    const [activeTab, setActiveTab] = useState('today'); // 'today', 'tomorrow', 'after_tomorrow'
    
    const [showFilters, setShowFilters] = useState(false);
    const [columnFilters, setColumnFilters] = useState([]);
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});

    const [assignedUserId, setAssignedUserId] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [activeNotification, setActiveNotification] = useState(null);

    // Auto-descartar la notificación después de 4 segundos
    useEffect(() => {
        if (activeNotification) {
            const timer = setTimeout(() => {
                setActiveNotification(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [activeNotification]);

    // Resetear selección, filtros y página cuando cambia de pestaña
    useEffect(() => {
        setRowSelection({});
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [activeTab]);

    // Resetear a página 1 cuando cambian los filtros
    useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [columnFilters]);

    const getFormattedDate = (daysAhead) => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    };

    // Queries de conteo para los badges superiores
    const { data: todayCountRaw } = useQuery({
        queryKey: ['birthdays-count', 'today'],
        queryFn: async () => {
            const response = await apiClient.get('/api/enrollments/people/birthdays/', { params: { day: 'today', page_size: 1 } });
            return response.count ?? 0;
        },
        staleTime: 30000,
    });

    const { data: tomorrowCountRaw } = useQuery({
        queryKey: ['birthdays-count', 'tomorrow'],
        queryFn: async () => {
            const response = await apiClient.get('/api/enrollments/people/birthdays/', { params: { day: 'tomorrow', page_size: 1 } });
            return response.count ?? 0;
        },
        staleTime: 30000,
    });

    const { data: afterTomorrowCountRaw } = useQuery({
        queryKey: ['birthdays-count', 'after_tomorrow'],
        queryFn: async () => {
            const response = await apiClient.get('/api/enrollments/people/birthdays/', { params: { day: 'after_tomorrow', page_size: 1 } });
            return response.count ?? 0;
        },
        staleTime: 30000,
    });

    const todayCount = todayCountRaw ?? 0;
    const tomorrowCount = tomorrowCountRaw ?? 0;
    const afterTomorrowCount = afterTomorrowCountRaw ?? 0;

    // Parsear filtros por columna para la query del backend
    const activeFilters = useMemo(() => {
        const filtersObj = {};
        columnFilters.forEach(f => {
            if (f.value !== 'all' && f.value !== '') {
                filtersObj[f.id] = f.value;
            }
        });
        return filtersObj;
    }, [columnFilters]);

    // Parsear ordenamiento para el backend
    const activeOrdering = useMemo(() => {
        if (sorting.length > 0) {
            return sorting[0].desc ? `-${sorting[0].id}` : sorting[0].id;
        }
        return undefined;
    }, [sorting]);

    // Query principal de cumpleaños (Filtrada y Paginada)
    const { 
        data: activeDataRaw, 
        isLoading, 
        isFetching,
        refetch: refetchActive 
    } = useQuery({
        queryKey: ['birthdays', activeTab, pagination.pageIndex, pagination.pageSize, activeFilters, activeOrdering],
        queryFn: async () => {
            const params = {
                day: activeTab,
                page: pagination.pageIndex + 1,
                page_size: pagination.pageSize,
                ordering: activeOrdering,
                ...activeFilters
            };
            const response = await apiClient.get('/api/enrollments/people/birthdays/', { params });
            return response;
        },
        placeholderData: keepPreviousData,
    });

    const activeList = useMemo(() => activeDataRaw?.results ?? [], [activeDataRaw]);
    const totalRowCount = activeDataRaw?.count ?? 0;
    const pageCount = Math.ceil(totalRowCount / pagination.pageSize) || 1;

    const { data: activeUsers = [] } = useActiveUsers();
    const { mutateAsync: assignBirthdaysMut } = useAssignBirthdays();

    const handleAssign = async () => {
        const selectedIds = Object.keys(rowSelection);
        if (selectedIds.length === 0 || !assignedUserId) return;
        
        setIsAssigning(true);
        try {
            await assignBirthdaysMut({
                person_ids: selectedIds,
                user_id: assignedUserId,
                anio: new Date().getFullYear()
            });
            setRowSelection({});
            refetchActive();
            setActiveNotification({
                type: 'success',
                message: '¡Cumpleaños asignados con éxito!'
            });
        } catch (error) {
            console.error("Error al asignar cumpleaños:", error);
            setActiveNotification({
                type: 'error',
                message: 'No se pudieron asignar los cumpleaños.'
            });
        } finally {
            setIsAssigning(false);
            setAssignedUserId('');
        }
    };

    // Columnas de la tabla (TanStack Table)
    const columns = useMemo(() => {
        const selectionColumn = {
            id: 'select',
            header: ({ table }) => (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border-base text-brand-blue focus:ring-brand-blue cursor-pointer"
                        checked={table.getIsAllPageRowsSelected()}
                        onChange={table.getToggleAllPageRowsSelectedHandler()}
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border-base text-brand-blue focus:ring-brand-blue cursor-pointer"
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
            { id: 'phone', header: 'Teléfono', size: 120 },
            { id: 'city', header: 'Ciudad', size: 130 },
            { id: 'address', header: 'Domicilio', size: 200 },
            { id: 'is_affiliate', header: 'Afiliación', size: 130 },
            { id: 'asignacion_actual', header: 'Asignado a', size: 150 },
            { id: 'entregado', header: 'Estado Informe', size: 150 },
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
                            <SelectTrigger className="w-full h-8 bg-surface-primary border border-border-base px-2 text-[10px] font-bold uppercase focus:ring-1 focus:ring-brand-blue/20">
                                <SelectValue placeholder="TODOS" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="bg-surface-primary border-border-base w-[--radix-select-trigger-width] z-[200]">
                                {options.map(opt => (
                                    <SelectItem 
                                        key={opt.value} 
                                        value={opt.value}
                                        className={cn("text-[11px] py-2 font-bold uppercase cursor-pointer", opt.className)}
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
                    { value: 'USHUAIA', label: 'USHUAIA' },
                    { value: 'RIO GRANDE', label: 'RÍO GRANDE' },
                    { value: 'TOLHUIN', label: 'TOLHUIN' },
                ];
                filterMeta = {
                    filterElement: (column) => (
                        <Select
                            value={column.getFilterValue() ?? 'all'}
                            onValueChange={(value) => column.setFilterValue(value)}
                        >
                            <SelectTrigger className="w-full h-8 bg-surface-primary border border-border-base px-2 text-[10px] font-bold uppercase focus:ring-1 focus:ring-brand-blue/20">
                                <SelectValue placeholder="TODOS" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="bg-surface-primary border-border-base w-[--radix-select-trigger-width] z-[200] max-h-72 overflow-y-auto">
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
            }

            return {
                id: col.id,
                accessorKey: col.id,
                headerLabel: col.header,
                size: col.size,
                header: ({ column }) => (
                    <div className="flex items-center justify-between group min-w-[120px]">
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
                cell: ({ row, getValue }) => {
                    const val = getValue();
                    if (col.id === 'is_affiliate') {
                        const isTrue = val === true;
                        return (
                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${isTrue ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
                                {isTrue ? 'AFILIADO' : 'NO AFILIADO'}
                            </div>
                        );
                    }
                    if (col.id === 'asignacion_actual') {
                        const assignment = row.original.asignacion_actual;
                        return assignment ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit bg-brand-blue/10 text-brand-blue border border-brand-blue/20 text-xs font-bold uppercase">
                                <UserCheck size={12} />
                                {assignment.empleado_name}
                            </div>
                        ) : (
                            <span className="text-xs text-content-tertiary italic font-medium">Sin asignar</span>
                        );
                    }
                    if (col.id === 'entregado') {
                        const assignment = row.original.asignacion_actual;
                        if (assignment) {
                            return assignment.entregado ? (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full w-fit bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-bold uppercase">
                                    <CheckCircle2 size={12} />
                                    Entregado
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full w-fit bg-orange-500/10 text-brand-orange border border-brand-orange/20 text-[10px] font-bold uppercase">
                                    <XCircle size={12} />
                                    Pendiente
                                </div>
                            );
                        }
                        return <span className="text-xs text-content-tertiary">-</span>;
                    }
                    if (col.id === 'age') {
                        return <span className="font-bold text-content-primary">{val ? `${val} años` : 'S/D'}</span>;
                    }
                    return <div className="truncate text-content-primary">{val || '-'}</div>;
                },
                meta: filterMeta,
                enableColumnFilter: !['asignacion_actual', 'entregado'].includes(col.id)
            };
        });

        return [selectionColumn, ...base];
    }, [activeTab]);

    const table = useReactTable({
        data: activeList,
        columns,
        pageCount,
        state: { sorting, columnFilters, pagination, columnVisibility, rowSelection },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        manualFiltering: true,
        manualPagination: true,
        manualSorting: true,
        getRowId: (row) => row.id,
    });

    return (
        <>
            <TablePageLayout
            title="Panel de Cumpleaños"
            subtitle="Seguimiento de cumpleaños y asignación de tareas de revisión al equipo."
            icon={Gift}
            iconColorClass="bg-brand-orange/10 text-brand-orange border-brand-orange/20 animate-pulse"
            headerActions={
                Object.keys(rowSelection).length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 bg-brand-blue/5 border border-brand-blue/15 px-3 py-1.5 rounded-xl animate-in slide-in-from-top-2 duration-300">
                        <span className="text-xs font-bold text-brand-blue mr-2">
                            {Object.keys(rowSelection).length} seleccionados:
                        </span>
                        <Select 
                            value={assignedUserId}
                            onValueChange={(value) => setAssignedUserId(value)}
                        >
                            <SelectTrigger className="w-[180px] h-9 bg-surface-primary border border-border-base px-3 text-xs font-semibold focus:ring-1 focus:ring-brand-blue/20">
                                <SelectValue placeholder="Seleccionar Empleado..." />
                            </SelectTrigger>
                            <SelectContent position="popper" sideOffset={4} className="bg-surface-primary border-border-base z-[150] w-[--radix-select-trigger-width]">
                                {activeUsers.map(user => (
                                    <SelectItem 
                                        key={user.id} 
                                        value={String(user.id)}
                                        className="text-xs font-semibold cursor-pointer"
                                    >
                                        {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <button
                            onClick={() => setIsConfirmDialogOpen(true)}
                            disabled={isAssigning || !assignedUserId}
                            className="h-9 px-4 bg-brand-blue hover:bg-blue-600 disabled:bg-surface-secondary/60 disabled:text-content-tertiary disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                        >
                            <UserCheck size={14} />
                            {isAssigning ? 'Asignando...' : 'Asignar Tarea'}
                        </button>
                    </div>
                )
            }
            navigation={
                <div className="flex gap-1 py-2 overflow-x-auto max-w-[calc(100%-18rem)]">
                    <button
                        onClick={() => setActiveTab('today')}
                        className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                            activeTab === 'today' 
                                ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20' 
                                : 'text-content-secondary hover:bg-surface-secondary/60 hover:text-content-primary'
                        }`}
                    >
                        <Calendar size={16} />
                        Cumplen Hoy ({getFormattedDate(0)})
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === 'today' ? 'bg-brand-blue text-white' : 'bg-surface-tertiary text-content-secondary'}`}>
                            {todayCount}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('tomorrow')}
                        className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                            activeTab === 'tomorrow' 
                                ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' 
                                : 'text-content-secondary hover:bg-surface-secondary/60 hover:text-content-primary'
                        }`}
                    >
                        <Calendar size={16} />
                        Cumplen Mañana ({getFormattedDate(1)})
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === 'tomorrow' ? 'bg-brand-orange text-white' : 'bg-surface-tertiary text-content-secondary'}`}>
                            {tomorrowCount}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('after_tomorrow')}
                        className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                            activeTab === 'after_tomorrow' 
                                ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' 
                                : 'text-content-secondary hover:bg-surface-secondary/60 hover:text-content-primary'
                        }`}
                    >
                        <Calendar size={16} />
                        Pasado Mañana ({getFormattedDate(2)})
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === 'after_tomorrow' ? 'bg-purple-500 text-white' : 'bg-surface-tertiary text-content-secondary'}`}>
                            {afterTomorrowCount}
                        </span>
                    </button>
                </div>
            }
            table={table}
            totalRowCount={totalRowCount}
            isLoading={isLoading}
            isFetching={isFetching}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            setColumnFilters={setColumnFilters}
        />

        {/* Confirm Assignment Dialog */}
        <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <AlertDialogContent className="bg-surface-primary border-border-base text-content-primary">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                        <UserCheck className="text-brand-blue" size={22} />
                        ¿Confirmar asignación de revisión?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-content-secondary text-sm">
                        Se asignarán <strong>{Object.keys(rowSelection).length}</strong> cumpleaños al usuario seleccionado.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-surface-secondary text-content-secondary hover:bg-surface-tertiary">
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleAssign}
                        className="!bg-brand-blue hover:!bg-blue-600 text-white shadow-none"
                    >
                        Sí, asignar tarea
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Success / Error Notification using the new Alert component */}
        {activeNotification && (
            <div className="fixed bottom-6 right-6 z-[999] w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
                <Alert 
                    variant={activeNotification.type === 'error' ? 'destructive' : 'default'}
                    className={cn(
                        "shadow-2xl border p-4 md:p-5 rounded-2xl",
                        activeNotification.type === 'success' 
                            ? "bg-emerald-600 border-emerald-500 text-white" 
                            : "bg-red-600 border-red-500 text-white"
                    )}
                >
                    {activeNotification.type === 'success' ? (
                        <ShieldCheck size={20} className="text-white" />
                    ) : (
                        <AlertCircle size={20} className="text-white" />
                    )}
                    <AlertTitle className="font-bold uppercase text-xs tracking-wider text-white">
                        {activeNotification.type === 'success' ? 'Éxito' : 'Error'}
                    </AlertTitle>
                    <AlertDescription className="text-sm font-medium text-white/95 mt-1">
                        {activeNotification.message}
                    </AlertDescription>
                </Alert>
            </div>
        )}
    </>
  );
};

export default BirthdaysPage;
