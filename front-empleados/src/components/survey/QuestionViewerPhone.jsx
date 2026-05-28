import { Phone, CircleAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";

const QuestionViewerPhone = ({ question, value, onChange }) => {

    // Si el valor está vacío, podemos sugerir el prefijo, 
    // pero permitimos que el usuario lo borre completamente si quiere.
    const handleChange = (e) => {
        let val = e.target.value;
        // Permitir números, espacios y el signo +
        val = val.replace(/[^\d+ ]/g, '');
        onChange(val);
    };

    const initialValue = value || '+54 ';

    return (
        <Card className="mb-4 relative border border-border-base border-l-4 border-l-green-500 dark:border-l-green-400 shadow-sm">
            <CardHeader className="pb-3">
                <CardDescription className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide flex items-center gap-1">
                    <Phone size={12} />
                    {question.obligatoria ? "Teléfono Requerido *" : "Teléfono Opcional"}
                </CardDescription>
                <CardTitle className="text-lg font-medium text-content-primary">
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
                <div className="flex gap-2">
                    <input
                        type="tel"
                        placeholder="+54 2901 123456"
                        className="flex-1 text-base p-3 rounded-lg border border-border-base bg-surface-secondary text-content-primary placeholder-content-secondary focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-mono"
                        value={initialValue}
                        onChange={handleChange}
                        required={question.obligatoria}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default QuestionViewerPhone;
