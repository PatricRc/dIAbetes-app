import { Card } from "../components/ui";
import { Mic, FileText, Camera, Edit3, Send, Sparkles, Utensils } from "lucide-react";

export function Assistant() {
    return (
        <div className="flex flex-col h-full bg-stone-50">

            <header className="px-6 pt-12 pb-4 bg-white border-b border-stone-100 sticky top-0 z-10">
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="text-rose-500" size={20} />
                    <h1 className="text-2xl font-bold text-stone-900">Asistente Médico</h1>
                </div>
                <p className="text-sm font-medium text-stone-500">Basado en tu historial real</p>
            </header>

            <div className="flex-1 overflow-y-auto p-6 pb-32 flex flex-col gap-6">

                {/* Input Modules Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <InputModule icon={<Mic />} label="Grabar consulta" color="text-emerald-600" bg="bg-emerald-50" />
                    <InputModule icon={<FileText />} label="Subir documento" color="text-blue-600" bg="bg-blue-50" />
                    <InputModule icon={<Utensils />} label="Foto Alimentos" color="text-orange-600" bg="bg-orange-50" />
                    <InputModule icon={<Edit3 />} label="Escribir nota" color="text-rose-600" bg="bg-rose-50" />
                </div>

                {/* Suggested Prompts */}
                <section className="flex flex-col gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400 px-1">Sugerencias</p>
                    <div className="flex flex-col gap-2">
                        <PromptChip text="¿Qué cambió desde mi última visita?" />
                        <PromptChip text="¿Estoy mejorando o empeorando?" />
                        <PromptChip text="¿Qué debo preguntarle al podólogo?" />
                    </div>
                </section>

                {/* Chat Area */}
                <section className="flex flex-col gap-6 mt-4">

                    {/* User Message */}
                    <div className="flex flex-col items-end gap-1 w-full pl-12">
                        <div className="bg-stone-900 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-[15px] font-medium leading-relaxed">
                            ¿Qué cambió desde mi última visita?
                        </div>
                        <span className="text-xs text-stone-400 font-medium px-1">Hoy, 10:42 AM</span>
                    </div>

                    {/* Assistant Message */}
                    <div className="flex flex-col items-start gap-2 w-full pr-8">
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mb-1">
                            <Sparkles size={16} className="text-rose-600" />
                        </div>

                        <Card className="rounded-tl-sm w-full border-stone-200">
                            <p className="text-[15px] text-stone-800 font-medium mb-4">
                                Desde tu visita del 5/03 han ocurrido estos cambios importantes:
                            </p>

                            <ul className="flex flex-col gap-3">
                                <li className="flex gap-3 items-start">
                                    <span className="text-lg leading-none">💊</span>
                                    <span className="text-sm font-medium text-stone-700"><strong className="text-stone-900">Metformina</strong> se ajustó a 1000mg.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <span className="text-lg leading-none">📉</span>
                                    <span className="text-sm font-medium text-stone-700">Tu <strong className="text-stone-900">glucosa bajó</strong> de 168 a 142 mg/dL promedio.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <span className="text-lg leading-none">✓</span>
                                    <span className="text-sm font-medium text-stone-700"><strong className="text-emerald-700">Adherencia 87%</strong> este mes (era 61%).</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <span className="text-lg leading-none">⚠️</span>
                                    <span className="text-sm font-medium text-stone-700"><strong className="text-orange-700">Hormigueo</strong> registrado 4 veces en tus pies. (Nuevo patrón).</span>
                                </li>
                            </ul>
                        </Card>
                    </div>

                </section>
            </div>

            {/* Fixed Bottom Input */}
            <div className="fixed bottom-[72px] w-full max-w-md bg-stone-50 border-t border-stone-200 p-4 pb-6 z-20">
                <div className="relative flex items-center w-full">
                    <button className="absolute left-3 text-stone-400 hover:text-stone-600 transition-colors">
                        <Mic size={20} />
                    </button>
                    <input
                        type="text"
                        placeholder="Escribe o graba tu pregunta..."
                        className="w-full bg-white border border-stone-300 rounded-full py-3 pl-11 pr-12 text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
                    />
                    <button className="absolute right-2 w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-stone-800 transition-colors">
                        <Send size={14} className="ml-0.5" />
                    </button>
                </div>
            </div>

        </div>
    );
}

function InputModule({ icon, label, color, bg }: { icon: React.ReactNode; label: string; color: string; bg: string }) {
    return (
        <button className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-stone-100 shadow-sm hover:shadow-md transition-all active:scale-95 group">
            <div className={`w-12 h-12 rounded-full ${bg} ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <span className="text-xs font-bold text-stone-700 text-center">{label}</span>
        </button>
    );
}

function PromptChip({ text }: { text: string }) {
    return (
        <button className="text-left w-full p-3 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 active:scale-[0.99] transition-all shadow-sm">
            {text}
        </button>
    );
}
