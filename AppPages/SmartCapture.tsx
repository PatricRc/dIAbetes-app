import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router";
import { X, Camera, Mic, Paperclip, Send } from "lucide-react";
import clsx from "clsx";

export function Capture() {
    const navigate = useNavigate();
    const { openGlucose } = useOutletContext<any>();
    const [text, setText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = () => {
        if (!text.trim()) return;
        setIsProcessing(true);
        // Simulate AI processing
        setTimeout(() => {
            navigate("/");
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full bg-stone-50 animate-in slide-in-from-bottom-full duration-300">

            <header className="px-4 py-4 flex items-center justify-between">
                <Link to="/" className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-300 transition-colors">
                    <X size={20} />
                </Link>
                <span className="font-bold text-stone-900">¿Qué pasó?</span>
                <div className="w-10" /> {/* Spacer for centering */}
            </header>

            <div className="flex-1 flex flex-col p-6 gap-8">

                {/* Main Text Input */}
                <div className="flex-1">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Escríbelo, fotografíalo o grábalo."
                        className="w-full h-full bg-transparent text-2xl font-medium text-stone-900 placeholder:text-stone-300 resize-none focus:outline-none leading-relaxed"
                        autoFocus
                    />
                </div>

                {/* Quick Context Chips */}
                <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400 px-1">Atajos rápidos</span>
                    <div className="flex flex-wrap gap-2">
                        <ContextChip
                            icon="💉"
                            label="Glucosa"
                            onClick={() => {
                                navigate(-1);
                                setTimeout(() => openGlucose(), 100);
                            }}
                        />
                        <ContextChip icon="🍽" label="Comida" onClick={() => setText("Acabo de comer ")} />
                        <ContextChip icon="💊" label="Medicación" onClick={() => setText("Ya tomé mi ")} />
                        <ContextChip icon="😟" label="Síntoma" onClick={() => setText("Me siento ")} />
                        <ContextChip icon="🏃" label="Actividad" onClick={() => setText("Hice ejercicio: ")} />
                    </div>
                </div>

                {/* Actions Bottom Bar */}
                <div className="flex flex-col gap-4 bg-white p-4 rounded-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.03)] border border-stone-100">

                    <div className="flex items-center justify-between px-2">
                        <div className="flex gap-4 text-stone-400">
                            <button className="hover:text-stone-900 transition-colors flex flex-col items-center gap-1">
                                <Camera size={24} />
                                <span className="text-[10px] font-bold">Foto</span>
                            </button>
                            <button className="hover:text-stone-900 transition-colors flex flex-col items-center gap-1">
                                <Mic size={24} />
                                <span className="text-[10px] font-bold">Grabar</span>
                            </button>
                            <button className="hover:text-stone-900 transition-colors flex flex-col items-center gap-1">
                                <Paperclip size={24} />
                                <span className="text-[10px] font-bold">Subir</span>
                            </button>
                        </div>

                        <button
                            onClick={handleProcess}
                            disabled={!text.trim() || isProcessing}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all shadow-md active:scale-95",
                                text.trim() && !isProcessing
                                    ? "bg-rose-600 shadow-rose-200"
                                    : "bg-stone-300 text-stone-500 shadow-none cursor-not-allowed"
                            )}
                        >
                            {isProcessing ? "Procesando..." : "Procesar"}
                            {!isProcessing && <Send size={18} className="ml-1" />}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

function ContextChip({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 active:scale-95 transition-all"
        >
            <span>{icon}</span>
            {label}
        </button>
    );
}
