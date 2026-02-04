import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, MapPin } from 'lucide-react';

const NavTabs = ({ activeTab, setActiveTab }) => {
    return (
        <div className="flex justify-center mt-2 px-4">
            <div className="bg-surface-primary/60 backdrop-blur-sm p-1.5 rounded-full flex gap-1 shadow-sm max-w-sm w-full border border-border-base relative">

                {/* Botón Relevamientos */}
                <button
                    onClick={() => setActiveTab('relevamientos')}
                    className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-semibold z-10 transition-colors ${activeTab === 'relevamientos' ? 'text-brand-blue' : 'text-content-secondary'
                        }`}
                >
                    <MapPin size={18} />
                    Relevamientos

                    {/* El "Pill" animado */}
                    {activeTab === 'relevamientos' && (
                        <motion.div
                            layoutId="active-pill"
                            className="absolute inset-0 bg-surface-primary rounded-full shadow-md ring-1 ring-black/5 dark:ring-white/5 z-[-1]"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                </button>

                {/* Botón Encuestas */}
                <button
                    onClick={() => setActiveTab('encuestas')}
                    className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-semibold z-10 transition-colors ${activeTab === 'encuestas' ? 'text-brand-blue' : 'text-content-secondary'
                        }`}
                >
                    <ClipboardList size={18} />
                    Encuestas

                    {/* El mismo layoutId hace la magia del movimiento */}
                    {activeTab === 'encuestas' && (
                        <motion.div
                            layoutId="active-pill"
                            className="absolute inset-0 bg-surface-primary rounded-full shadow-md ring-1 ring-black/5 dark:ring-white/5 z-[-1]"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                </button>
            </div>
        </div>
    );
};

export default NavTabs;
