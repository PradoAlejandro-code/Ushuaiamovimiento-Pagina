// src/components/ui/WhatsAppQRButton.jsx
import { useState } from 'react';
import QRCode from 'react-qr-code';
import { QrCode, X } from 'lucide-react';

const WhatsAppQRButton = ({ phoneNumber, name = "Contacto" }) => {
    const [isOpen, setIsOpen] = useState(false);

    const cleanPhone = phoneNumber ? String(phoneNumber).replace(/[^0-9]/g, '') : '';
    if (!cleanPhone) return null;

    const waLink = `https://wa.me/${cleanPhone}`;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-1.5 bg-surface-secondary text-content-secondary rounded-lg hover:bg-brand-blue/10 hover:text-brand-blue transition-colors"
                title="Generar QR de WhatsApp"
                type="button"
            >
                <QrCode size={16} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-surface-primary border border-border-base rounded-2xl shadow-2xl p-6 w-full max-w-sm relative flex flex-col items-center animate-in zoom-in-95 duration-200">

                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 p-1 rounded-full hover:bg-surface-secondary text-content-secondary"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-lg font-black text-content-primary mb-1">
                            Escanear para chatear
                        </h3>
                        <p className="text-sm text-content-secondary mb-6 text-center">
                            Conecta con <span className="font-bold text-emerald-500">{name}</span>
                        </p>

                        {/* El QR siempre necesita fondo blanco para que la cámara lo lea bien */}
                        <div className="p-4 bg-white rounded-xl shadow-inner">
                            <QRCode
                                value={waLink}
                                size={200}
                                level="M"
                                fgColor="#000000"
                                bgColor="#ffffff"
                            />
                        </div>

                        <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-content-secondary/50 text-center">
                            Apunta con la cámara para <br /> abrir WhatsApp
                        </p>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="mt-6 w-full py-3 bg-surface-secondary text-content-primary rounded-xl font-bold text-sm hover:bg-surface-tertiary transition-all"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default WhatsAppQRButton;