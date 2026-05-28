import { useEffect, useRef } from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';

/**
 * A reusable Title Card component for Surveys, Reports, or any content with a title, description, and optional active toggle.
 * 
 * @param {string} title - The current title value
 * @param {function} setTitle - Setter for the title
 * @param {string} description - The current description value
 * @param {function} setDescription - Setter for the description
 * @param {boolean} [active] - Optimal: The current active state
 * @param {function} [setActive] - Optional: Setter for the active state
 * @param {string} [titlePlaceholder="Título"] - Placeholder for title input
 * @param {string} [descriptionPlaceholder="Descripción (opcional)"] - Placeholder for description textarea
 * @param {string} [activeLabel="Activa"] - Label when active is true
 * @param {string} [inactiveLabel="Inactiva"] - Label when active is false
 * @param {React.ReactNode} [rightAction] - Optional: Custom React element to render on the top right (overrides toggle).
 */
const TitleCard = ({
    title,
    setTitle,
    description,
    setDescription,
    active,
    setActive,
    titlePlaceholder = "Título",
    descriptionPlaceholder = "Descripción (opcional)",
    activeLabel = "Activa",
    inactiveLabel = "Inactiva",
    rightAction,
    naked = false,
    className = ""
}) => {
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

    const showToggle = setActive !== undefined && active !== undefined;

    const containerClasses = naked 
        ? `w-full ${className}`
        : `bg-surface-primary p-6 rounded-xl shadow-sm border border-border-base mb-6 ${className}`;

    return (
        <div className={containerClasses}>
            <div className="flex justify-between items-start mb-4">
                <input
                    type="text"
                    placeholder={titlePlaceholder}
                    className="w-full text-3xl font-bold text-content-primary placeholder-content-secondary/30 border-none focus:ring-0 p-0 mr-4 bg-transparent outline-none"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                {/* Elemento Personalizado a la Derecha O Switch Activo/Inactivo */}
                {rightAction ? (
                    rightAction
                ) : showToggle ? (
                    <button
                        onClick={() => setActive(!active)}
                        className={`flex flex-col items-center gap-1 ${active ? 'text-brand-blue' : 'text-content-secondary'}`}
                        title={active ? `Estado: ${activeLabel}` : `Estado: ${inactiveLabel}`}
                        type="button"
                    >
                        {active ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                        <span className="text-[10px] font-bold uppercase">{active ? activeLabel : inactiveLabel}</span>
                    </button>
                ) : null}
            </div>

            <textarea
                ref={textareaRef}
                placeholder={descriptionPlaceholder}
                className="w-full text-content-secondary placeholder-content-secondary/50 border-none focus:ring-0 p-0 pb-2 border-b border-transparent focus:border-brand-blue resize-none overflow-hidden min-h-[40px] bg-transparent outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={1}
            />
        </div>
    );
};

export default TitleCard;
