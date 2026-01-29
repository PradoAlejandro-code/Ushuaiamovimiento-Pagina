import { useEffect, useRef } from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';

const SurveyTitleCard = ({ title, description, active, setTitle, setDescription, setActive }) => {
    const textareaRef = useRef(null);

    // Auto-resize on content change
    const autoResize = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    useEffect(() => {
        autoResize();
    }, [description]);

    return (
        // CAMBIO AQUÍ: Quité 'transition-colors' para que use la global del index.css (300ms)
        <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-base mb-6">
            <div className="flex justify-between items-start mb-4">
                <input
                    type="text"
                    placeholder="Título de la Encuesta"
                    className="w-full text-3xl font-bold text-content-primary placeholder-content-secondary/30 border-none focus:ring-0 p-0 mr-4 bg-transparent outline-none"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                {/* Switch Activo/Inactivo */}
                <button
                    onClick={() => setActive(!active)}
                    className={`flex flex-col items-center gap-1 ${active ? 'text-brand-blue' : 'text-content-secondary'}`}
                    title={active ? "Encuesta Activa" : "Encuesta Inactiva"}
                >
                    {active ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                    <span className="text-[10px] font-bold uppercase">{active ? "Activa" : "Inactiva"}</span>
                </button>
            </div>

            <textarea
                ref={textareaRef}
                placeholder="Descripción de la encuesta (opcional)"
                className="w-full text-content-secondary placeholder-content-secondary/50 border-none focus:ring-0 p-0 pb-2 border-b border-transparent focus:border-brand-blue resize-none overflow-hidden min-h-[40px] bg-transparent outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={1}
            />
        </div>
    );
};

export default SurveyTitleCard;