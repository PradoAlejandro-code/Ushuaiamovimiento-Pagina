import React from 'react';

const CheckBox = ({ id, checked, onChange, label }) => {
    return (
        <div className="flex items-center">
            <div className="relative flex items-center">
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-muted transition-all checked:border-transparent bg-background"
                />
                {/* Custom Checkmark using --active-color */}
                <svg
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity"
                    width="12"
                    height="10"
                    viewBox="0 0 12 10"
                    fill="none"
                >
                    <path
                        d="M1 5L4.5 8.5L11 1.5"
                        stroke="var(--active-color)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            {label && (
                <label htmlFor={id} className="ml-3 text-sm font-medium cursor-pointer text-foreground">
                    {label}
                </label>
            )}
        </div>
    );
};

export default CheckBox;
