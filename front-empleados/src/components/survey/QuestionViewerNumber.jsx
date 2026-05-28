import React from 'react';
import { CircleAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";

const QuestionViewerNumber = ({ question, value, onChange }) => {
    return (
        <Card className="mb-4 relative border border-border-base border-l-4 border-l-emerald-500 dark:border-l-emerald-400 shadow-sm">
            <CardHeader className="pb-3">
                <CardDescription className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    {question.obligatoria ? "Pregunta Numérica *" : "Pregunta Numérica"}
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
                <input
                    type="number"
                    placeholder="Ingrese un valor..."
                    className="w-full text-base p-3 rounded-lg border border-border-base bg-surface-secondary text-content-primary placeholder-content-secondary focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    required={question.obligatoria}
                />
            </CardContent>
        </Card>
    );
};

export default QuestionViewerNumber;