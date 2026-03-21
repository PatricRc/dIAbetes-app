import { Card } from "../components/ui";
import { CheckCircle2, ChevronRight, Map, ArrowRight, Activity, TrendingDown } from "lucide-react";
import clsx from "clsx";

export function Plan() {
    return (
        <div className="flex flex-col min-h-full bg-stone-50 animate-in fade-in duration-500 pb-24">

            <header className="px-6 pt-12 pb-4 bg-white border-b border-stone-100 sticky top-0 z-10 flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                    Mi Plan de Mejora
                </h1>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Generado hoy · 45 días de datos</p>
            </header>

            <div className="flex flex-col gap-8 p-6">

                {/* Current State */}
                <section className="flex flex-col gap-3">
                    <Card variant="alert" className="border-orange-200">
                        <div className="flex items-center gap-2 text-orange-600 font-bold mb-4">
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                            Estado: Requiere atención
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <StatusRow type="success" text="Tu glucosa bajó 18 puntos" />
                            <StatusRow type="success" text="Adherencia subió a 87%" />
                            <StatusRow type="warning" text="Hormigueo recurrente x4" />
                            <StatusRow type="warning" text="HbA1c en 8.2% (meta: <7.5%)" />
                        </div>
                    </Card>
                </section>

                {/* Priorities */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-lg font-bold text-stone-900">Tus 3 Prioridades</h2>

                    <div className="flex flex-col gap-3">
                        <PriorityCard
                            num="1"
                            title="Neuropatía"
                            desc="El hormigueo frecuente necesita evaluación urgente."
                            impact="Prevenir daño nervioso"
                            color="rose"
                        />
                        <PriorityCard
                            num="2"
                            title="Medicación"
                            desc="Subir adherencia a metformina puede bajar tu HbA1c 1.5 pts."
                            impact="Actualmente: 71% → meta: 90%"
                            color="orange"
                        />
                        <PriorityCard
                            num="3"
                            title="Glucosa Nocturna"
                            desc="Picos post-cena son tu patrón más consistente este mes."
                            color="emerald"
                        />
                    </div>
                </section>

                {/* Action Plan */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-lg font-bold text-stone-900">Esta Semana</h2>
                    <Card className="p-2 bg-white">
                        <ActionItem text="Tomar metformina cada noche antes de cenar (7 días)" />
                        <ActionItem text="Registrar glucosa antes de dormir (3 veces)" />
                        <ActionItem text="Llamar para cita podólogo" urgent />
                        <ActionItem text="Caminar 15 min post-cena" />
                    </Card>
                </section>

                {/* Goals */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-lg font-bold text-stone-900">Tus Metas</h2>

                    <div className="flex flex-col gap-4">
                        <GoalCard
                            timeframe="En 30 Días"
                            title="Adherencia a meds > 85%"
                            progress={71}
                            target={85}
                            icon={<Activity size={18} className="text-rose-500" />}
                        />
                        <GoalCard
                            timeframe="En 90 Días"
                            title="Glucosa promedio < 150 mg/dL"
                            progress={162}
                            target={150}
                            reverse
                            icon={<TrendingDown size={18} className="text-emerald-500" />}
                            unit="mg/dL"
                        />
                    </div>
                </section>

                {/* Actions */}
                <div className="flex flex-col gap-3 mt-4">
                    <button className="w-full bg-stone-900 text-white font-bold py-4 rounded-2xl shadow-md shadow-stone-200 active:scale-[0.98] transition-all">
                        Compartir con mi médico
                    </button>
                    <button className="w-full bg-stone-200 text-stone-700 font-bold py-4 rounded-2xl active:scale-[0.98] transition-all">
                        Actualizar plan
                    </button>
                </div>

            </div>
        </div>
    );
}

function StatusRow({ type, text }: { type: "success" | "warning"; text: string }) {
    return (
        <div className="flex items-start gap-2.5">
            {type === "success" ? (
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            ) : (
                <span className="text-orange-500 shrink-0 mt-0.5 font-bold leading-none text-lg">⚠️</span>
            )}
            <span className={clsx("text-sm font-medium", type === "success" ? "text-stone-700" : "text-orange-900")}>
                {text}
            </span>
        </div>
    );
}

function PriorityCard({ num, title, desc, impact, color }: { num: string; title: string; desc: string; impact?: string; color: "rose" | "orange" | "emerald" }) {
    const colorMap = {
        rose: "bg-rose-100 text-rose-700",
        orange: "bg-orange-100 text-orange-700",
        emerald: "bg-emerald-100 text-emerald-700",
    };

    return (
        <Card className="flex flex-col gap-3 relative overflow-hidden group border-stone-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={clsx("w-6 h-6 rounded flex items-center justify-center text-xs font-black", colorMap[color])}>
                        {num}
                    </div>
                    <h3 className="font-bold text-stone-900 uppercase tracking-widest text-xs">{title}</h3>
                </div>
                <button className="text-stone-400 hover:text-stone-900 transition-colors">
                    <ChevronRight size={18} />
                </button>
            </div>

            <p className="text-sm font-medium text-stone-700 leading-snug">
                "{desc}"
            </p>

            {impact && (
                <div className="bg-stone-50 rounded-lg p-2.5 mt-1 border border-stone-100">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Impacto esperado</p>
                    <p className="text-sm font-medium text-stone-800">{impact}</p>
                </div>
            )}
        </Card>
    );
}

function ActionItem({ text, urgent }: { text: string; urgent?: boolean }) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer group">
            <div className="w-5 h-5 rounded border-2 border-stone-300 group-hover:border-stone-400 mt-0.5 shrink-0" />
            <span className={clsx("text-sm font-medium pt-0.5", urgent ? "text-orange-700 font-bold" : "text-stone-700")}>
                {text}
            </span>
        </div>
    );
}

function GoalCard({ timeframe, title, progress, target, reverse, icon, unit = "%" }: { timeframe: string; title: string; progress: number; target: number; reverse?: boolean; icon: React.ReactNode; unit?: string }) {
    // Simple calculation for visual progress
    let percentage = 0;
    if (reverse) {
        // e.g. 162 down to 150. Max might be 200.
        percentage = Math.max(0, 100 - ((progress - target) / 50) * 100);
    } else {
        // e.g. 71 up to 85. Max is 100
        percentage = (progress / 100) * 100;
    }

    if (percentage > 100) percentage = 100;

    return (
        <Card className="flex flex-col gap-4 border-stone-200">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">{timeframe}</span>
                {icon}
            </div>

            <div>
                <h3 className="font-bold text-stone-900">{title}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-black text-stone-800">{progress}</span>
                    <ArrowRight size={14} className="text-stone-400" />
                    <span className="text-lg font-black text-emerald-600">{target} {unit}</span>
                </div>
            </div>

            <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-stone-900 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </Card>
    );
}
