// src/components/ui/WhatsAppQRButton.jsx
import { useState } from 'react';
import QRCode from 'react-qr-code'; // La librería mágica
import { QrCode, X } from 'lucide-react'; // Iconos

const WhatsAppQRButton = ({ phoneNumber, name = "Contacto" }) => {
    const [isOpen, setIsOpen] = useState(false);

    // 1. Limpieza del número (importante para que ande el link)
    // Quitamos espacios, guiones, paréntesis y el +
    const cleanPhone = phoneNumber ? String(phoneNumber).replace(/[^0-9]/g, '') : '';

    // Si no hay número válido, no mostramos nada
    if (!cleanPhone) return null;

    // 2. Link universal de WhatsApp
    const waLink = `https://wa.me/${cleanPhone}`;

    return (
        <>
            {/* --- EL BOTÓN --- */}
            <button
                onClick={() => setIsOpen(true)}
                className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-black transition-colors"
                title="Generar QR de WhatsApp"
                type="button"
            >
                <QrCode size={16} />
            </button>

            {/* --- EL MODAL (Solo existe si isOpen es true) --- */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">

                    {/* Contenedor Blanco */}
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative flex flex-col items-center animate-in zoom-in-95 duration-200">

                        {/* Botón Cerrar */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-500"
                        >
                            <X size={24} />
                        </button>

                        {/* Título */}
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                            Escanear para chatear
                        </h3>
                        <p className="text-sm text-gray-500 mb-6 text-center">
                            Conecta con <span className="font-semibold text-green-600">{name}</span>
                        </p>

                        {/* EL CÓDIGO QR GENERADO EN VIVO */}
                        <div className="p-4 bg-white border-2 border-gray-100 rounded-xl shadow-inner">
                            <QRCode
                                value={waLink}
                                size={200}
                                level="M" // Nivel de corrección de error
                                fgColor="#000000"
                                bgColor="#ffffff"
                            />
                        </div>

                        <p className="mt-6 text-xs text-gray-400 text-center">
                            Apunta con la cámara de tu celular <br /> para abrir WhatsApp automáticamente.
                        </p>

                        {/* Botón cerrar inferior (opcional) */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="mt-6 w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
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
