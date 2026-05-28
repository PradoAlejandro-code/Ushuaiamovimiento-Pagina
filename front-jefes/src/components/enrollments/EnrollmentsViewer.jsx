import React, { useState, useMemo, useEffect } from 'react';
import apiClient from '@/api/client';
import { Plus, Edit2, FileText, Settings, MoreVertical, ArrowDownAZ, ArrowUpZA, EyeOff, Filter, FilterX, Trash2, Info, Layout, Users, ChevronDown } from 'lucide-react';
import { useEnrollees, useDeleteEnrollees, useUpdateEnrollmentList, usePersonCities, usePersonWorkplaces, usePersonEmploymentStatuses } from '@/queries/useEnrollments';
import EnrolleeModal from './EnrolleeModal';
import ImportCSVModal from './ImportCSVModal';
import TablePageLayout from './TablePageLayout';
import MigrateToPeopleModal from './MigrateToPeopleModal';
import AddColumnModal from './AddColumnModal';
import EnrollmentInfoModal from './EnrollmentInfoModal';
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
import EnrollmentsConfigMenu from './EnrollmentsConfigMenu';

const EnrollmentsViewer = ({ enrollment }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
    const [rowSelection, setRowSelection] = useState({});
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const { data: citiesData } = usePersonCities(enrollment?.id);
    const { data: workplacesData } = usePersonWorkplaces(enrollment?.id);
    const { data: employmentStatusesData } = usePersonEmploymentStatuses(enrollment?.id);

    // === SOLUCIÓN AL ERROR 404 ===
    // Resetea la página a 1 (index 0) cada vez que el usuario cambia un filtro
    useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [columnFilters]);

    const { mutate: deleteEnrollees, isLoading: isDeleting } = useDeleteEnrollees();

    const [columnVisibility, setColumnVisibility] = useState(() => {
        return enrollment?.ui_settings?.columnVisibility || {};
    });

    // Sincronizar estado si cambia el listado seleccionado
    useEffect(() => {
        setColumnVisibility(enrollment?.ui_settings?.columnVisibility || {});
    }, [enrollment?.id, enrollment?.ui_settings?.columnVisibility]);

    const { mutate: updateEnrollment } = useUpdateEnrollmentList();

    // Persistencia en DB con debounce
    useEffect(() => {
        if (!enrollment?.id) return;
        
        const timeoutId = setTimeout(() => {
            // Solo guardamos si es diferente a lo que ya hay en el objeto enrollment
            const currentSaved = enrollment.ui_settings?.columnVisibility || {};
            if (JSON.stringify(currentSaved) !== JSON.stringify(columnVisibility)) {
                updateEnrollment({
                    id: enrollment.id,
                    data: {
                        ui_settings: {
                            ...enrollment.ui_settings,
                            columnVisibility
                        }
                    }
                });
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [columnVisibility, enrollment?.id, updateEnrollment]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEnrollee, setSelectedEnrollee] = useState(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isMigrateModalOpen, setIsMigrateModalOpen] = useState(false);
    const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    const apiFilters = useMemo(() => {
        const filters = {};
        columnFilters.forEach(f => { 
            if (f.value && f.value !== 'all') {
                filters[f.id] = f.value; 
            }
        });
        if (globalFilter && enrollment?.fields?.[0]?.name) {
            filters[enrollment.fields[0].name] = globalFilter;
        }
        return filters;
    }, [columnFilters, globalFilter, enrollment]);

    const { data: enrolleesData, isFetching, isLoading, refetch } =
        useEnrollees(enrollment?.id, pagination.pageIndex + 1, apiFilters, sorting);

    const data = useMemo(() => enrolleesData?.results ?? [], [enrolleesData]);
    const totalRowCount = enrolleesData?.count ?? 0;
    const pageCount = Math.ceil(totalRowCount / pagination.pageSize);


    const columns = useMemo(() => {
        if (!enrollment) return [];

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

        const getColumnDefaultSize = (colId, colHeader) => {
            const id = String(colId || '').toLowerCase();
            const header = String(colHeader || '').toLowerCase();
            if (id === 'dni' || header === 'dni') return 100;
            if (id === 'last_name' || id === 'apellido' || header.includes('apellido')) return 140;
            if (id === 'first_name' || id === 'nombre' || header.includes('nombre')) return 140;
            if (id === 'gender' || id === 'género' || header.includes('géner') || header.includes('sexo')) return 90;
            if (id === 'age' || id === 'edad' || header.includes('edad')) return 75;
            if (id === 'phone' || id === 'teléfono' || header.includes('tel') || header.includes('cel')) return 120;
            if (id === 'city' || id === 'ciudad' || header.includes('ciudad') || header.includes('localidad')) return 130;
            if (id === 'address' || id === 'domicilio' || header.includes('domicilio') || header.includes('direc') || header.includes('calle')) return 200;
            if (id === 'is_affiliate' || id === 'afiliación' || id === 'afiliado' || header.includes('afili')) return 130;
            if (id === 'email' || header.includes('mail') || header.includes('correo')) return 160;
            return 150;
        };

        const base = (enrollment?.table_columns || []).map(col => {
            const accessorKey = col.accessorKey;
            let filterMeta = undefined;

            // Inyectar filtros de Dropdown para Ciudad y Afiliado
            if (accessorKey === 'person.is_affiliate' || col.id === 'is_affiliate' || col.id?.toLowerCase() === 'afiliado') {
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
            } else if (accessorKey === 'person.city' || col.id === 'city' || col.id?.toLowerCase() === 'ciudad') {
                const cityOptions = [
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
                                {cityOptions.map(opt => (
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
            } else if (accessorKey === 'person.workplace' || col.id === 'workplace' || col.id?.toLowerCase() === 'workplace' || col.header?.toUpperCase() === 'LUGAR DE TRABAJO') {
                const workplaceOptions = [
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
                                {workplaceOptions.map(opt => (
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
            } else if (accessorKey === 'person.employment_status' || col.id === 'employment_status' || col.id?.toLowerCase() === 'employment_status' || col.header?.toUpperCase() === 'ESTADO EMPLEADO') {
                const statusOptions = [
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
                                {statusOptions.map(opt => (
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
                headerLabel: col.header || col.id,
                size: col.width || col.size || getColumnDefaultSize(col.id, col.header),
                accessorFn: (row) => {
                    if (accessorKey.includes('.')) {
                        const [obj, key] = accessorKey.split('.');
                        const val = row[obj]?.[key];
                        if (val !== undefined && val !== null && val !== "") return val;
                        
                        // Fallback: Si no hay link a person o está vacío, buscar en dynamic_data
                        const fallbackKey = key === 'dni' ? 'DNI' : 
                                           key === 'first_name' ? 'NOMBRE' : 
                                           key === 'last_name' ? 'APELLIDO' : 
                                           key === 'email' ? 'EMAIL' : key.toUpperCase();
                        return row.dynamic_data?.[fallbackKey] || row.dynamic_data?.[key];
                    }
                    return row.dynamic_data?.[accessorKey] || row.dynamic_data?.[col.id];
                },
                header: ({ column }) => (
                    <div className="flex items-center justify-between group min-w-[140px]">
                        <span className="truncate font-semibold text-content-primary">{col.header || col.id}</span>
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
                    const isAffiliateCol = col.accessorKey.toLowerCase().includes('is_affiliate') || 
                                          col.header?.toUpperCase() === 'AFILIADO';
                    
                    if (isAffiliateCol) {
                        const isTrue = val === true || val === 1 || String(val).toLowerCase() === 'true' || String(val).toUpperCase() === 'SI' || String(val).toUpperCase() === 'AFILIADO';
                        return (
                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${isTrue ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                {isTrue ? 'AFILIADO' : 'NO AFILIADO'}
                            </div>
                        );
                    }

                    const isBirthDateCol = col.accessorKey?.toLowerCase().includes('birth_date') || 
                                           col.id?.toLowerCase().includes('birth_date') || 
                                           col.header?.toUpperCase().includes('FECHA NAC');
                    
                    if (isBirthDateCol && val) {
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
                meta: filterMeta,
            };
        });

        const actionColumn = {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <button onClick={() => { setSelectedEnrollee(row.original); setIsModalOpen(true); }} className="p-1.5 text-content-secondary hover:text-brand-blue hover:bg-brand-blue/10 rounded-md transition-colors"><Edit2 size={16} /></button>
            ),
            size: 50,
            enableColumnFilter: false,
        };

        return [selectionColumn, actionColumn, ...base];
    }, [enrollment, citiesData]);

    const table = useReactTable({
        data, columns, pageCount, state: { sorting, columnFilters, pagination, columnVisibility, rowSelection },
        onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, onPaginationChange: setPagination,
        onColumnVisibilityChange: setColumnVisibility, onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(),
        manualFiltering: true, manualPagination: true, manualSorting: true,
        getRowId: (row) => row.id,
    });

    const handleDeleteSelected = () => {
        const selectedIds = Object.keys(rowSelection);
        if (selectedIds.length === 0) return;
        
        deleteEnrollees({ ids: selectedIds }, {
            onSuccess: () => {
                setRowSelection({});
                setIsDeleteDialogOpen(false);
                refetch();
            }
        });
    };

    if (!mounted) return null;
    if (!enrollment) return <div className="p-10 text-center text-content-secondary font-medium">No hay ningún listado de enrollments seleccionado</div>;

    return (
        <>
            <TablePageLayout
                title={enrollment.name}
                subtitle="Gestión del padrón y administración de columnas personalizadas."
                icon={Users}
                iconColorClass="bg-brand-blue/10 text-brand-blue border-brand-blue/20"
                badgeCount={totalRowCount}
                headerActions={
                    <button 
                        onClick={() => setIsImportModalOpen(true)} 
                        className="flex items-center gap-2 px-3 py-1.5 bg-surface-primary border border-border-base rounded-lg text-sm font-medium text-content-secondary hover:bg-surface-secondary transition-all"
                    >
                        <FileText size={16} /> Importar
                    </button>
                }
                toolbarActions={
                    <>
                        {Object.keys(rowSelection).length > 0 && (
                            <button
                                onClick={() => setIsDeleteDialogOpen(true)}
                                disabled={isDeleting}
                                className="h-9 px-3 rounded-xl transition-colors flex items-center gap-2 text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20"
                            >
                                <Trash2 size={16} />
                                Borrar {Object.keys(rowSelection).length}
                            </button>
                        )}
                        <button 
                            onClick={() => setIsAddColumnModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 rounded-lg transition-colors text-xs font-bold"
                        >
                            <Layout size={14} />
                            Agregar Columna
                        </button>
                    </>
                }
                configMenu={
                    <EnrollmentsConfigMenu 
                        table={table} 
                        enrollment={enrollment}
                        onMigrate={() => setIsMigrateModalOpen(true)} 
                        onOpenInfo={() => setIsInfoModalOpen(true)}
                    />
                }
                table={table}
                totalRowCount={totalRowCount}
                isLoading={isLoading}
                isFetching={isFetching}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                setColumnFilters={setColumnFilters}
            />

            <EnrolleeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaved={refetch} padron={enrollment} enrollee={selectedEnrollee} />
            <ImportCSVModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} enrollment={enrollment} onImported={refetch} />

            <MigrateToPeopleModal 
                isOpen={isMigrateModalOpen} 
                onClose={() => setIsMigrateModalOpen(false)} 
                enrollment={enrollment} 
                onMigrated={refetch} 
            />

            <AddColumnModal 
                isOpen={isAddColumnModalOpen} 
                onClose={() => setIsAddColumnModalOpen(false)} 
                enrollmentId={enrollment.id}
                onColumnAdded={refetch}
            />

            <EnrollmentInfoModal 
                isOpen={isInfoModalOpen} 
                onClose={() => setIsInfoModalOpen(false)} 
                enrollment={enrollment} 
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación masiva?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el padrón y todos los registros asociados a él. 
                            <br /><br />
                            <strong>Nota:</strong> Las personas registradas en la base central <strong>NO</strong> serán eliminadas; solo se borrará su vinculación con este padrón específico y cualquier dato adicional guardado aquí.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteSelected}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Eliminando...' : 'Sí, eliminar registros'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default EnrollmentsViewer;