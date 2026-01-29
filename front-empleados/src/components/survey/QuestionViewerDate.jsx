import { Calendar } from 'lucide-react';

const QuestionViewerDate = ({ question, value, onChange }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4 hover:shadow-md transition-all border-l-4 border-l-blue-400">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                        {question.obligatoria ? "Fecha Requerida *" : "Fecha Opcional"}
                    </label>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                        {question.titulo}
                    </h3>
                </div>

                <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="date"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all text-gray-700 dark:text-white font-mono"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        required={question.obligatoria}
                    />
                </div>
            </div>
        </div>
    );
};

export default QuestionViewerDate;