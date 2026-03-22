# Diabetes Guardian — Guion de Pitch (3 minutos)

> **Versión:** Hackathon Final
> **Duración objetivo:** 3:00 minutos
> **Idioma:** Español
> **Formato sugerido:** Presenter + teléfono en mano o espejo en pantalla

---

## CRÍTICA A LA ESTRUCTURA ORIGINAL Y CAMBIOS APLICADOS

### Lo que se propuso vs. lo que necesitas

| Pilar original | Problema | Ajuste |
|---|---|---|
| Problema | Bien, pero muy amplio | Anclar en UNA historia personal, no estadísticas |
| Solución + demo | Correcto pero el orden importa | Demo debe fluir dentro de la narrativa, no como bloque separado |
| Siguientes pasos | Demasiado genérico | Dividir: roadmap técnico corto + visión de masificación |
| Modelo de negocio | Falta completamente en la mayoría de pitches | Hacerlo concreto y con número de mercado |

### Pilares recomendados (5 en lugar de 4)

```
1. PROBLEMA        (0:00 – 0:35)  — historia + dato real
2. SOLUCIÓN        (0:35 – 1:00)  — el sistema, no solo la app
3. DEMO EN VIVO    (1:00 – 2:00)  — 3 momentos mágicos en 60 segundos
4. ESCALABILIDAD   (2:00 – 2:25)  — roadmap + mercado
5. MODELO DE NEGOCIO (2:25 – 3:00) — cómo gana dinero
```

> Se separa Demo de Solución porque los jueces necesitan **ver** la IA antes de que les expliques cómo funciona. El demo es evidencia, no ilustración.

---

## CÓMO RESPONDE ESTE GUION A LOS CRITERIOS DE JUICIO

| Criterio | Cómo lo cubre el pitch |
|---|---|
| **Technicality** | Mencionas explícitamente los 3 cerebros (agentes), Pinecone, Gemini Embedding 2, OCR pipeline. El demo MUESTRA la IA trabajando en tiempo real. |
| **Originality** | La historia del acceso equitativo + la arquitectura de 3 cerebros + multimodalidad unificada no existe como producto integrado. Lo dices en el cierre del Problema. |
| **UI/UX/DX** | El demo habla solo — pantalla limpia, respuesta en segundos, cero formularios. Debes mencionar el diseño deliberado: "diseñada para adultos mayores y cuidadores". |
| **Practicality** | El personaje demo (tu papá, o un paciente real) y los flujos reales (foto de almuerzo, nota del doctor) demuestran uso inmediato. No es un prototipo de laboratorio. |
| **Presentation** | Estructura narrativa clara, un solo hilo emocional, demo que fluye, cierre con cifras de mercado. Sin jerga técnica en los primeros 60 segundos. |

---

## GUION COMPLETO

---

### [BLOQUE 1 — PROBLEMA] `0:00 – 0:35`

> **Tono:** personal, directo, sin slides si es posible — solo hablar

---

"Mi papá tiene diabetes.

Como la mayoría de pacientes con diabetes en América Latina, no tiene un CGM — ese sensor continuo de glucosa que cuesta cientos de dólares al mes. Lo que tiene es un glucómetro básico, una lista de medicamentos que a veces olvida, y una carpeta llena de notas del médico que no siempre entiende.

Y ese es el problema real.

**Hay 537 millones de personas con diabetes en el mundo. La mayoría no controla bien su enfermedad — no porque no quieran, sino porque la información está fragmentada, es difícil de interpretar, y las herramientas que existen o son muy costosas o son demasiado complejas.**

No necesitan otro tracker. Necesitan algo que entienda lo que les pasa, lo recuerde, y les diga qué hacer a continuación."

---

> **Nota para el presentador:** Si tu historia personal es diferente, cámbiala — pero mantén el gancho emocional. La estadística de los 537 millones es real (IDF 2021).

---

### [BLOQUE 2 — SOLUCIÓN] `0:35 – 1:00`

> **Tono:** confiado, técnico pero comprensible. Aquí muestras el teléfono por primera vez.

---

"Construimos **Diabetes Guardian.**

Una app de acompañamiento multimodal con inteligencia artificial que convierte inputs cotidianos — una foto de comida, una nota de voz del médico, un PDF de laboratorio — en guía personalizada, memoria clínica y alertas tempranas.

El núcleo de la app es una arquitectura de tres agentes de IA especializados:

- El **Metabolic Brain** interpreta comidas, glucosa y riesgo diario.
- El **Clinical Brain** extrae información de documentos médicos y voces del doctor.
- El **Memory Brain** conecta todo en el tiempo y responde preguntas como '¿qué cambió desde mi última consulta?'

Los tres trabajan juntos sobre una capa de embeddings multimodales con Gemini y memoria vectorial con Pinecone."

---

> **Nota para el presentador:** Aquí levantas el teléfono o apuntas a la pantalla. No entres en detalles técnicos aún — eso lo hace el demo.

---

### [BLOQUE 3 — DEMO] `1:00 – 2:00`

> **Tono:** fluido, natural. No leas — narra. El app habla por ti.
> **Objetivo:** mostrar 3 momentos mágicos en 60 segundos.

---

**[Momento 1 — Home Screen, 10 segundos]**

"Esta es la pantalla de inicio. El paciente abre la app y ve su estado del día: una prioridad, un insight generado por IA, y el botón de Smart Capture."

*[Señalar la pantalla sin detenerse demasiado]*

---

**[Momento 2 — Foto de comida → análisis, 20 segundos]**

"Smart Capture permite ingresar cualquier cosa — texto, foto, audio, documento. Voy a capturar el almuerzo del paciente."

*[Seleccionar foto de comida — usar foto pre-cargada para velocidad]*

"En segundos, el Metabolic Brain identifica la comida, calcula el riesgo de pico glucémico, y entrega una recomendación concreta. No solo 'carbohidratos altos' — sino *qué hacer ahora.*"

*[Mostrar el resultado: spike_risk + recomendación + acción]*

---

**[Momento 3 — Nota médica → resumen, 20 segundos]**

"Ahora el paciente llega del médico con una hoja que no entiende. La sube aquí."

*[Seleccionar PDF o imagen de nota médica pre-cargada]*

"El Clinical Brain extrae los hallazgos, identifica cambios de medicación, y devuelve un resumen en lenguaje simple con acciones de seguimiento."

*[Mostrar el resultado]*

---

**[Momento 4 — Asistente con memoria, 10 segundos]**

"Y aquí está la parte más poderosa. El paciente puede preguntarle a la app:"

*[Escribir o mostrar la pregunta: '¿Qué cambió desde mi última visita?']*

"El Memory Brain busca en el historial vectorial y responde con contexto real del paciente — no respuestas genéricas."

*[Mostrar la respuesta]*

---

> **Nota para el presentador:** Practica este bloque hasta que no necesites leer nada. Cada transición entre momentos debe ser máximo 2 segundos. Si algo falla, ten un screenshot de respaldo.

---

### [BLOQUE 4 — ESCALABILIDAD Y NEXT STEPS] `2:00 – 2:25`

> **Tono:** ambicioso pero aterrizado. Aquí hablas rápido.

---

"Lo que ven hoy es la Fase 1.
---siguientes pasos cambiarlos---
**Corto plazo:** integración con Dexcom para lectura automática de CGM, panel para cuidadores, análisis predictivo de glucosa con modelos LSTM entrenados sobre datasets clínicos reales — OhioT1DM y HUPA-UCM.

**Medio plazo:** módulo para clínicas y hospitales que permite al médico ver el historial del paciente preparado por IA antes de la consulta. Reducción de tiempo de consulta, mejor adherencia.

**Largo plazo:** democratizar esto a escala regional. América Latina tiene más de 62 millones de personas con diabetes. La mayoría sin acceso a tecnología de monitoreo avanzado. Diabetes Guardian es la capa de acompañamiento inteligente que puede llegar donde el CGM no puede."

---

### [BLOQUE 5 — MODELO DE NEGOCIO] `2:25 – 3:00`

> **Tono:** seguro, concreto. Un número grande + un modelo simple.

---

"El modelo es freemium con tres capas:

**Consumidor:** app gratuita con funciones básicas. Premium a $4.99/mes — memoria extendida, análisis ilimitados, resúmenes clínicos.

**Clínicas y hospitales:** licencia B2B por paciente activo. El médico gana contexto. La clínica gana adherencia. Nosotros escalamos.

**Farmacéuticas y aseguradoras:** datos anonimizados y agregados sobre patrones de adherencia, riesgo y efectividad de tratamientos — con consentimiento explícito.

El mercado de digital health para diabetes vale **más de 24 mil millones de dólares para 2030.** Estamos en la capa que hoy más le falta a ese mercado: el acompañamiento diario inteligente para la mayoría que no tiene acceso a soluciones premium.

**Diabetes Guardian. Porque entender tu diabetes no debería ser un privilegio.**"

---

> **Nota para el presentador:** Cierra con la frase final en silencio — no la atropelles. Deja que respire.

---

## HOJA DE REFERENCIA RÁPIDA (cheat sheet)

```
0:00  "Mi papá tiene diabetes..."
0:20  "537 millones. Fragmentado. Incomprensible."
0:35  "Construimos Diabetes Guardian."
0:45  "Tres cerebros: Metabolic / Clinical / Memory"
1:00  [Abrir app — Home Screen]
1:10  [Foto comida → spike risk + acción]
1:30  [PDF médico → resumen en lenguaje simple]
1:50  ["¿Qué cambió?" → respuesta con contexto]
2:00  "Fase 1. Luego Dexcom, predicción LSTM, panel clínico."
2:15  "62 millones en LATAM sin acceso."
2:25  "Freemium $9.99 / B2B por paciente / datos agregados."
2:45  "$24B de mercado. Nosotros somos la capa que falta."
3:00  "Porque entender tu diabetes no debería ser un privilegio."
```

---

## ERRORES COMUNES A EVITAR

| Error | Por qué mata el pitch |
|---|---|
| Abrir con estadísticas antes de la historia | Los jueces se desconectan. La emoción va primero. |
| Explicar la arquitectura técnica antes del demo | El judge no tiene contexto para evaluar la tech si no vio el output. |
| Demo muy lento o con esperas | Usa datos pre-cargados. Nunca esperes a que cargue algo en vivo sin tener backup. |
| Decir "en el futuro vamos a hacer X" sin anclar en el presente | Muestra lo que existe HOY. El futuro es creíble si el presente es real. |
| Modelo de negocio vago ("venderemos datos") | Los jueces escuchan esto siempre. Sé concreto: precio, quién paga, por qué. |
| Cerrar con "gracias" | Cierra con la frase de posicionamiento. El agradecimiento lo das después de las preguntas. |

---

## PREGUNTAS FRECUENTES DEL JURADO (y cómo responderlas)

**"¿Cómo manejan la privacidad de los datos médicos?"**
> "Los datos del paciente se almacenan en Supabase con RLS por usuario. Los vectores en Pinecone incluyen `patient_id` como filtro obligatorio. No compartimos datos sin consentimiento explícito y anonimización. Cumplimos con los principios de HIPAA para el roadmap de expansión a EE.UU."

**"¿Qué los diferencia de apps como mySugr o Glucose Buddy?"**
> "Esas apps son trackers pasivos. El paciente ingresa datos y ve gráficas. Nosotros somos activos: interpretamos, recordamos y guiamos. La diferencia es entre un cuaderno de notas y un asistente que leyó todas tus notas y te explica qué significan."

**"¿Ya tienen usuarios reales?"**
> "Hoy tenemos datos demo seeded que representan un historial clínico realista de 30 días. El siguiente paso post-hackathon es un piloto cerrado con 10 pacientes en [ciudad/país]. Buscamos partnerships con clínicas de endocrinología para validación clínica."

**"¿Cómo escala el costo de los agentes de IA?"**
> "Los costos de inference en OpenAI/Anthropic a escala son predecibles. La capa de embeddings con Gemini y retrieval con Pinecone está optimizada para hacer la llamada a modelos costosos solo cuando hay un nuevo input — no en cada interacción. El costo por usuario activo mensual es inferior a $0.30 con el modelo actual."

---

## NOTAS DE PRODUCCIÓN DEL DEMO

- **Dispositivo:** iPhone con pantalla limpia, sin notificaciones, modo avión desactivado solo para las APIs necesarias
- **Datos pre-cargados:** foto de almuerzo lista en galería, PDF de nota médica listo en Files, historial de 30 días seeded en Supabase
- **Backup:** screenshots de cada paso en caso de fallo de conexión
- **Espejo en pantalla:** si proyectas, usa QuickTime Player (Mac) o Reflector para mirror sin lag
- **Velocidad:** el demo debe completar los 4 momentos en máximo 60 segundos — practica cronometrado

---

*Documento generado para el hackathon. Versión: 2026-03-21.*
