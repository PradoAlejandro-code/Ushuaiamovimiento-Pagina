import bannerImage from '../assets/mopof-banner.png';

const AuthLayout = ({ children }) => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#faf5ff] to-white px-4 py-8">
            <div className="w-full max-w-md flex flex-col items-center gap-6">
                <img
                    src={bannerImage}
                    alt="Movimiento Popular Fueguino - Lista 54"
                    className="w-full max-w-xs sm:max-w-sm h-auto"
                />
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
