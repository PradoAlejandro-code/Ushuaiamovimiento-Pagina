import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const MyButton = ({
    children,
    className,
    status, // 'loading', 'success', 'error', or null/undefined
    defaultText,
    loadingText = 'Guardando...',
    successText = 'Guardado',
    errorText = 'Error',
    defaultIcon,
    ...props
}) => {

    // Si no se envía un status, el botón se comporta estáticamente
    if (status === undefined) {
        return (
            <button
                className={`w-full py-3 px-4 rounded-xl font-medium transition disabled:opacity-60 disabled:cursor-not-allowed ${className || ""}`}
                {...props}
            >
                {children}
            </button>
        );
    }

    // Lógica para botón interactivo con estado
    let currentIcon = defaultIcon;
    let currentText = defaultText || children;

    // Clases adicionales que sobrescriben los colores
    let bgClasses = "";
    const baseClass = className || "w-full bg-brand-blue text-white shadow-blue-900/20";

    if (status === 'loading') {
        currentIcon = <Loader2 size={20} className="animate-spin" />;
        currentText = loadingText;
    } else if (status === 'success') {
        currentIcon = <CheckCircle size={20} />;
        currentText = successText;
        bgClasses = "!bg-green-500 !text-white hover:!bg-green-600";
    } else if (status === 'error') {
        currentIcon = <AlertCircle size={20} />;
        currentText = errorText;
        bgClasses = "!bg-red-500 !text-white hover:!bg-red-600";
    }

    const isBusy = status === 'loading' || status === 'success';

    return (
        <button
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 ${baseClass} ${bgClasses}`}
            disabled={props.disabled || isBusy}
            {...props}
        >
            {currentIcon && currentIcon}
            {typeof currentText === 'string' ? <span>{currentText}</span> : currentText}
        </button>
    );
};

export default MyButton;
