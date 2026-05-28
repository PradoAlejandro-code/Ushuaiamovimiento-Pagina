import { ChevronDown, CircleAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const QuestionViewerOptions = ({ question, value, onChange }) => {
    return (
        <Card className="mb-4 relative border border-border-base border-l-4 border-l-purple-500 dark:border-l-purple-400 shadow-sm">
            <CardHeader className="pb-3">
                <CardDescription className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                    {question.obligatoria
                        ? (question.permite_multiple ? "Selección Múltiple *" : "Selección Única *")
                        : (question.permite_multiple ? "Selección Múltiple" : "Selección Única")}
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
                {question.permite_multiple ? (
                    <div className="space-y-2">
                        {question.opciones && question.opciones.map((op, idx) => {
                            const currentValues = value ? String(value).split(',').map(s => s.trim()) : [];
                            const isChecked = currentValues.includes(op);

                            const handleCheckboxChange = (optionValue, checked) => {
                                let newValues;
                                if (checked) {
                                    newValues = [...currentValues, optionValue];
                                } else {
                                    newValues = currentValues.filter(v => v !== optionValue);
                                }
                                onChange(newValues.join(', '));
                            };

                            return (
                                <label key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border-base bg-surface-secondary cursor-pointer hover:bg-surface-primary transition-colors">
                                    <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => handleCheckboxChange(op, checked)}
                                        className={`w-5 h-5 border-gray-300 ${isChecked ? '!bg-purple-500 !border-purple-500 !text-white' : ''}`}
                                    />
                                    <span className="text-content-primary text-base leading-none">{op}</span>
                                </label>
                            );
                        })}
                    </div>
                ) : (
                    <Select value={value || undefined} onValueChange={(val) => onChange(val)} required={question.obligatoria}>
                        <SelectTrigger className="w-full text-base p-3 h-auto rounded-lg border border-border-base bg-surface-secondary text-content-primary focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all cursor-pointer">
                            <SelectValue placeholder="Seleccione una opción..." />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-primary border-border-base">
                            {question.opciones && question.opciones.map((op, idx) => (
                                <SelectItem key={idx} value={op} className="text-content-primary cursor-pointer focus:bg-surface-secondary">
                                    {op}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </CardContent>
        </Card>
    );
};

export default QuestionViewerOptions;