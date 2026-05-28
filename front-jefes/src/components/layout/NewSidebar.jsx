import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, PlusCircle, LogOut, Phone, MapPinned, MapPinPlus,
    MessagesSquare, ListChecks, FileSearch, FileBarChart,
    FilePlus2, Eye, ChevronDown, Users, Sun, Moon, Menu, User, UserSquare2,
    Gift, LayoutGrid
} from 'lucide-react';
import { getAvatarUrl } from '@/utils/chartConfig';
import { useProfile } from '@/queries/useAuth';

const NavDropdown = ({ item, isActive, isOpen, isHovered, isMobile, toggleMenu, ICON_SIZE, ITEM_HEIGHT, ICON_WRAPPER_WIDTH }) => {
    const location = useLocation();
    const Icon = item.icon;
    const showContent = isMobile || isHovered;

    return (
        <div className="relative group">
            <button
                onClick={(e) => toggleMenu(e, item.label)}
                className={`
                    w-full flex items-center ${ITEM_HEIGHT} transition-colors duration-300
                    ${isActive ? 'bg-brand-blue/5 text-brand-blue' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white'}
                `}
            >
                <div className={`${ICON_WRAPPER_WIDTH} ${ITEM_HEIGHT} flex items-center justify-center shrink-0`}>
                    <Icon size={ICON_SIZE} />
                </div>

                <div className={`flex items-center justify-between overflow-hidden whitespace-nowrap shrink-0 w-[180px] transition-all duration-500 ease-in-out transform-gpu ${showContent ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    <span className="font-semibold text-left">{item.label}</span>
                    <div className="pr-4 shrink-0">
                        <ChevronDown size={16} className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </button>

            <AnimatePresence initial={false}>
                {showContent && isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-1 pb-2 pt-2">
                            {item.items.map(sub => (
                                <Link
                                    key={sub.path}
                                    to={sub.path}
                                    className={`
                                        ml-[68px] mr-4 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 whitespace-nowrap
                                        ${location.pathname === sub.path ? 'text-brand-blue bg-brand-blue/10' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}
                                    `}
                                >
                                    {sub.label}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const NewSidebar = ({ handleLogout, theme, setTheme }) => {
    const location = useLocation();
    const [isHovered, setIsHovered] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState({});

    const { data: profile } = useProfile();

    const userData = {
        name: profile?.username || profile?.name || localStorage.getItem('user_name') || 'Usuario',
        photo: profile?.profile_picture || profile?.avatar || localStorage.getItem('user_photo') || null
    };

    const menuItems = [
        { path: '/', label: 'Inicio', icon: Home },
        {
            label: 'Relevamiento',
            icon: MapPinned,
            isDropdown: true,
            items: [
                { path: '/relevamiento', label: 'Editar', icon: MapPinPlus },
                { path: '/relevamiento/responses', label: 'Respuestas', icon: MessagesSquare },
            ]
        },
        {
            label: 'Encuestas',
            icon: ListChecks,
            isDropdown: true,
            items: [
                { path: '/create-survey', label: 'Crear', icon: PlusCircle },
                { path: '/surveys', label: 'Gestionar', icon: FileSearch },
            ]
        },
        {
            label: 'Informes',
            icon: FileBarChart,
            isDropdown: true,
            items: [
                { path: '/create-report', label: 'Nuevo', icon: FilePlus2 },
                { path: '/reports', label: 'Ver todos', icon: Eye },
            ]
        },
        { path: '/contacts', label: 'Agenda de Seguimiento', icon: Phone },
        {
            label: 'Ciudadanos',
            icon: Users,
            isDropdown: true,
            items: [
                { path: '/neighbors', label: 'Vecinos', icon: UserSquare2 },
                { path: '/Enrollments', label: 'Padrones', icon: Users },
                { path: '/birthdays', label: 'Cumpleaños', icon: Gift },
            ]
        },
        { path: '/respuestas-demo', label: 'Respuestas Demo', icon: LayoutGrid },
        { path: '/agenda-demo', label: 'Agenda Demo', icon: LayoutGrid },
    ];

    useEffect(() => {
        const activeDropdown = menuItems.find(item =>
            item.isDropdown && item.items.some(sub => sub.path === location.pathname)
        );
        if (activeDropdown) setOpenMenus({ [activeDropdown.label]: true });
        setIsMobileOpen(false);
    }, [location.pathname]);

    // Bloquear el scroll del body cuando el menú móvil está abierto
    useEffect(() => {
        if (isMobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileOpen]);

    const toggleMenu = (e, label) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenus(prev => ({ [label]: !prev[label] }));
    };

    const ICON_SIZE = 22;
    const ITEM_HEIGHT = 'h-14';
    const ICON_WRAPPER_WIDTH = 'w-20';
    const sidebarTransition = { duration: 0.4, ease: 'easeInOut' };

    return (
        <>
            <AnimatePresence>
                {!isMobileOpen && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setIsMobileOpen(true)}
                        className="lg:hidden fixed top-4 left-4 z-[110] p-2 text-zinc-500 bg-transparent border-none outline-none shadow-none"
                    >
                        <Menu size={28} />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }} // Overlay suave
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                initial={false}
                animate={{
                    width: isMobileOpen ? 288 : (isHovered ? 288 : 80),
                    x: isMobileOpen ? 0 : (window.innerWidth < 1024 ? -288 : 0)
                }}
                transition={sidebarTransition}
                className={`fixed top-0 left-0 z-[100] h-[100dvh] bg-surface-secondary backdrop-blur-2xl border-r border-border-base flex flex-col overflow-hidden lg:translate-x-0 ${isHovered || isMobileOpen ? 'shadow-2xl shadow-black/10' : ''}`}
            >
                <div className="h-24 w-full flex items-center justify-start shrink-0 px-3">
                    <motion.div
                        animate={{ width: (isHovered || isMobileOpen) ? 260 : 56 }}
                        transition={sidebarTransition}
                        className="relative h-14 rounded-full overflow-hidden shrink-0 transform-gpu"
                    >
                        <motion.div
                            animate={{ opacity: (isHovered || isMobileOpen) ? 0 : 1 }}
                            transition={{ duration: isHovered ? 0.1 : 0.4 }}
                            className="absolute left-0 top-0 w-14 h-14 z-10 flex items-center justify-center pointer-events-none"
                        >
                            <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                <clipPath id="circleClip">
                                    <circle cx="50" cy="50" r="50" />
                                </clipPath>
                                <g clipPath="url(#circleClip)">
                                    <rect width="100" height="100" fill="#1774b6" />
                                    <polygon points="0,0 52,0 48,100 0,100" fill="#f78f1e" />
                                </g>
                            </svg>
                        </motion.div>

                        <motion.div
                            animate={{ opacity: (isHovered || isMobileOpen) ? 1 : 0 }}
                            transition={{ duration: 0.4 }}
                            className="absolute left-0 top-0 w-[260px] h-14 z-0 bg-[#1774b6] pointer-events-none"
                        >
                            <img src="/mopof-banner.png" alt="Banner" className="w-full h-full object-cover object-left" />
                        </motion.div>
                    </motion.div>
                </div>

                <nav className="flex-1 px-0 space-y-1 mt-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.items?.some(sub => location.pathname === sub.path));
                        const isOpen = openMenus[item.label];
                        const isExpanded = isHovered || isMobileOpen;

                        return item.isDropdown ? (
                            <NavDropdown
                                key={item.label}
                                item={item}
                                isActive={isActive}
                                isOpen={isOpen}
                                isHovered={isHovered}
                                isMobile={isMobileOpen}
                                toggleMenu={toggleMenu}
                                ICON_SIZE={ICON_SIZE}
                                ITEM_HEIGHT={ITEM_HEIGHT}
                                ICON_WRAPPER_WIDTH={ICON_WRAPPER_WIDTH}
                            />
                        ) : (
                            <div key={item.label} className="relative group">
                                <Link
                                    to={item.path}
                                    className={`flex items-center ${ITEM_HEIGHT} transition-colors duration-300 ${isActive ? 'bg-brand-blue/5 text-brand-blue' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white'}`}
                                >
                                    <div className={`${ICON_WRAPPER_WIDTH} flex items-center justify-center shrink-0`}><item.icon size={ICON_SIZE} /></div>
                                    <div className={`flex items-center overflow-hidden whitespace-nowrap shrink-0 w-[180px] transition-all duration-500 ease-in-out ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                                        <span className="font-semibold text-left">{item.label}</span>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </nav>

                <div className="border-t border-border-base py-4">
                    <div className="flex justify-center mb-2 h-10 w-full px-5">
                        <div className={`flex items-center bg-surface-tertiary rounded-xl overflow-hidden cursor-pointer transition-all duration-500 ${isHovered || isMobileOpen ? 'w-full p-1 gap-1' : 'w-10 p-0'}`} onClick={() => !isHovered && setTheme(theme === 'light' ? 'dark' : 'light')}>
                            <button onClick={(e) => { e.stopPropagation(); setTheme('light'); }} className={`flex items-center justify-center h-full rounded-lg transition-all duration-500 ${isHovered || isMobileOpen ? 'w-1/2 ' + (theme === 'light' ? 'bg-surface-primary text-brand-blue shadow-sm' : 'text-content-secondary') : (theme === 'light' ? 'w-full text-brand-blue' : 'hidden')}`}>
                                <Sun size={14} /><span className={`overflow-hidden whitespace-nowrap text-[10px] font-black uppercase transition-all duration-500 ${isHovered || isMobileOpen ? 'w-[40px] opacity-100 ml-2' : 'w-0 opacity-0'}`}>Light</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setTheme('dark'); }} className={`flex items-center justify-center h-full rounded-lg transition-all duration-500 ${isHovered || isMobileOpen ? 'w-1/2 ' + (theme === 'dark' ? 'bg-surface-primary text-brand-orange shadow-sm' : 'text-content-secondary') : (theme === 'dark' ? 'w-full text-brand-orange' : 'hidden')}`}>
                                <Moon size={14} /><span className={`overflow-hidden whitespace-nowrap text-[10px] font-black uppercase transition-all duration-500 ${isHovered || isMobileOpen ? 'w-[40px] opacity-100 ml-2' : 'w-0 opacity-0'}`}>Dark</span>
                            </button>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center h-16 transition-colors duration-300 w-full hover:bg-red-50 dark:hover:bg-red-900/10">
                        <div className={`${ICON_WRAPPER_WIDTH} flex items-center justify-center shrink-0`}>
                            {userData.photo ? (
                                <img
                                    src={getAvatarUrl(userData.photo)}
                                    alt="User"
                                    className="w-12 h-12 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                    <User size={24} />
                                </div>
                            )}
                        </div>
                        <div className={`flex flex-col min-w-0 text-left overflow-hidden whitespace-nowrap shrink-0 w-[180px] transition-all duration-500 ${isHovered || isMobileOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                            <span className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-red-600 transition-colors">Cerrar Sesión</span>
                            <span className="text-[10px] text-content-secondary truncate pr-4">{userData.name}</span>
                        </div>
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default NewSidebar;