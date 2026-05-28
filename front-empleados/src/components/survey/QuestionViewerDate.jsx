import { Calendar, CircleAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";

const QuestionViewerDate = ({ question, value, onChange }) => {
    return (
        <Card className="mb-4 relative border border-border-base border-l-4 border-l-blue-400 shadow-sm">
            <CardHeader className="pb-3">
                <CardDescription className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                    {question.obligatoria ? "Fecha Requerida *" : "Fecha Opcional"}
                </CardDescription>
                <CardTitle className="text-lg font-medium text-gray-800 dark:text-white">
                    {question.titulo}
                </CardTitle>
                {question.obligatoria && (
                    <CardAction>
                        <div className="text-red-500 mt-1" title="Pregunta Obligatoria">
                            <CircleAlert size={20} />
                        </div>
                    </CardAction>
                )}
            </CardHeader>

            <CardContent>
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
            </CardContent>
        </Card>
    );
};

export default QuestionViewerDate;