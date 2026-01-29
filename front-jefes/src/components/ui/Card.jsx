import React from 'react';

const Card = ({ children, className = '', onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`rounded-2xl p-6 shadow-lg border bg-surface-primary border-border-base ${className}`}
        >
            {children}
        </div>
    );
};

export default Card;