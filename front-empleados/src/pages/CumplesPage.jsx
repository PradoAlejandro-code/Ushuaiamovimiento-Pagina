import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import BirthdayList from '../components/survey/BirthdayList';

const CumplesPage = () => {
    // Obtenemos el currentUser del Layout
    const { currentUser } = useOutletContext();

    return (
        <motion.div
            key="cumpleanos-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full pb-8"
        >
            <BirthdayList currentUser={currentUser} />
        </motion.div>
    );
};

export default CumplesPage;
