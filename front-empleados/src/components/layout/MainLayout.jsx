import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Folder, Gift, MoreHorizontal, Sun, Moon, LogOut } from 'lucide-react';
import { API_URL } from '../../api';
import { useCurrentUser } from '../../queries/useUser';
import { useBirthdaysList } from '../../queries/useBirthdays';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

const MainLayout = () => {
    const { theme, setTheme } = useTheme();
    const location = useLocation();
    
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);

    // Sync Theme Cookie
    useEffect(() => {
        if (theme) {
            document.cookie = `theme=${theme}; path=/; domain=.ushuaiamovimiento.com.ar; max-age=31536000; SameSite=Lax`;
        }
    }, [theme]);

    // Fetch User Profile
    const { data: currentUser } = useCurrentUser();

    // Check Assigned and Undelivered Birthdays (refetches every 60s)
    const { data: birthdaysData } = useBirthdaysList('today', {
        refetchInterval: 60000,
        enabled: !!currentUser
    });

    const birthdaysList = birthdaysData?.results || birthdaysData || [];
    const hasAssignedBirthdays = currentUser ? birthdaysList.some(person => {
        const assignment = person.asignacion_actual;
        const isAssignedToMe = assignment && Number(assignment.empleado_id) === Number(currentUser.id);
        const isNotDelivered = assignment && !assignment.entregado;
        return isAssignedToMe && isNotDelivered;
    }) : false;

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_name');
        localStorage.removeItem('accesos');
        window.location.reload();
    };

    // Helper to determine active tab based on pathname
    const currentView = location.pathname === '/carpeta' ? 'carpeta' 
                      : location.pathname === '/cumpleanos' ? 'cumpleanos' 
                      : 'inicio';

    return (
        <div className="min-h-screen bg-surface-secondary pb-24 font-sans transition-colors duration-200 flex flex-col items-center">
            
            {/* Sleek Top Minimal Header */}
            <div className="sticky top-0 z-20 bg-surface-primary/85 backdrop-blur-md px-4 py-3.5 border-b border-border-base/50 flex justify-between items-center max-w-md w-full transition-colors duration-200">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-black tracking-widest text-brand-blue dark:text-brand-orange uppercase">Ushuaia Movimiento</span>
                </div>
                <button
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    className="p-2 rounded-xl bg-surface-secondary/50 border border-border-base text-content-secondary hover:text-brand-blue shadow-sm transition-all active:scale-95 cursor-pointer"
                    title="Cambiar tema"
                >
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
            </div>

            {/* Main Content Area */}
            <div className="w-full max-w-md px-4 pt-5 flex-1 flex flex-col justify-start">
                <Outlet context={{ currentUser }} />
            </div>

            {/* PREMIUM GLASS BOTTOM NAVBAR */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-primary/80 backdrop-blur-md border-t border-border-base/50 flex justify-center shadow-lg shadow-black/5">
                <div className="w-full max-w-md h-[76px] grid grid-cols-5 relative px-2 items-center">
                    
                    {/* Item 1: Inicio */}
                    <Link
                        to="/"
                        className={`flex flex-col items-center justify-center h-full gap-1 transition-all duration-200 cursor-pointer ${
                            currentView === 'inicio' ? 'text-brand-blue scale-105' : 'text-content-secondary hover:text-content-primary'
                        }`}
                    >
                        <HomeIcon size={24} strokeWidth={currentView === 'inicio' ? 2.5 : 2} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Inicio</span>
                    </Link>

                    {/* Item 2: Carpeta */}
                    <Link
                        to="/carpeta"
                        className={`flex flex-col items-center justify-center h-full gap-1 transition-all duration-200 cursor-pointer ${
                            currentView === 'carpeta' ? 'text-brand-blue scale-105' : 'text-content-secondary hover:text-content-primary'
                        }`}
                    >
                        <Folder size={24} strokeWidth={currentView === 'carpeta' ? 2.5 : 2} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Carpeta</span>
                    </Link>

                    {/* Item 3 (Center): Floating Profile Avatar */}
                    <div className="relative flex flex-col items-center h-full justify-start pt-1.5">
                        <div className="absolute -top-[24px] flex flex-col items-center gap-2.5">
                            <Avatar
                                onClick={() => setIsLogoutOpen(true)}
                                className="w-[64px] h-[64px] border-[3px] border-brand-blue dark:border-brand-orange cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.3)] dark:shadow-[0_0_15px_rgba(249,115,22,0.3)] active:scale-95 transition-all duration-300 bg-surface-primary"
                            >
                                <AvatarImage
                                    src={currentUser?.profile_picture ? `${API_URL}${currentUser.profile_picture}` : ''}
                                    alt={currentUser?.username}
                                />
                                <AvatarFallback className="bg-brand-blue/15 text-brand-blue font-black uppercase text-xs">
                                    {currentUser?.username ? currentUser.username.slice(0, 2) : '?'}
                                </AvatarFallback>
                            </Avatar>
                            <LogOut
                                onClick={() => setIsLogoutOpen(true)}
                                size={20}
                                className="text-red-500 hover:text-red-600 cursor-pointer transition-colors active:scale-90"
                                title="Cerrar sesión"
                            />
                        </div>
                    </div>

                    {/* Item 4: Cumpleaños */}
                    <Link
                        to="/cumpleanos"
                        className={`flex flex-col items-center justify-center h-full gap-1 transition-all duration-200 cursor-pointer ${
                            currentView === 'cumpleanos' 
                                ? (hasAssignedBirthdays ? 'scale-105' : 'text-brand-blue scale-105')
                                : (hasAssignedBirthdays ? '' : 'text-content-secondary hover:text-content-primary')
                        }`}
                    >
                        <div className="relative flex flex-col items-center justify-center">
                            <Gift 
                                size={24} 
                                strokeWidth={currentView === 'cumpleanos' ? 2.5 : 2} 
                                className={hasAssignedBirthdays ? "animate-purple-glow" : ""}
                            />
                            {hasAssignedBirthdays && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                                </span>
                            )}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${hasAssignedBirthdays ? "animate-purple-text" : ""}`}>
                            Cumples
                        </span>
                    </Link>

                    {/* Item 5: Más (Disabled) */}
                    <div
                        className="flex flex-col items-center justify-center h-full gap-1 opacity-35 cursor-not-allowed select-none"
                        title="Próximamente"
                    >
                        <MoreHorizontal size={24} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Más</span>
                    </div>

                </div>
            </div>

            {/* PREMIUM LOGOUT CONFIRMATION DIALOG */}
            {isLogoutOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-surface-primary border border-border-base rounded-[32px] p-6 w-full max-w-xs shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                        <div className="p-4 bg-red-500/10 text-red-500 rounded-3xl border border-red-500/20 mb-4 animate-pulse">
                            <LogOut size={26} />
                        </div>
                        <h3 className="text-base font-black text-content-primary uppercase tracking-wide mb-1">¿Cerrar Sesión?</h3>
                        <p className="text-[10px] text-content-tertiary uppercase tracking-widest font-black mb-3">Confirmación Requerida</p>
                        <p className="text-xs text-content-secondary leading-relaxed mb-6">
                            ¿Estás seguro de que deseas salir de tu cuenta? Deberás ingresar tus datos para volver a acceder.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setIsLogoutOpen(false)}
                                className="flex-1 py-3 bg-surface-secondary text-content-primary text-xs font-black uppercase tracking-wider rounded-2xl border border-border-base hover:bg-surface-secondary/80 transition-all active:scale-95 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={logout}
                                className="flex-1 py-3 bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl hover:bg-red-600 transition-all active:scale-95 shadow-md shadow-red-500/25 cursor-pointer"
                            >
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MainLayout;
