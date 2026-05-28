import React from 'react';

const Card = ({ children, className = '', onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`rounded-2xl p-6 border bg-surface-secondary border-border-base ${className}`}
        >
            {children}
        </div>
    );
};

export default Card;