import * as Tabs from "@radix-ui/react-tabs";
import { Card } from "../components/ui";
import { AlertTriangle, Activity, Pill, User, Calendar, Plus, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import { useOutletContext } from "react-router";

export function Health() {
    const { openSymptoms } = useOutletContext<any>();

    return (
        <div className="flex flex-col h-full bg-stone-50 animate-in fade-in duration-500">
            <header className="px-6 pt-12 pb-4 bg-white border-b border-stone-100 sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-stone-900">Mi Salud</h1>
            </header>

            <Tabs.Root defaultValue="symptoms" className="flex flex-col flex-1">
                <Tabs.List className="flex px-4 py-2 overflow-x-auto gap-2 border-b border-stone-100 bg-white sticky top-[76px] z-10 shadow-sm [&::-webkit-scrollbar]:hidden">
                    <TabTrigger value="symptoms" label="Síntomas" />
                    <TabTrigger value="meds" label="Medicación" />
                    <TabTrigger value="experts" label="Expertos" />
                    <TabTrigger value="timeline" label="Cronograma" />
                </Tabs.List>

                <div className="p-6 pb-24 overflow-y-auto">
                    {/* SÍNTOMAS TAB */}
                    <Tabs.Content value="symptoms" className="flex flex-col gap-6 focus:outline-none data-[state=inactive]:hidden animate-in fade-in slide-in-from-bottom-2">
                        <section className="flex flex-col gap-3">
                            <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider text-stone-500">Esta semana</h3>
                            <div className="flex flex-wrap gap-2">
                                <Badge icon="🦶" label="Hormigueo" count={4} alert />
                                <Badge icon="😴" label="Cansancio" count={3} />
                                <Badge icon="👁" label="Visión borrosa" count={1} />
                            </div>
                        </section>

                        <Card variant="alert" className="border-orange-200 bg-orange-50/50">
                            <div className="flex gap-3">
                                <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
                                <p className="text-sm font-medium text-orange-900 leading-relaxed">
                                    "El hormigueo frecuente puede indicar neuropatía. Convendría mencionarlo al médico."
                                </p>
                            </div>
                        </Card>

                        <section className="flex flex-col gap-4 mt-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-stone-900">Historial reciente</h3>
                                <button
                                    onClick={() => openSymptoms()}
                                    className="text-rose-600 text-sm font-bold flex items-center gap-1 active:scale-95 transition-transform"
                                >
                                    <Plus size={16} /> Registrar
                                </button>
                            </div>

                            <div className="flex flex-col relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-stone-200 before:to-transparent gap-6">
                                <TimelineItem time="Hoy" title="Hormigueo leve" desc="Pie derecho" icon="🦶" />
                                <TimelineItem time="Ayer" title="Cansancio severo" desc="Después de almorzar" icon="😴" />
                                <TimelineItem time="Mar 18" title="Hormigueo moderado" desc="Ambos pies" icon="🦶" />
                            </div>
                        </section>
                    </Tabs.Content>

                    {/* MEDICACIÓN TAB */}
                    <Tabs.Content value="meds" className="flex flex-col gap-5 focus:outline-none data-[state=inactive]:hidden animate-in fade-in slide-in-from-bottom-2">
                        <Card className="flex flex-col gap-4 border-l-4 border-l-rose-500">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                                        <Pill className="text-stone-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg">Metformina 1000mg</h3>
                                        <p className="text-sm text-stone-500 font-medium">Noche · con cena</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-stone-600 bg-stone-50 p-3 rounded-xl">
                                "Ayuda a que tu cuerpo use mejor la insulina"
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-orange-600">71%</span>
                                    <span className="text-xs text-stone-500 font-medium">adherencia mes</span>
                                </div>
                                <button className="text-sm font-bold bg-stone-900 text-white px-4 py-2 rounded-lg active:scale-95 transition-all">
                                    Marcar hoy
                                </button>
                            </div>
                        </Card>

                        <Card className="flex flex-col gap-4 border-l-4 border-l-emerald-500">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                                        <Pill className="text-stone-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg">Lisinopril 10mg</h3>
                                        <p className="text-sm text-stone-500 font-medium">Mañana · con desayuno</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-stone-600 bg-stone-50 p-3 rounded-xl">
                                "Protege tus riñones y controla la presión"
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-emerald-600">94%</span>
                                    <span className="text-xs text-stone-500 font-medium">adherencia mes</span>
                                </div>
                                <div className="text-sm font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-4 py-2 rounded-lg">
                                    <CheckCircle2 size={18} /> Tomada
                                </div>
                            </div>
                        </Card>

                        <button className="mt-2 flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl text-stone-500 font-bold hover:bg-stone-50 hover:text-stone-700 transition-colors">
                            <Plus size={20} /> Agregar medicamento
                        </button>
                    </Tabs.Content>

                    {/* EXPERTOS TAB */}
                    <Tabs.Content value="experts" className="flex flex-col gap-4 focus:outline-none data-[state=inactive]:hidden animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-sm text-stone-500 font-medium mb-2">Basada en tus síntomas y labs recientes.</p>

                        <ExpertCard
                            role="Podólogo"
                            timeframe="Próximas 2 semanas"
                            reason="Hormigueo en pie x4 este mes"
                            action="Agendar cita"
                            color="rose"
                        />
                        <ExpertCard
                            role="Endocrinólogo"
                            timeframe="Próximo mes"
                            reason="HbA1c 8.2% — revisión de tratamiento"
                            action="Preparar resumen"
                            color="orange"
                        />
                        <ExpertCard
                            role="Oftalmólogo"
                            timeframe="Próximos 3 meses"
                            reason="Control anual pendiente"
                            action="Agendar cita"
                            color="emerald"
                        />
                    </Tabs.Content>

                    {/* CRONOGRAMA TAB */}
                    <Tabs.Content value="timeline" className="flex flex-col gap-6 focus:outline-none data-[state=inactive]:hidden animate-in fade-in slide-in-from-bottom-2">
                        <TaskGroup title="Esta semana">
                            <TaskItem text="Tomar metformina 7 días" />
                            <TaskItem text="Registrar glucosa x3" />
                            <TaskItem text="Llamar para cita podólogo" />
                        </TaskGroup>

                        <TaskGroup title="Este mes">
                            <TaskItem text="Lab HbA1c (vence en 18 días)" urgent />
                            <TaskItem text="Cita endocrinólogo" />
                        </TaskGroup>

                        <TaskGroup title="Pendientes del médico">
                            <TaskItem text="Control de presión en 2 sem (pedido por Dr. Ramírez)" />
                            <TaskItem text="Lab colesterol (hace 4 meses)" />
                        </TaskGroup>
                    </Tabs.Content>
                </div>
            </Tabs.Root>
        </div>
    );
}

function TabTrigger({ value, label }: { value: string; label: string }) {
    return (
        <Tabs.Trigger
            value={value}
            className="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap text-stone-500 data-[state=active]:bg-stone-900 data-[state=active]:text-white transition-all select-none"
        >
            {label}
        </Tabs.Trigger>
    );
}

function Badge({ icon, label, count, alert }: { icon: string; label: string; count: number; alert?: boolean }) {
    return (
        <div className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border",
            alert ? "bg-orange-50 border-orange-200 text-orange-900" : "bg-white border-stone-200 text-stone-700"
        )}>
            <span>{icon}</span>
            <span>{label}</span>
            <span className={clsx("ml-1 px-1.5 py-0.5 rounded text-xs", alert ? "bg-orange-200/50" : "bg-stone-100")}>x{count}</span>
        </div>
    );
}

function TimelineItem({ time, title, desc, icon }: { time: string; title: string; desc: string; icon: string }) {
    return (
        <div className="relative flex items-start gap-4">
            <div className="w-10 flex flex-col items-center justify-start z-10 bg-stone-50 py-1">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-stone-100 flex items-center justify-center text-lg">
                    {icon}
                </div>
            </div>
            <div className="flex flex-col pt-1 pb-4">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">{time}</span>
                <h4 className="font-bold text-stone-900 mt-0.5">{title}</h4>
                <p className="text-sm text-stone-500 mt-1">{desc}</p>
            </div>
        </div>
    );
}

function ExpertCard({ role, timeframe, reason, action, color }: { role: string; timeframe: string; reason: string; action: string; color: "rose" | "orange" | "emerald" }) {
    const colorMap = {
        rose: "border-rose-200 bg-rose-50 text-rose-700",
        orange: "border-orange-200 bg-orange-50 text-orange-700",
        emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };

    return (
        <Card className="flex flex-col gap-3">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <div className={clsx("w-2.5 h-2.5 rounded-full", color === "rose" ? "bg-rose-500" : color === "orange" ? "bg-orange-500" : "bg-emerald-500")} />
                    <h3 className="font-bold text-stone-900 text-lg">{role}</h3>
                </div>
                <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded">{timeframe}</span>
            </div>
            <p className="text-sm text-stone-600 font-medium">"{reason}"</p>
            <button className={clsx("mt-2 w-full py-2.5 rounded-xl text-sm font-bold transition-transform active:scale-[0.98]", colorMap[color])}>
                {action}
            </button>
        </Card>
    );
}

function TaskGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3">
            <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider text-stone-500">{title}</h3>
            <div className="flex flex-col gap-2">
                {children}
            </div>
        </section>
    );
}

function TaskItem({ text, urgent }: { text: string; urgent?: boolean }) {
    return (
        <label className="flex items-start gap-3 p-3 rounded-xl bg-white border border-stone-100 shadow-sm cursor-pointer group">
            <div className="relative flex items-start pt-0.5">
                <input type="checkbox" className="peer sr-only" />
                <div className="w-5 h-5 rounded border-2 border-stone-300 peer-checked:bg-stone-900 peer-checked:border-stone-900 flex items-center justify-center transition-all">
                    <CheckCircle2 size={14} className="text-white opacity-0 peer-checked:opacity-100" />
                </div>
            </div>
            <span className={clsx("text-sm font-medium pt-0.5 select-none transition-colors", urgent ? "text-orange-700" : "text-stone-700 group-hover:text-stone-900")}>
                {text}
            </span>
        </label>
    );
}
