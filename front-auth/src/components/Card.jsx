import React from 'react';

const Card = ({ children, className = '' }) => {
    return (
        <div className={`rounded-3xl shadow-2xl overflow-hidden p-6 bg-card text-card-foreground ${className}`}>
            {children}
        </div>
    );
};

export default Card;
