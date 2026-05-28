// HomePageNew.jsx — Layout bento box
// Líneas rojas TEMPORALES para visualizar la cuadrícula

import { useState, useMemo, useEffect } from 'react';
import { useGlobalStats, useRecentResponses } from '@/queries/useStats';
import { useSurveyResponseDetail } from '@/queries/useSurveys';
import { usePendingObservations, useResolveObservation } from '@/queries/useBirthdays';
import SurveyResponseDetailCard from '@/components/survey/SurveyResponseDetailCard';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { MessageSquare, TrendingUp, CheckCircle2, Gift, Calendar, Check, ChevronDown, Bell, AlertCircle, Eye, User, CreditCard, Phone, Mail, Briefcase, MapPin, ShieldCheck, ShieldAlert } from 'lucide-react';
import MetricCard from '../components/Analytics/MetricCard';
import ChartCard from '../components/Analytics/ChartCard';
import AssignedBirthdaysCard from '../components/Analytics/AssignedBirthdaysCard';
import RecentActivity from '../components/Analytics/RecentActivity';
import Card from '../components/ui/Card';
import { Skeleton } from "@/components/ui/skeleton";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const PERIOD_OPTIONS = [
    { value: 'day',   label: 'Día' },
    { value: 'month', label: 'Mes' },
    { value: 'year',  label: 'Año' },
];

const formatDate = (dateStr) => {
    if (!dateStr) return 'S/D';
    try {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateStr;
    }
};

const InfoItem = ({ label, value, icon: Icon }) => (
    <div className="p-3 bg-surface-secondary/50 rounded-xl border border-border-base/50 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-1 text-content-tertiary">
            <Icon size={12} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-sm font-bold text-content-primary truncate" title={value || 'S/D'}>
            {value || 'S/D'}
        </p>
    </div>
);

export default function HomePage() {
    const [period, setPeriod] = useState('day');
    const [selectedResponseId, setSelectedResponseId] = useState(null);
    const [selectedObs, setSelectedObs] = useState(null);
    const [isObsOpen, setIsObsOpen] = useState(false);
    const [activeNotification, setActiveNotification] = useState(null);

    const closeObsModal = () => {
        setIsObsOpen(false);
        setTimeout(() => setSelectedObs(null), 300);
    };

    useEffect(() => {
        if (activeNotification) {
            const timer = setTimeout(() => {
                setActiveNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [activeNotification]);
    const { data: selectedResponseRaw, isLoading: loadingResponseDetail } = useSurveyResponseDetail(selectedResponseId);

    const selectedResponse = useMemo(() => {
        if (!selectedResponseRaw) return null;
        const data = { ...selectedResponseRaw };
        const sourceDetails = data.detalles_completos || data.detalles || [];
        if (sourceDetails.length) {
            data.detalles = sourceDetails.map(detalle => ({
                ...detalle,
                pregunta_id: detalle.pregunta_id !== undefined ? detalle.pregunta_id : detalle.pregunta
            }));
        }
        return data;
    }, [selectedResponseRaw]);

    const { data: recentData, isLoading: loadingRecent } = useRecentResponses();
    const responses = recentData?.results || recentData || [];

    const { data: statsData, isLoading: loadingStats } = useGlobalStats(period, 'user');
    const { data: pendingObservations = [], isLoading: loadingObservations } = usePendingObservations();
    const { mutate: resolveObs } = useResolveObservation();

    const isLoading = loadingRecent || loadingStats;
    const birthdays = statsData?.birthdays || { today: [], after_tomorrow: [] };
    const stats = statsData?.chart_data || [];
    const s     = statsData?.summary   || {};

    const metrics = {
        total:             s.total_respuestas    || 0,
        hoy:               s.movimientos_hoy     || 0,
        trendHoy:          s.trend_hoy           || 0,
        relevamientos:     s.total_relevamientos || 0,
        trendRelev:        s.trend_relev         || 0,
        cumplesEntregados: s.cumples_entregados  || 0,
    };

    const currentLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label;

    const PeriodSelector = (
        <div className="w-full md:w-auto">
            <div className="hidden md:flex bg-surface-secondary/50 p-1 rounded-lg border border-border-base">
                {PERIOD_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setPeriod(opt.value)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase whitespace-nowrap ${
                            period === opt.value
                                ? 'bg-brand-blue text-white shadow-sm'
                                : 'text-content-secondary hover:text-content-primary'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            <div className="md:hidden">
                <Listbox value={period} onChange={setPeriod}>
                    <ListboxButton className="w-32 flex items-center justify-between bg-surface-secondary/50 text-content-primary text-[10px] font-bold uppercase px-3 py-2 rounded-lg border border-border-base">
                        <div className="flex items-center gap-2">
                            <Calendar size={12} className="text-brand-blue" />
                            <span>{currentLabel}</span>
                        </div>
                        <ChevronDown size={12} className="text-content-secondary" />
                    </ListboxButton>
                    <ListboxOptions anchor="bottom end" className="w-32 bg-surface-secondary border border-border-base rounded-xl shadow-2xl p-1 z-[9999] focus:outline-none">
                        {PERIOD_OPTIONS.map((opt) => (
                            <ListboxOption
                                key={opt.value}
                                value={opt.value}
                                className="group flex cursor-pointer items-center justify-between gap-2 rounded-lg py-2 px-3 text-[10px] font-bold uppercase text-content-secondary hover:bg-surface-primary hover:text-content-primary data-[selected]:bg-brand-blue/10 data-[selected]:text-brand-blue"
                            >
                                {opt.label}
                                <Check size={12} className="invisible group-data-[selected]:visible" />
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </Listbox>
            </div>
        </div>
    );

    return (
        <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:[grid-template-rows:120px_550px_550px]"
        >
            {/* ── FILA 1: Métricas ── */}
            <div className="col-span-1 lg:h-full">
                {isLoading ? <Skeleton className="h-full w-full rounded-2xl" /> : (
                    <MetricCard title="Total Respuestas" value={metrics.total} icon={MessageSquare} variant="orange" className="lg:h-full w-full" />
                )}
            </div>
            <div className="col-span-1 lg:h-full">
                {isLoading ? <Skeleton className="h-full w-full rounded-2xl" /> : (
                    <MetricCard title="Movimientos Hoy" value={metrics.hoy} trend={metrics.trendHoy} trendLabel="vs. día anterior" icon={TrendingUp} variant="green" className="lg:h-full w-full" />
                )}
            </div>
            <div className="col-span-1 lg:h-full">
                {isLoading ? <Skeleton className="h-full w-full rounded-2xl" /> : (
                    <MetricCard title="Relevamientos" value={metrics.relevamientos} trend={metrics.trendRelev} trendLabel="vs. mes anterior" icon={CheckCircle2} variant="blue" className="lg:h-full w-full" />
                )}
            </div>
            <div className="col-span-1 lg:h-full">
                {isLoading ? <Skeleton className="h-full w-full rounded-2xl" /> : (
                    <MetricCard title="Cumples Entregados" value={metrics.cumplesEntregados} icon={Gift} variant="blue" className="lg:h-full w-full" />
                )}
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-1 lg:h-full">
                {isLoading || loadingObservations ? <Skeleton className="h-full w-full rounded-2xl" /> : (
                    <MetricCard 
                        title="Observaciones Pendientes" 
                        value={pendingObservations.length} 
                        icon={Bell} 
                        variant="orange" 
                        className="lg:h-full w-full" 
                    />
                )}
            </div>

            {/* ── FILA 2: ChartCard (3 cols) + 2 birthday cards ── */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 min-h-[400px] lg:h-full">
                {isLoading ? <Skeleton className="h-full w-full rounded-2xl" /> : (
                    <ChartCard
                        dataPregunta={{ titulo: 'Ranking de Usuarios', extraType: 'users', data: stats }}
                        action={PeriodSelector}
                        className="h-full w-full"
                    />
                )}
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-2 h-[300px] lg:h-full">
                {isLoading ? <Skeleton className="h-full w-full rounded-2xl" /> : (
                    <AssignedBirthdaysCard people={birthdays.today} className="h-full w-full" />
                )}
            </div>

            {/* ── FILA 3: Actividad Reciente (2 cols) + Observaciones (2 cols) + 1 libre ── */}
            <div className="col-span-1 md:col-span-2 min-h-[400px] lg:h-full">
                {isLoading ? <Skeleton className="h-full w-full rounded-2xl" /> : (
                    <RecentActivity responses={responses.slice(0, 5)} onViewDetail={setSelectedResponseId} className="h-full w-full" />
                )}
            </div>
            
            <div className="col-span-1 md:col-span-2 min-h-[400px] lg:h-full">
                {isLoading || loadingObservations ? <Skeleton className="h-full w-full rounded-2xl" /> : (
                    <Card className="h-full w-full flex flex-col !p-0 overflow-hidden border-border-base">
                        {/* Header compacto tipo Actividad Reciente */}
                        <div className="px-4 py-3 shrink-0 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={16} className="text-content-secondary" />
                                <h3 className="text-sm font-bold text-content-primary uppercase tracking-wide">Observaciones a Resolver</h3>
                            </div>
                            {pendingObservations.length > 0 && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                                    {pendingObservations.length} Pendiente{pendingObservations.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex-1 flex flex-col divide-y divide-border-base/50 overflow-y-auto custom-scrollbar pt-1">
                            {pendingObservations.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-content-secondary italic text-sm py-10">
                                    No hay observaciones pendientes a revisar.
                                </div>
                            ) : (
                                pendingObservations.map((obs) => {
                                    const cumpleaneroNombre = `${obs.persona?.first_name || ''} ${obs.persona?.last_name || ''}`.trim() || `DNI ${obs.persona?.dni || ''}`;
                                    return (
                                        <div 
                                            key={obs.id}
                                            className="flex items-center px-4 py-3.5 gap-3 hover:bg-surface-secondary/40 transition-colors min-h-[72px]"
                                        >
                                            {/* Avatar del empleado que hizo la observación */}
                                            <div className="shrink-0">
                                             <Avatar className="size-9 ring-2 ring-border-base/50" size="default">
                                                    <AvatarImage src={obs.empleado_picture} alt={obs.empleado_nombre} />
                                                    <AvatarFallback className="bg-brand-blue/15 text-brand-blue text-[10px] font-bold uppercase">
                                                        {obs.empleado_nombre ? obs.empleado_nombre.slice(0, 2).toUpperCase() : '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <p className="text-[13px] font-extrabold text-content-primary truncate">
                                                        {obs.empleado_nombre}
                                                    </p>
                                                    <div className="shrink-0 inline-flex items-center px-2 py-0.5 rounded bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                                                        <span className="text-[11px] font-black uppercase tracking-wider">
                                                            DNI {obs.persona?.dni}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Boton de ojo para abrir detalle */}
                                            <button
                                                onClick={() => { setSelectedObs(obs); setIsObsOpen(true); }}
                                                className="p-2.5 text-content-secondary hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-all shrink-0"
                                                title="Ver observación"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                )}
            </div>

            <div className="col-span-1 min-h-[200px] lg:h-full">
            </div>

            {/* Modal de Detalle de Respuesta */}
            {(selectedResponse || loadingResponseDetail) && (
                <div className="fixed top-0 right-0 bottom-0 left-0 lg:left-20 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 pt-16 md:p-6 animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl relative h-full max-h-screen md:max-h-[90vh]">
                        <SurveyResponseDetailCard
                            respuesta={selectedResponse}
                            isLoading={loadingResponseDetail}
                            onBack={() => setSelectedResponseId(null)}
                        />
                    </div>
                </div>
            )}

            {/* Modal de Detalle de Observación (Reutiliza el diseño premium de Detalle de Persona) */}
            <Dialog open={isObsOpen} onOpenChange={(open) => !open && closeObsModal()}>
                <DialogContent className="sm:max-w-2xl bg-surface-primary border-border-base p-0 overflow-hidden text-content-primary">
                    <DialogHeader className="p-6 border-b border-border-base bg-surface-secondary/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-2xl">
                                <User size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-content-primary">Detalle de Persona</DialogTitle>
                                <p className="text-xs text-content-tertiary uppercase tracking-widest font-medium">Información Registrada</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar text-content-primary">
                        {selectedObs && selectedObs.persona && (
                            <>
                                {/* Estado Afiliación */}
                                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${selectedObs.persona.is_affiliate
                                        ? 'bg-green-500/10 border-green-500/20 text-green-500'
                                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                                    }`}>
                                    {selectedObs.persona.is_affiliate ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                                    <span className="text-sm font-bold uppercase tracking-wider">
                                        {selectedObs.persona.is_affiliate ? 'Afiliado' : 'No Afiliado'}
                                    </span>
                                </div>

                                {/* Grilla de información de la persona */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <InfoItem label="Apellido" value={selectedObs.persona.last_name} icon={User} />
                                    <InfoItem label="Nombre" value={selectedObs.persona.first_name} icon={User} />
                                    <InfoItem label="DNI" value={selectedObs.persona.dni} icon={CreditCard} />
                                    <InfoItem label="Teléfono" value={selectedObs.persona.phone} icon={Phone} />
                                    <InfoItem label="Email" value={selectedObs.persona.email} icon={Mail} />
                                    <InfoItem label="Fecha Nac." value={formatDate(selectedObs.persona.birth_date)} icon={Calendar} />
                                    <InfoItem label="Profesión" value={selectedObs.persona.profession} icon={Briefcase} />
                                    <InfoItem label="Domicilio" value={selectedObs.persona.address} icon={MapPin} />
                                    <InfoItem label="Ciudad" value={selectedObs.persona.city} icon={MapPin} />
                                </div>

                                {/* Bloque de Observación adicional abajo */}
                                <div className="bg-surface-secondary/50 border border-border-base/50 p-4 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2 text-content-tertiary mb-1">
                                        <AlertCircle size={14} className="text-brand-orange" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Observación</span>
                                    </div>
                                    <p className="text-xs text-content-primary bg-surface-primary/70 border border-border-base/80 p-3.5 rounded-lg italic">
                                        "{selectedObs.observacion}"
                                    </p>
                                </div>

                                {/* Footer con acciones */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={closeObsModal}
                                        className="flex-1 bg-surface-secondary hover:bg-surface-secondary/80 border border-border-base text-content-primary text-[11px] font-extrabold uppercase py-3 rounded-xl transition-all"
                                    >
                                        Volver
                                    </button>
                                    <button
                                        onClick={() => {
                                            resolveObs(selectedObs.id, {
                                                onSuccess: () => {
                                                    setActiveNotification({
                                                        type: 'success',
                                                        message: 'Ya se marcó como resuelta la observación'
                                                    });
                                                    closeObsModal();
                                                }
                                            });
                                        }}
                                        className="flex-1 bg-brand-blue hover:bg-brand-blue/80 text-white text-[11px] font-extrabold uppercase py-3 rounded-xl transition-all shadow-sm"
                                    >
                                        Resolver
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success / Error Notification using the exact same Alert component as BirthdaysPage */}
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
        </div>
    );
}
