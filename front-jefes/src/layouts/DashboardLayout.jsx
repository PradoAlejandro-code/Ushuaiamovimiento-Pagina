import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, PlusCircle, LogOut, ClipboardList, Settings, Phone, BarChart, Sun, Moon } from 'lucide-react';

const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const [theme, setTheme] = useState(() => {
        // Prioritize Cookie for cross-domain sync
        const getCookie = (name) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
        };
        return getCookie('theme') || localStorage.getItem('theme') || 'light';
    });

    // Sincronizar con la etiqueta HTML <html> para evitar flash y asegurar persistencia
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = (newTheme) => {
        setTheme(newTheme);
        // 1. Local Storage
        localStorage.setItem('theme', newTheme);
        // 2. Global Cookie for Subdomains
        document.cookie = `theme=${newTheme}; path=/; domain=.ushuaiamovimiento.com.ar; max-age=31536000; SameSite=Lax`;
    };

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: Home },
        { path: '/create-survey', label: 'Crear Encuesta', icon: PlusCircle },
        { path: '/relevamiento', label: 'Relevamiento', icon: ClipboardList },
        { path: '/surveys', label: 'Gestionar', icon: Settings },
        { path: '/analytics', label: 'Analytics', icon: BarChart },
        { path: '/contacts', label: 'Contactos', icon: Phone },
    ];

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_name');
        window.location.href = 'https://ushuaiamovimiento.com.ar/login';
    };

    return (
        <div className="flex min-h-screen font-sans transition-colors duration-300 bg-surface-primary text-content-primary">

            {/* Botón Mobile */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fixed top-4 left-4 z-50 p-2 bg-surface-secondary text-content-primary rounded-lg shadow-lg lg:hidden border border-border-base"
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay Mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-50 h-screen w-72 bg-surface-secondary shadow-xl flex flex-col border-r border-border-base
                
                /* FORZAMOS AL GPU A PINTAR ESTO EN UNA CAPA APARTE PARA EVITAR LAG */
                will-change-transform 
                transition-[transform,background-color,border-color] duration-300 ease-in-out
                
                ${sidebarOpen ? "translate-x-0" : ""}
                ${!sidebarOpen ? "max-lg:-translate-x-full" : ""}
                lg:!translate-x-0
            `}>
                {/* Banner - Configurado para ancho completo */}
                <div className="flex items-center justify-center px-6 py-6 min-h-[5rem]">
                    <img
                        src="/mopof-banner.png"
                        alt="MOPOF Banner"
                        className="w-full h-auto object-contain dark:block hidden"
                    />
                    <img
                        src="/mopof-banner.png"
                        alt="MOPOF Banner"
                        className="w-full h-auto object-contain dark:hidden block opacity-90 mix-blend-multiply"
                    />
                </div>

                {/* Navegación */}
                <nav className="p-4 space-y-2 mt-2 flex-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                                    ? 'text-white shadow-lg shadow-blue-900/20'
                                    : 'text-content-secondary hover:text-content-primary hover:bg-surface-primary/50'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-brand-blue to-blue-600 opacity-100 -z-10 rounded-xl"></div>
                                )}
                                <Icon size={20} className={isActive ? 'text-white' : 'text-content-secondary group-hover:text-brand-orange transition-colors'} />
                                <span className="font-medium tracking-wide">{item.label}</span>
                                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-orange shadow-[0_0_8px_var(--color-brand-orange)]"></div>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer con Toggle */}
                <div className="p-6 border-t border-border-base space-y-4">
                    <div className="flex items-center justify-between bg-surface-primary p-1 rounded-lg border border-border-base">
                        <button
                            onClick={() => toggleTheme('light')}
                            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'light'
                                ? 'bg-white text-brand-orange shadow-sm border border-gray-200'
                                : 'text-content-secondary hover:text-content-primary'
                                }`}
                        >
                            <Sun size={14} /> Light
                        </button>
                        <button
                            onClick={() => toggleTheme('dark')}
                            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'dark'
                                ? 'bg-gray-700 text-brand-blue shadow-sm border border-gray-600'
                                : 'text-content-secondary hover:text-content-primary'
                                }`}
                        >
                            <Moon size={14} /> Dark
                        </button>
                    </div>

                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-content-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                        <LogOut size={20} /> <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen bg-surface-primary relative transition-all duration-300 lg:ml-72">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-normal fixed"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-normal fixed"></div>

                <main className="flex-1 overflow-auto p-4 pt-20 lg:p-8 relative z-10 scrollbar-thin scrollbar-thumb-border-base scrollbar-track-transparent">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;