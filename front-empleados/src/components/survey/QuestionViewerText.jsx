import React from 'react';
import { CircleAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";

const QuestionViewerText = ({ question, value, onChange }) => {
    return (
        <Card className="mb-4 relative border border-border-base border-l-4 border-l-indigo-500 dark:border-l-indigo-400 shadow-sm">
            <CardHeader className="pb-3">
                <CardDescription className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                    {question.obligatoria ? "Texto Requerido *" : "Texto Opcional"}
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
                <textarea
                    rows={2}
                    placeholder="Escribe tu respuesta aquí..."
                    className="w-full text-base p-3 rounded-lg border border-border-base bg-surface-secondary text-content-primary placeholder-content-secondary focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all custom-scrollbar resize-y"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    required={question.obligatoria}
                ></textarea>
            </CardContent>
        </Card>
    );
};

export default QuestionViewerText;