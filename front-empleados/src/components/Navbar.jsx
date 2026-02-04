import { Sun, Moon, LogOut } from 'lucide-react';

const Navbar = ({ theme, toggleTheme, logout }) => {
    return (
        <div className="sticky top-0 z-20 bg-surface-secondary/95 backdrop-blur-sm pt-4 pb-2 flex justify-center items-center gap-3 border-b border-transparent">
            {/* Botón Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-surface-primary border border-border-base text-content-secondary hover:text-brand-blue shadow-sm transition-colors"
                title="Cambiar tema"
            >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Botón Logout */}
            <button
                onClick={logout}
                className="flex items-center gap-2 text-sm font-medium text-red-500 bg-surface-primary border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 px-5 py-2 rounded-full shadow-sm transition-colors"
            >
                <LogOut size={16} />
                <span>Salir</span>
            </button>
        </div>
    );
};

export default Navbar;
