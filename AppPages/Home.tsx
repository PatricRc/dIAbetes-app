import { Link, useOutletContext } from "react-router";
import { Card, Chip } from "../components/ui";
import { Droplet, AlertTriangle, Pill, Activity, Camera, Mic, Paperclip, PenLine, ChevronRight, Clock, PlusCircle } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Home() {
    const { openGlucose, openSymptoms } = useOutletContext<any>();

    return (
        <div className="flex flex-col gap-6 p-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Hola, Carlos <span className="inline-block animate-wave">👋</span></h1>
                    <p className="text-stone-500 font-medium mt-1">Sáb 21/03</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={openGlucose}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shadow-sm active:scale-95 transition-transform"
                    >
                        <Droplet size={20} className="fill-rose-100" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden border-2 border-white shadow-sm">
                        <ImageWithFallback src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100&h=100" alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                </div>
            </header>

            {/* Insight */}
            <p className="text-[15px] font-medium text-stone-700 leading-snug">
                "Tu control esta semana va mejorando."
            </p>

            {/* State Card */}
            <Link to="/salud">
                <Card variant="alert" className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-orange-600 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                        Requiere atención
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] uppercase tracking-wider text-orange-600/70 font-bold">Glucosa</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-stone-900">124</span>
                                <span className="text-[10px] text-stone-500 font-medium">mg/dL</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] uppercase tracking-wider text-orange-600/70 font-bold">Síntomas</span>
                            <div className="flex items-center gap-1.5 text-stone-900">
                                <AlertTriangle size={16} className="text-orange-500" />
                                <span className="text-lg font-bold">x2</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] uppercase tracking-wider text-orange-600/70 font-bold">Meds</span>
                            <div className="flex items-center gap-1.5 text-stone-900">
                                <Activity size={16} className="text-emerald-500" />
                                <span className="text-lg font-bold">71%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-100/50 p-3 rounded-xl">
                        <p className="text-sm text-orange-800 font-medium">
                            Tienes hormigueo registrado 2 veces esta semana.
                        </p>
                    </div>
                </Card>
            </Link>

            {/* Priority */}
            <Card variant="default" className="border-rose-100 bg-gradient-to-br from-white to-rose-50/30">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                        <Pill className="text-rose-600" size={24} />
                    </div>
                    <div className="flex flex-col gap-3 w-full">
                        <div>
                            <h3 className="font-bold text-stone-900">Toma tu metformina</h3>
                            <p className="text-sm text-stone-500 flex items-center gap-1 mt-0.5">
                                <Clock size={14} /> en los próximos 30 min
                            </p>
                        </div>
                        <button className="bg-stone-900 text-white font-medium py-2.5 rounded-xl text-sm w-full shadow-md shadow-stone-200 active:scale-[0.98] transition-all">
                            Marcar como tomada
                        </button>
                    </div>
                </div>
            </Card>

            {/* Quick Symptoms */}
            <section className="flex flex-col gap-3">
                <h3 className="font-bold text-stone-900 px-1">¿Cómo te sientes ahora?</h3>
                <div className="flex flex-wrap gap-2">
                    <Chip icon="😴" label="Cansancio" onClick={openSymptoms} />
                    <Chip icon="👁" label="Visión" onClick={openSymptoms} />
                    <Chip icon="🦶" label="Pie/manos" onClick={openSymptoms} />
                    <Chip icon="💧" label="Sed" onClick={openSymptoms} />
                    <Chip icon="😰" label="Mareo" onClick={openSymptoms} />
                    <Chip icon={<PlusCircle size={16} />} label="Otro" onClick={openSymptoms} />
                </div>
            </section>

            {/* AI Insight */}
            <Link to="/asistente">
                <Card className="bg-stone-800 text-stone-50 border-none relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/20 rounded-full blur-2xl group-hover:bg-rose-500/30 transition-all" />
                    <div className="flex flex-col gap-2 relative z-10">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Insight IA</span>
                            <ChevronRight size={16} className="text-stone-400" />
                        </div>
                        <p className="text-[15px] font-medium leading-relaxed">
                            "Tu glucosa bajó 18 puntos vs. la semana pasada. Tu adherencia a meds ayudó."
                        </p>
                    </div>
                </Card>
            </Link>

            {/* Smart Capture Bar */}
            <Link to="/capturar">
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 flex items-center justify-between mt-2 active:scale-[0.98] transition-transform">
                    <span className="text-stone-400 font-medium">¿Qué pasó hoy?</span>
                    <div className="flex gap-3 text-stone-400">
                        <Camera size={20} />
                        <Mic size={20} />
                        <Paperclip size={20} />
                        <PenLine size={20} />
                    </div>
                </div>
            </Link>

        </div>
    );
}
