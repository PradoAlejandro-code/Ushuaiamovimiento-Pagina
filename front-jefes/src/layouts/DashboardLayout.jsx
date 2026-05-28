import React, { useEffect } from 'react';
import { useTheme } from "next-themes";
import { Outlet } from 'react-router-dom';
import NewSidebar from '../components/layout/NewSidebar';

const DashboardLayout = () => {
    const { theme, setTheme } = useTheme();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_name');
        window.location.href = 'https://ushuaiamovimiento.com.ar/login';
    };

    useEffect(() => {
        // Sincronizar cookie para subdominios solo si hay un tema definido
        if (theme) {
            document.cookie = `theme=${theme}; path=/; domain=.ushuaiamovimiento.com.ar; max-age=31536000; SameSite=Lax`;
        }
    }, [theme]);

    return (
        <div className="flex min-h-screen font-sans bg-surface-primary text-content-primary">
            <NewSidebar 
                handleLogout={handleLogout} 
                theme={theme} 
                setTheme={setTheme} 
            />

            {/* Main Content */}
            <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-surface-primary relative lg:ml-20 transition-all duration-700">
                {/* Fondos difuminados optimizados */}
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-normal fixed"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-normal fixed"></div>

                <main className="flex-1 overflow-auto p-4 pt-20 lg:p-8 relative z-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;