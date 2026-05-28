import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, MapPin, UploadCloud, Folder } from 'lucide-react';

const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

const NavTabs = ({ activeTab, setActiveTab }) => {
    const token = localStorage.getItem('access_token');
    const payload = token ? parseJwt(token) : null;
    const rawRole = localStorage.getItem('role') || payload?.rol || payload?.role || payload?.user_role || '';

    const isAdmin = rawRole && ['admin', 'administrador'].includes(String(rawRole).toLowerCase());
    const tabs = [
        { id: 'relevamientos', label: 'Relevamientos', icon: MapPin },
        { id: 'encuestas', label: 'Encuestas', icon: ClipboardList },
        { id: 'carpeta', label: 'Carpeta', icon: Folder },
    ];
    if (isAdmin) {
        tabs.push({ id: 'importar', label: 'Importar Datos', icon: UploadCloud });
    }

    return (
        <div className="flex justify-center mt-2 px-4 shadow-border-base overflow-x-auto scrollbar-hide py-2">
            <div className={`bg-surface-primary/60 backdrop-blur-sm p-1.5 rounded-full flex gap-1 shadow-sm ${tabs.length > 2 ? 'max-w-auto w-fit md:max-w-lg' : 'max-w-sm w-full'} border border-border-base relative`}>

                {/* Iteramos sobre las pestañas dinámicamente */}
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-semibold z-10 transition-colors whitespace-nowrap ${isActive ? 'text-brand-blue' : 'text-content-secondary'
                                }`}
                        >
                            <Icon size={18} />
                            {tab.label}

                            {/* El "Pill" animado */}
                            {isActive && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute inset-0 bg-surface-primary rounded-full shadow-md ring-1 ring-black/5 dark:ring-white/5 z-[-1]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    );
                })}

            </div>
        </div>
    );
};

export default NavTabs;