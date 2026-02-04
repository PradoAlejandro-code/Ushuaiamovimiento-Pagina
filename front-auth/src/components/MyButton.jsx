import React from 'react';

const MyButton = ({ children, onClick, type = 'button', className = '' }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`w-full py-4 px-6 rounded-full font-semibold text-primary-foreground bg-primary transition-all duration-200 hover:shadow-lg hover:opacity-90 ${className}`}
        >
            {children}
        </button>
    );
};

export default MyButton;
