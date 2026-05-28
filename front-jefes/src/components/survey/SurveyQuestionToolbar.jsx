import React from 'react';
import { Type, Hash, List, Camera, Phone, User, Mail, CreditCard } from 'lucide-react';

const SurveyQuestionToolbar = ({ onAdd }) => {
    return (
        <div className="fixed bottom-6 left-0 lg:left-20 right-0 flex justify-center z-[100] pointer-events-none px-4">

            <div className="pointer-events-auto w-fit bg-surface-secondary/90 backdrop-blur-md px-2 py-1 rounded-2xl shadow-2xl border border-border-base flex items-center gap-1 ring-1 ring-black/5 dark:ring-white/10 overflow-x-auto max-w-full">

                {/* Contact Types Group */}
                <div className="flex items-center gap-1 bg-surface-tertiary/50 p-1 rounded-xl shrink-0">
                    <button onClick={() => onAdd('nombre')} className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-blue-500/10 text-content-secondary hover:text-blue-500 transition-all group min-w-[60px]" title="Nombre">
                        <User size={20} strokeWidth={1.5} />
                        <span className="text-[9px] font-medium opacity-100">Nombre</span>
                    </button>
                    <button onClick={() => onAdd('celular')} className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-green-600/10 text-content-secondary hover:text-green-600 transition-all group min-w-[60px]" title="Celular">
                        <Phone size={20} strokeWidth={1.5} />
                        <span className="text-[9px] font-medium opacity-100">Celular</span>
                    </button>
                    <button onClick={() => onAdd('dni')} className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-cyan-600/10 text-content-secondary hover:text-cyan-600 transition-all group min-w-[60px]" title="DNI">
                        <CreditCard size={20} strokeWidth={1.5} />
                        <span className="text-[9px] font-medium opacity-100">DNI</span>
                    </button>
                    <button onClick={() => onAdd('mail')} className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-yellow-500/10 text-content-secondary hover:text-yellow-500 transition-all group min-w-[60px]" title="Mail">
                        <Mail size={20} strokeWidth={1.5} />
                        <span className="text-[9px] font-medium opacity-100">Mail</span>
                    </button>
                </div>

                <div className="w-px h-8 bg-border-base mx-1 shrink-0"></div>

                {/* Standard Types Group */}
                <div className="flex items-center shrink-0">
                    <button onClick={() => onAdd('texto')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-indigo-500/10 text-content-secondary hover:text-indigo-500 transition-all group min-w-[60px]" title="Texto Libre">
                        <Type size={20} strokeWidth={1.5} />
                        <span className="text-[9px] font-medium opacity-100">Texto</span>
                    </button>

                    <button onClick={() => onAdd('numero')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-emerald-500/10 text-content-secondary hover:text-emerald-500 transition-all group min-w-[60px]" title="Numérico">
                        <Hash size={20} strokeWidth={1.5} />
                        <span className="text-[9px] font-medium opacity-100">Num</span>
                    </button>

                    <button onClick={() => onAdd('opciones')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-purple-500/10 text-content-secondary hover:text-purple-500 transition-all group min-w-[60px]" title="Opciones">
                        <List size={20} strokeWidth={1.5} />
                        <span className="text-[9px] font-medium opacity-100">Opción</span>
                    </button>

                    <button onClick={() => onAdd('foto')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-pink-500/10 text-content-secondary hover:text-pink-500 transition-all group min-w-[60px]" title="Foto">
                        <Camera size={20} strokeWidth={1.5} />
                        <span className="text-[9px] font-medium opacity-100">Foto</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SurveyQuestionToolbar;