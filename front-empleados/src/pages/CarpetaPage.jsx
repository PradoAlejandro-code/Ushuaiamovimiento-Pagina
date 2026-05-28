import { motion } from 'framer-motion';
import CarpetaContainer from '../components/carpeta/CarpetaContainer';

const CarpetaPage = () => {
    return (
        <motion.div
            key="carpeta-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full pb-8"
        >
            <CarpetaContainer />
        </motion.div>
    );
};

export default CarpetaPage;
