import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  Mic,
  FileText,
  Camera,
  Edit3,
  Send,
  Sparkles,
  Utensils,
  X,
  Check,
  AlertCircle,
  ImageIcon,
} from "lucide-react-native";
import Svg, {
  LinearGradient as SvgLinearGradient,
  Rect,
  Defs,
  Stop,
} from "react-native-svg";
import { answerQuestion, whatChanged } from "../services/brains/memoryBrain";
import { processCapture } from "../services/captureService";
import { ensurePatientSession } from "../services/patientSessionService";
import {
  cancelMicrophoneRecording,
  startMicrophoneRecording,
  stopMicrophoneRecording,
} from "../services/audioRecordingService";
const { width } = Dimensions.get("window");

const C = {
  bg: "#F5EFE8",
  surface: "#FFFFFF",
  surfaceSoft: "#F7F2EC",
  line: "#E5DDD3",
  black: "#0A0A0A",
  text: "#111111",
  textSec: "#4A4A4A",
  textMuted: "#7B7B7B",
  // Card palettes — matching the 2x2 design reference
  pinkBg: "#F8E8F0",
  pinkIcon: "#D4608A",
  blueBg: "#E8EFFE",
  blueIcon: "#4F87EF",
  greenBg: "#E9F6EC",
  greenIcon: "#4F9E62",
  yellowBg: "#FDFAE0",
  yellowIcon: "#B08020",
  // Status
  ok: "#059669",
  okBg: "#ECFDF5",
  err: "#DC2626",
  errBg: "#FEF2F2",
  progress: "#111111",
};


// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AsistenteScreen() {
  const tabBarHeight = useBottomTabBarHeight();

  // Chat
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "user",
      text: "¿Qué cambió desde mi última visita?",
      time: "HOY 10:42 AM",
    },
    {
      id: "2",
      sender: "ai",
      text: "Desde tu visita del 5/03 han ocurrido estos cambios:",
      isList: true,
      time: "HOY 10:42 AM",
    },
  ]);

  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    let isActive = true;

    ensurePatientSession().catch((error) => {
      if (!isActive) {
        return;
      }

      Alert.alert("No se pudo conectar", error.message);
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      pulseLoopRef.current?.stop();

      if (recordingRef.current) {
        void cancelMicrophoneRecording(recordingRef.current);
        recordingRef.current = null;
      }
    };
  }, []);

  // Modal
  const [activeModal, setActiveModal] = useState(null); // 'audio'|'document'|'food'|'note'
  const [phase, setPhase] = useState("idle"); // 'idle'|'active'|'processing'|'done'|'error'
  const [captureResult, setCaptureResult] = useState(null);
  const [captureError, setCaptureError] = useState(null);
  const [progressLabel, setProgressLabel] = useState("");
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Audio
  const recordingRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const timerRef = useRef(null);
  const micPulse = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef(null);

  // Note
  const [noteText, setNoteText] = useState("");
  const [noteMode, setNoteMode] = useState("text");

  // ── Progress helpers ─────────────────────────────────────────────────────────
  const animateProgress = (label, duration = 2500) => {
    setProgressLabel(label);
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 0.85,
      duration,
      useNativeDriver: false,
    }).start();
  };

  const finishProgress = () =>
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

  // ── Smart capture pipeline ───────────────────────────────────────────────────
  const runCapture = async (params, modalType) => {
    setPhase("processing");
    animateProgress("Conectando tu perfil…", 900);
    try {
      const { patientId } = await ensurePatientSession();
      animateProgress("Procesando con Gemini AI…");
      const result = await processCapture({ ...params, patientId });
      finishProgress();
      setCaptureResult(result);
      setPhase("done");

      // Inject rich capture summary bubble into chat
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "ai",
          captureCard: true,
          captureType: modalType,
          captureResult: result,
          time: new Date().toLocaleTimeString("es-PE", { hour: "numeric", minute: "2-digit" }),
        },
      ]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (err) {
      setCaptureError(err.message);
      setPhase("error");
    }
  };

  // ── Open / close modal ───────────────────────────────────────────────────────
  const openModal = (type) => {
    setActiveModal(type);
    setPhase("idle");
    setCaptureResult(null);
    setCaptureError(null);
    setNoteText("");
    setNoteMode("text");
    setIsRecording(false);
    setRecSeconds(0);
    progressAnim.setValue(0);
  };

  const closeModal = async () => {
    clearInterval(timerRef.current);
    pulseLoopRef.current?.stop();
    pulseLoopRef.current = null;
    micPulse.setValue(1);

    if (recordingRef.current) {
      await cancelMicrophoneRecording(recordingRef.current);
      recordingRef.current = null;
    }

    setIsRecording(false);
    setActiveModal(null);
  };

  // ── Audio recording ──────────────────────────────────────────────────────────
  const startRecording = async () => {
    if (recordingRef.current) {
      return;
    }

    try {
      const recording = await startMicrophoneRecording();
      recordingRef.current = recording;
      setIsRecording(true);
      setPhase("active");
      setRecSeconds(0);

      // Pulse animation
      pulseLoopRef.current?.stop();
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(micPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseLoopRef.current.start();

      timerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error("Recording start failed:", err);

      if (err?.code === "MICROPHONE_PERMISSION_DENIED") {
        Alert.alert(
          "Permiso necesario",
          err.canAskAgain === false
            ? "El micrófono está bloqueado. Actívalo desde la configuración del teléfono."
            : "Necesitamos acceso al micrófono para grabar."
        );
        return;
      }

      Alert.alert("No se pudo grabar", "Ocurrió un problema al iniciar la grabación.");
    }
  };

  const stopRecording = async () => {
    const duration = recSeconds; // capture before any state resets
    clearInterval(timerRef.current);
    pulseLoopRef.current?.stop();
    pulseLoopRef.current = null;
    micPulse.setValue(1);
    setIsRecording(false);

    const recording = recordingRef.current;
    recordingRef.current = null;
    if (!recording) return;

    try {
      const { uri, mimeType } = await stopMicrophoneRecording(recording);

      if (uri) {
        const modalKey = activeModal === "note" ? "audio" : activeModal ?? "audio";
        await runCapture(
          { type: "audio", audioUri: uri, audioMime: mimeType, durationSeconds: duration },
          modalKey
        );
      }
    } catch (err) {
      console.error("Recording stop failed:", err);
      Alert.alert("No se pudo procesar", "Ocurrió un problema al finalizar la grabación.");
      setPhase("idle");
    }
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const inferDocumentMimeType = (asset) => {
    const name = asset?.name?.toLowerCase() ?? "";
    if (asset?.mimeType) return asset.mimeType;
    if (name.endsWith(".docx")) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    if (name.endsWith(".pdf")) {
      return "application/pdf";
    }
    return "application/pdf";
  };

  const handleDocumentQuickAction = async () => {
    openModal("document");
    await pickDocument();
  };

  const handleFoodQuickAction = async () => {
    openModal("food");
    await pickFood("camera");
  };

  // ── Document picker ──────────────────────────────────────────────────────────
  const pickDocument = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      copyToCacheDirectory: true,
    });
    if (!picked.canceled && picked.assets?.[0]) {
      const asset = picked.assets[0];
      animateProgress(`Subiendo ${asset.name ?? "archivo"}…`, 1200);
      setPhase("processing");
      await new Promise((r) => setTimeout(r, 1200));
      animateProgress("Extrayendo contenido clínico…", 1400);
      await new Promise((r) => setTimeout(r, 400));
      await runCapture(
        { type: "document", documentUri: asset.uri, documentMime: inferDocumentMimeType(asset) },
        "document"
      );
    }
  };

  // ── Food / photo ─────────────────────────────────────────────────────────────
  const pickFood = async (source) => {
    let picked;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso necesario", "Necesitamos acceso a tu cámara.");
        return;
      }
      picked = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.85 });
    } else {
      picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    }
    if (!picked.canceled && picked.assets?.[0]) {
      animateProgress("Identificando alimentos con Gemini Vision…", 1600);
      setPhase("processing");
      await new Promise((r) => setTimeout(r, 400));
      await runCapture({ type: "meal_photo", imageUri: picked.assets[0].uri }, "food");
    }
  };

  // ── Note save ────────────────────────────────────────────────────────────────
  const saveNote = async () => {
    if (!noteText.trim()) return;
    Keyboard.dismiss();
    await runCapture({ type: "text", text: noteText.trim() }, "note");
  };

  const switchNoteMode = (mode) => {
    if (isRecording) return;
    setNoteMode(mode);
    setCaptureResult(null);
    setCaptureError(null);
    progressAnim.setValue(0);
    if (phase !== "idle") {
      setPhase("idle");
    }
  };

  // ── Chat send ────────────────────────────────────────────────────────────────
  const handleSend = async (text) => {
    const val = typeof text === "string" ? text : inputText;
    if (!val.trim() || isSending) return;
    const time = new Date().toLocaleTimeString("es-PE", { hour: "numeric", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "user", text: val.trim(), time },
    ]);
    setInputText("");
    setIsSending(true);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const { patientId } = await ensurePatientSession();
      let aiText;
      const isChange = /cambió|cambio|última visita/i.test(val);
      if (isChange) {
        const r = await whatChanged(patientId, "tu última visita");
        const lines = (r.changes ?? []).map((c) => `${c.emoji ?? "•"} ${c.description}`).join("\n");
        aiText = r.headline ? `${r.headline}\n\n${lines}` : lines || "Sin cambios registrados aún.";
        if (r.next_action) aiText += `\n\n→ ${r.next_action}`;
      } else {
        const r = await answerQuestion(val, patientId);
        aiText = r.answer ?? "No tengo suficiente información aún.";
        if (r.next_action) aiText += `\n\n→ ${r.next_action}`;
      }
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "ai", text: aiText, isList: false, time },
      ]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "ai", text: "No pude conectarme. Verifica tu conexión.", isList: false },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* ── Header ── */}
      <View style={s.header}>

        <Text style={s.headerTitle}>¿En qué puedo{"\n"}ayudarte hoy?</Text>
        <Text style={s.headerSub}>
          Tu historial completo analizado para respuestas personalizadas.
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Animated.ScrollView
          ref={scrollViewRef}
          style={[s.scroll, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          contentContainerStyle={[s.scrollContent, { paddingBottom: tabBarHeight + 140 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 2×2 Module grid ── */}
          <View style={s.grid}>
            <ModuleCard
              icon={Mic}
              label="Grabar audio"
              sub="Consulta"
              color={C.pinkIcon}
              bg={C.pinkBg}
              onPress={() => openModal("audio")}
            />
            <ModuleCard
              icon={FileText}
              label="Subir"
              sub="Documento"
              color={C.blueIcon}
              bg={C.blueBg}
              onPress={handleDocumentQuickAction}
            />
            <ModuleCard
              icon={Utensils}
              label="Alimentos"
              sub="Foto/Texto"
              color={C.greenIcon}
              bg={C.greenBg}
              onPress={handleFoodQuickAction}
            />
            <ModuleCard
              icon={Edit3}
              label="Escribir"
              sub="Nota libre"
              color={C.yellowIcon}
              bg={C.yellowBg}
              onPress={() => openModal("note")}
            />
          </View>


          {/* ── Chat ── */}
          <View style={s.chat}>
            <Text style={s.chatTimestamp}>HOY</Text>
            {messages.map((msg, idx) => {
              const prevSender = messages[idx - 1]?.sender;
              const showAvatar = msg.sender === "ai" && prevSender !== "ai";
              return (
                <View key={msg.id} style={msg.sender === "user" ? s.userWrap : s.aiWrap}>
                  {msg.sender === "ai" && (
                    <View style={[s.avatar, { opacity: showAvatar ? 1 : 0 }]}>
                      <Sparkles color="#fff" size={12} fill="#fff" />
                    </View>
                  )}
                  {msg.captureCard ? (
                    <View style={s.aiBubble}>
                      <CaptureSummaryCard type={msg.captureType} result={msg.captureResult} />
                    </View>
                  ) : (
                    <View style={msg.sender === "user" ? s.userBubble : s.aiBubble}>
                      <Text style={msg.sender === "user" ? s.userText : s.aiText}>{msg.text}</Text>
                      {msg.isList && (
                        <View style={s.listWrap}>
                          <ListItem emoji="💊" text={<Text><Text style={s.bold}>Metformina</Text> ajustada a 1000 mg diarios.</Text>} />
                          <ListItem emoji="📉" bg={C.okBg} text={<Text>Glucosa <Text style={s.boldGreen}>bajó 15 %</Text>. De 168 a 142 mg/dL.</Text>} />
                          <ListItem emoji="🏃" bg="#EBF2FF" text={<Text><Text style={s.bold}>Adherencia 87 %</Text> (era 61 % el mes pasado).</Text>} />
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
            {isSending && (
              <View style={s.aiWrap}>
                <View style={s.avatar}>
                  <Sparkles color="#fff" size={12} fill="#fff" />
                </View>
                <View style={[s.aiBubble, s.typingBubble]}>
                  <ActivityIndicator color={C.black} size="small" />
                  <Text style={s.typingText}>Analizando historial…</Text>
                </View>
              </View>
            )}
          </View>
        </Animated.ScrollView>

        {/* ── Fade overlay ── */}
        <View style={[s.fadeOverlay, { height: tabBarHeight + 110 }]} pointerEvents="none">
          <Svg viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgLinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={C.bg} stopOpacity="0" />
                <Stop offset="0.5" stopColor={C.bg} stopOpacity="0.95" />
                <Stop offset="1" stopColor={C.bg} stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#fade)" />
          </Svg>
        </View>

        {/* ── Input bar ── */}
        <View style={[s.inputContainer, { bottom: tabBarHeight + 16 }]}>
          <View style={s.inputWrap}>
            <Pressable style={s.inputIcon} onPress={handleFoodQuickAction}>
              <Camera color={C.textSec} size={20} strokeWidth={2} />
            </Pressable>
            <TextInput
              style={s.textInput}
              placeholder="Explícame mi último examen…"
              placeholderTextColor={C.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend(inputText)}
              editable={!isSending}
              returnKeyType="send"
            />
            <Pressable
              style={[s.sendBtn, isSending && s.sendBtnOff]}
              onPress={() => (inputText.trim() ? handleSend(inputText) : openModal("audio"))}
              disabled={isSending}
            >
              {inputText.trim() && !isSending ? (
                <Send color="#fff" size={18} strokeWidth={2.5} />
              ) : (
                <Mic color="#fff" size={18} strokeWidth={2.5} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ── AUDIO MODAL ── */}
      <CaptureModal visible={activeModal === "audio"} onClose={closeModal} title="Grabar consulta">
        {phase === "idle" && (
          <ModalIdle
            icon={<Mic color={C.pinkIcon} size={48} strokeWidth={1.5} />}
            bg={C.pinkBg}
            headline="Graba tu consulta"
            sub="Habla sobre síntomas, glucosa, medicamentos o cualquier cambio que quieras guardar."
            btnLabel="Empieza a grabar"
            btnColor={C.pinkIcon}
            onAction={startRecording}
          />
        )}
        {phase === "active" && (
          <View style={s.modalBody}>
            <Animated.View style={[s.recordingRing, { transform: [{ scale: micPulse }], borderColor: C.pinkIcon }]}>
              <View style={[s.recordingCenter, { backgroundColor: C.pinkBg }]}>
                <Mic color={C.pinkIcon} size={40} strokeWidth={1.5} />
              </View>
            </Animated.View>
            <Text style={s.timerText}>{formatTime(recSeconds)}</Text>
            <Text style={s.recordingHint}>Grabando. Toca el botón para parar y analizar.</Text>
            <Pressable style={[s.actionBtn, { backgroundColor: C.pinkIcon }]} onPress={stopRecording}>
              <Text style={s.actionBtnText}>Parar grabación</Text>
            </Pressable>
            <PrivacyCallout />
          </View>
        )}
        {(phase === "processing" || phase === "done" || phase === "error") && (
          <ResultPanel
            phase={phase}
            label={progressLabel}
            progress={progressAnim}
            result={captureResult}
            error={captureError}
            onClose={closeModal}
            renderResult={() => (
            <View style={{ gap: 10 }}>
              {captureResult?.transcript && (
                <View style={s.transcriptBox}>
                  <Text style={s.transcriptLabel}>Transcripción</Text>
                  <Text style={s.transcriptText}>{captureResult.transcript}</Text>
                </View>
              )}
              <GuidanceResult result={captureResult} />
            </View>
          )}
          />
        )}
      </CaptureModal>

      {/* ── DOCUMENT MODAL ── */}
      <CaptureModal visible={activeModal === "document"} onClose={closeModal} title="Subir documento">
        {phase === "idle" && (
          <ModalIdle
            icon={<FileText color={C.blueIcon} size={48} strokeWidth={1.5} />}
            bg={C.blueBg}
            headline="Sube tus exámenes"
            sub="Laboratorios, prescripciones o notas médicas en PDF o Word (.docx)."
            btnLabel="Seleccionar archivo"
            btnColor={C.blueIcon}
            onAction={pickDocument}
          />
        )}
        {(phase === "processing" || phase === "done" || phase === "error") && (
          <ResultPanel
            phase={phase}
            label={progressLabel}
            progress={progressAnim}
            result={captureResult}
            error={captureError}
            onClose={closeModal}
            renderResult={() => (
              <View style={{ gap: 10 }}>
                <GuidanceResult result={captureResult} />
                {captureResult?.clinicalSummary?.key_findings?.length > 0 && (
                  <View style={s.findingsBox}>
                    <Text style={s.findingsTitle}>Hallazgos clave</Text>
                    {captureResult.clinicalSummary.key_findings.map((f, i) => (
                      <Text key={i} style={s.findingItem}>• {f}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          />
        )}
      </CaptureModal>

      {/* ── FOOD MODAL ── */}
      <CaptureModal visible={activeModal === "food"} onClose={closeModal} title="Registrar alimento">
        {phase === "idle" && (
          <View style={s.modalBody}>
            <View style={[s.idleIconWrap, { backgroundColor: C.greenBg }]}>
              <Utensils color={C.greenIcon} size={48} strokeWidth={1.5} />
            </View>
            <Text style={s.idleHeadline}>¿Qué comiste?</Text>
            <Text style={s.idleSub}>La cámara se abre al tocar Comida. Si prefieres, también puedes elegir una foto guardada para analizarla.</Text>
            <View style={s.twoButtons}>
              <Pressable style={[s.halfBtn, { borderColor: C.greenIcon }]} onPress={() => pickFood("camera")}>
                <Camera color={C.greenIcon} size={22} strokeWidth={2} />
                <Text style={[s.halfBtnText, { color: C.greenIcon }]}>Cámara</Text>
              </Pressable>
              <Pressable style={[s.halfBtn, { borderColor: C.greenIcon }]} onPress={() => pickFood("gallery")}>
                <ImageIcon color={C.greenIcon} size={22} strokeWidth={2} />
                <Text style={[s.halfBtnText, { color: C.greenIcon }]}>Galería</Text>
              </Pressable>
            </View>
            <PrivacyCallout />
          </View>
        )}
        {(phase === "processing" || phase === "done" || phase === "error") && (
          <ResultPanel
            phase={phase}
            label={progressLabel}
            progress={progressAnim}
            result={captureResult}
            error={captureError}
            onClose={closeModal}
            renderResult={() => (
              <View style={{ gap: 12 }}>
                {captureResult?.foodTitle ? (
                  <Text style={s.foodTitle}>{captureResult.foodTitle}</Text>
                ) : null}
                {captureResult?.nutritionData?.totals && (
                  <View style={s.macroRow}>
                    <MacroPill label="Cal" value={Math.round(captureResult.nutritionData.totals.calories)} unit="kcal" />
                    <MacroPill label="Carbs" value={Math.round(captureResult.nutritionData.totals.carbs_g)} unit="g" />
                    <MacroPill label="Prot" value={Math.round(captureResult.nutritionData.totals.protein_g)} unit="g" />
                    <MacroPill label="Grasa" value={Math.round(captureResult.nutritionData.totals.fat_g)} unit="g" />
                  </View>
                )}
                {captureResult?.guidance?.spike_risk && (
                  <View style={[s.riskBadge, captureResult.guidance.spike_risk === "alto" ? s.riskHigh : s.riskMid]}>
                    <Text style={captureResult.guidance.spike_risk === "alto" ? s.riskHighText : s.riskMidText}>
                      Riesgo de pico: {captureResult.guidance.spike_risk}
                    </Text>
                  </View>
                )}
                <GuidanceResult result={captureResult} />
              </View>
            )}
          />
        )}
      </CaptureModal>

      {/* ── NOTE MODAL ── */}
      <Modal visible={activeModal === "note"} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={s.noteOverlay}>
            <View style={s.noteSheet}>
              {/* Handle */}
              <View style={s.sheetHandle} />

              {phase === "idle" || phase === "active" ? (
                <>
                  <Text style={s.noteTitle}>¿Qué pasó hoy?</Text>
                  <Text style={s.noteSub}>Elige si quieres escribir algo o grabar una nota de voz para tu historial privado.</Text>

                  <View style={s.noteModeRow}>
                    <Pressable
                      style={[s.noteModeBtn, noteMode === "text" && s.noteModeBtnActive]}
                      onPress={() => switchNoteMode("text")}
                      disabled={isRecording}
                    >
                      <Edit3 color={noteMode === "text" ? "#fff" : C.textSec} size={16} strokeWidth={2} />
                      <Text style={[s.noteModeText, noteMode === "text" && s.noteModeTextActive]}>Anotar</Text>
                    </Pressable>
                    <Pressable
                      style={[s.noteModeBtn, noteMode === "voice" && s.noteModeBtnActive]}
                      onPress={() => switchNoteMode("voice")}
                      disabled={isRecording}
                    >
                      <Mic color={noteMode === "voice" ? "#fff" : C.textSec} size={16} strokeWidth={2} />
                      <Text style={[s.noteModeText, noteMode === "voice" && s.noteModeTextActive]}>Grabar voz</Text>
                    </Pressable>
                  </View>

                  {noteMode === "text" ? (
                    <>
                      <TextInput
                        style={s.noteInput}
                        placeholder="Describe tu comida, glucosa, síntomas o cualquier cambio…"
                        placeholderTextColor={C.textMuted}
                        value={noteText}
                        onChangeText={setNoteText}
                        multiline
                        autoFocus
                        textAlignVertical="top"
                      />
                      <Pressable
                        style={[s.actionBtn, !noteText.trim() && s.saveBtnOff, s.notePrimaryBtn]}
                        onPress={saveNote}
                        disabled={!noteText.trim()}
                      >
                        <Text style={s.actionBtnText}>Guardar nota</Text>
                      </Pressable>
                    </>
                  ) : (
                    <View style={s.noteVoiceCard}>
                      <View style={[s.noteVoiceOrb, phase === "active" && s.noteVoiceOrbActive]}>
                        <Mic color={C.pinkIcon} size={30} strokeWidth={1.8} />
                      </View>
                      <Text style={s.noteVoiceTitle}>
                        {phase === "active" ? formatTime(recSeconds) : "Nota de voz privada"}
                      </Text>
                      <Text style={s.noteVoiceHint}>
                        {phase === "active"
                          ? "Grabando ahora. Pulsa el botón para parar, transcribir y analizar."
                          : "Tu voz se transcribirá y se añadirá a tu base clínica e historial reservado."}
                      </Text>
                      <Pressable
                        style={[s.actionBtn, { backgroundColor: C.pinkIcon }]}
                        onPress={phase === "active" ? stopRecording : startRecording}
                      >
                        <Text style={s.actionBtnText}>
                          {phase === "active" ? "Parar grabación" : "Empieza a grabar"}
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  <PrivacyCallout text="Esto generará una base de datos clínica y un historial reservado solo para tu cuenta de paciente." />
                </>
              ) : (
                <ResultPanel
                  phase={phase}
                  label={progressLabel}
                  progress={progressAnim}
                  result={captureResult}
                  error={captureError}
                  onClose={closeModal}
                  renderResult={() => <GuidanceResult result={captureResult} />}
                />
              )}

              <Pressable style={s.noteCloseBtn} onPress={closeModal}>
                <X color={C.textMuted} size={18} strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModuleCard({ icon: Icon, label, sub, color, bg, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.card, { backgroundColor: bg }, pressed && s.pressed]}
    >
      <Icon color={color} size={36} strokeWidth={1.6} />
      <View style={s.cardText}>
        <Text style={[s.cardLabel, { color }]}>{label}</Text>
        <Text style={s.cardSub}>{sub}</Text>
      </View>
    </Pressable>
  );
}

function ListItem({ emoji, text, bg }) {
  return (
    <View style={[s.listItem, bg && { backgroundColor: bg }]}>
      <View style={s.listIconWrap}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
      </View>
      <Text style={s.listItemText}>{text}</Text>
    </View>
  );
}

/** Generic capture modal wrapper */
function CaptureModal({ visible, onClose, title, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.modalOverlay}>
        <View style={s.modalSheet}>
          <View style={s.sheetHandle} />
          <View style={s.modalHeaderRow}>
            <Text style={s.modalTitle}>{title}</Text>
            <Pressable style={s.modalCloseBtn} onPress={onClose}>
              <X color="#666" size={18} strokeWidth={2.5} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

/** Idle state inside a capture modal */
function ModalIdle({ icon, bg, headline, sub, btnLabel, btnColor, onAction }) {
  return (
    <View style={s.modalBody}>
      <View style={[s.idleIconWrap, { backgroundColor: bg }]}>{icon}</View>
      <Text style={s.idleHeadline}>{headline}</Text>
      <Text style={s.idleSub}>{sub}</Text>
      <Pressable style={[s.actionBtn, { backgroundColor: btnColor }]} onPress={onAction}>
        <Text style={s.actionBtnText}>{btnLabel}</Text>
      </Pressable>
      <PrivacyCallout />
    </View>
  );
}

function PrivacyCallout({
  text = "Esto se guardará en tu base de datos clínica e historial reservado solo para tu cuenta de paciente.",
}) {
  return (
    <View style={s.privacyBox}>
      <Text style={s.privacyEyebrow}>Historial clínico privado</Text>
      <Text style={s.privacyText}>{text}</Text>
    </View>
  );
}

/** Processing → done → error panel */
function ResultPanel({ phase, label, progress, result, error, onClose, renderResult }) {
  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  if (phase === "processing") {
    return (
      <View style={s.modalBody}>
        <ActivityIndicator color={C.black} size="large" style={{ marginBottom: 20 }} />
        <Text style={s.processingLabel}>{label}</Text>
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: barWidth }]} />
        </View>
        <Text style={s.processingHint}>Guardando en Pinecone y Supabase…</Text>
      </View>
    );
  }

  if (phase === "error") {
    return (
      <View style={s.modalBody}>
        <View style={[s.statusIcon, { backgroundColor: "#FEF2F2" }]}>
          <AlertCircle color={C.err} size={32} strokeWidth={1.5} />
        </View>
        <Text style={s.errorTitle}>Algo salió mal</Text>
        <Text style={s.errorMsg}>{error ?? "Intenta de nuevo."}</Text>
        <Pressable style={[s.actionBtn, { backgroundColor: C.black }]} onPress={onClose}>
          <Text style={s.actionBtnText}>Cerrar</Text>
        </Pressable>
      </View>
    );
  }

  // done
  return (
    <View style={s.modalBody}>
      <View style={[s.statusIcon, { backgroundColor: C.okBg }]}>
        <Check color={C.ok} size={32} strokeWidth={2.5} />
      </View>
      <Text style={s.doneTitle}>Guardado y analizado</Text>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: "100%" }]} />
      </View>
      <View style={s.resultBox}>
        {renderResult?.()}
      </View>
      <Pressable style={[s.actionBtn, { backgroundColor: C.black, marginTop: 8 }]} onPress={onClose}>
        <Text style={s.actionBtnText}>Listo</Text>
      </Pressable>
    </View>
  );
}

/** AI guidance display */
function GuidanceResult({ result }) {
  if (!result?.guidance) return null;
  const { recommendation, action } = result.guidance;
  return (
    <View style={{ gap: 8 }}>
      {recommendation ? (
        <Text style={s.guidanceRec}>{recommendation}</Text>
      ) : null}
      {action ? (
        <View style={s.actionLine}>
          <Text style={s.actionArrow}>→</Text>
          <Text style={s.actionLineText}>{action}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Capture Summary Card (shown in chat after each capture) ──────────────────
const CAPTURE_HEADERS = {
  food:     { emoji: "🍽", label: "Alimento registrado" },
  audio:    { emoji: "🎙", label: "Nota de voz analizada" },
  document: { emoji: "📄", label: "Documento procesado" },
  note:     { emoji: "📝", label: "Nota guardada" },
};

const CONTENT_KIND_LABELS = {
  meal_photo:       "Foto de comida",
  audio_transcript: "Nota de voz",
  lab_result:       "Resultado de laboratorio",
  prescription:     "Prescripción médica",
  doctor_note:      "Nota del médico",
  clinical_document:"Documento clínico",
  glucose_note:     "Registro de glucosa",
  meal_note:        "Registro de comida",
  medication_note:  "Registro de medicación",
  symptom_note:     "Síntoma registrado",
  free_text:        "Nota libre",
};

function CaptureSummaryCard({ type, result }) {
  if (!result) return null;
  const header = CAPTURE_HEADERS[type] ?? CAPTURE_HEADERS.note;
  const kindLabel = CONTENT_KIND_LABELS[result.contentKind] ?? result.contentKind ?? "";
  const rec = result?.guidance?.recommendation;
  const action = result?.guidance?.action;

  return (
    <View style={s.cscRoot}>
      {/* Header row */}
      <View style={s.cscHeader}>
        <Text style={s.cscEmoji}>{header.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.cscTitle}>{header.label}</Text>
          {kindLabel ? <Text style={s.cscKind}>{kindLabel}</Text> : null}
        </View>
      </View>

      {/* Food: title + macros + spike risk */}
      {type === "food" && (
        <>
          {result.foodTitle ? (
            <Text style={s.cscFoodName}>{result.foodTitle}</Text>
          ) : null}
          {result.nutritionData?.totals && (
            <View style={s.cscMacroRow}>
              <ChatMacro label="Cal" value={Math.round(result.nutritionData.totals.calories)} unit="kcal" />
              <ChatMacro label="Carbs" value={Math.round(result.nutritionData.totals.carbs_g)} unit="g" accent />
              <ChatMacro label="Prot" value={Math.round(result.nutritionData.totals.protein_g)} unit="g" />
              <ChatMacro label="Grasa" value={Math.round(result.nutritionData.totals.fat_g)} unit="g" />
            </View>
          )}
          {result.guidance?.spike_risk && (
            <View style={[s.cscBadge,
              result.guidance.spike_risk === "alto" ? s.cscBadgeHigh
              : result.guidance.spike_risk === "bajo" ? s.cscBadgeLow
              : s.cscBadgeMid]}>
              <Text style={[s.cscBadgeText,
                result.guidance.spike_risk === "alto" ? { color: C.err }
                : result.guidance.spike_risk === "bajo" ? { color: C.ok }
                : { color: "#D97706" }]}>
                Riesgo de pico glucémico: {result.guidance.spike_risk}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Audio: transcript snippet */}
      {type === "audio" && result.transcript && (
        <Text style={s.cscTranscript} numberOfLines={3}>"{result.transcript}"</Text>
      )}

      {/* Document: key findings */}
      {type === "document" && result.clinicalSummary?.key_findings?.length > 0 && (
        <View style={s.cscFindings}>
          {result.clinicalSummary.key_findings.slice(0, 3).map((f, i) => (
            <Text key={i} style={s.cscFindingItem}>• {f}</Text>
          ))}
        </View>
      )}

      {/* Recommendation + action — all types */}
      {rec && <Text style={s.cscRec}>{rec}</Text>}
      {action && (
        <View style={s.cscActionRow}>
          <Text style={s.cscActionArrow}>→</Text>
          <Text style={s.cscActionText}>{action}</Text>
        </View>
      )}
    </View>
  );
}

function ChatMacro({ label, value, unit, accent }) {
  return (
    <View style={[s.chatMacro, accent && s.chatMacroAccent]}>
      <Text style={[s.chatMacroVal, accent && s.chatMacroValAccent]}>{value}</Text>
      <Text style={s.chatMacroUnit}>{unit}</Text>
      <Text style={s.chatMacroLabel}>{label}</Text>
    </View>
  );
}

function MacroPill({ label, value, unit }) {
  return (
    <View style={s.macroPill}>
      <Text style={s.macroValue}>{value}</Text>
      <Text style={s.macroUnit}>{unit}</Text>
      <Text style={s.macroLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 10 },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(212,96,138,0.15)",
  },
  aiBadgeText: { fontSize: 13, fontWeight: "800", color: C.black },
  headerTitle: { fontSize: 36, fontWeight: "900", color: C.black, letterSpacing: -1.2, lineHeight: 40 },
  headerSub: { fontSize: 15, fontWeight: "500", color: C.textSec, marginTop: 10, lineHeight: 22 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 8, gap: 20 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },

  // 2×2 Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: (width - 44) / 2,
    minHeight: 160,
    borderRadius: 28,
    padding: 20,
    justifyContent: "space-between",
  },
  cardText: { gap: 3 },
  cardLabel: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  cardSub: { fontSize: 13, fontWeight: "600", color: "rgba(0,0,0,0.5)" },

  // Suggestions
  suggestionsSection: { gap: 10 },
  suggestionsHeader: { flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 4 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, color: C.textMuted },
  suggestionsRow: { gap: 8, paddingHorizontal: 2 },
  chip: {
    backgroundColor: C.surface,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: C.line,
  },
  chipText: { fontSize: 14, fontWeight: "600", color: C.text },

  // Chat
  chat: { gap: 14, paddingHorizontal: 2 },
  chatTimestamp: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: "#C9C0B6",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  userWrap: { alignItems: "flex-end", paddingLeft: 40 },
  userBubble: {
    backgroundColor: C.black,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderBottomRightRadius: 6,
  },
  userText: { color: "#fff", fontSize: 15, fontWeight: "500", lineHeight: 22 },
  aiWrap: { flexDirection: "row", alignItems: "flex-end", paddingRight: 40, gap: 8 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
  },
  aiBubble: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 24,
    borderTopLeftRadius: 6,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  aiText: { fontSize: 15, fontWeight: "500", color: C.text, lineHeight: 23 },
  typingBubble: { flexDirection: "row", alignItems: "center", gap: 10, flex: 0, paddingVertical: 14, paddingHorizontal: 18 },
  typingText: { fontSize: 14, color: C.textSec, fontWeight: "600" },

  // Chat list items
  listWrap: { gap: 10 },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: C.surfaceSoft,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  listIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  listItemText: { flex: 1, fontSize: 14, fontWeight: "500", color: C.textSec, lineHeight: 20 },
  bold: { fontWeight: "800", color: C.black },
  boldGreen: { fontWeight: "800", color: C.ok },

  // Fade overlay + input
  fadeOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 1 },
  inputContainer: { position: "absolute", left: 16, right: 16, zIndex: 2 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 999,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  inputIcon: { padding: 10, backgroundColor: C.surfaceSoft, borderRadius: 999 },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: C.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7B7B7B",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnOff: { backgroundColor: "#BFBFBF" },

  // ── Modal shared ──────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    minHeight: 360,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: C.line,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: C.black, letterSpacing: -0.4 },
  modalCloseBtn: { padding: 6, backgroundColor: C.surfaceSoft, borderRadius: 12 },

  modalBody: { alignItems: "center", gap: 16 },

  // Idle state
  idleIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  idleHeadline: { fontSize: 20, fontWeight: "800", color: C.black, textAlign: "center" },
  idleSub: { fontSize: 14, fontWeight: "500", color: C.textSec, textAlign: "center", lineHeight: 21, paddingHorizontal: 8 },

  // Action button
  actionBtn: {
    width: "100%",
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 8,
  },
  actionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  notePrimaryBtn: { backgroundColor: "#7B7B7B" },

  // Recording
  recordingRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingCenter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: { fontSize: 40, fontWeight: "800", color: C.black, letterSpacing: -1 },
  recordingHint: { fontSize: 14, color: C.textMuted, fontWeight: "600" },

  // Two buttons (food modal)
  twoButtons: { flexDirection: "row", gap: 12, width: "100%" },
  halfBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  halfBtnText: { fontSize: 16, fontWeight: "700" },

  // Progress / result
  processingLabel: { fontSize: 16, fontWeight: "700", color: C.black, textAlign: "center" },
  progressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: C.line,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: C.black, borderRadius: 3 },
  processingHint: { fontSize: 12, color: C.textMuted, fontWeight: "600" },

  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  doneTitle: { fontSize: 18, fontWeight: "800", color: C.black },
  errorTitle: { fontSize: 18, fontWeight: "800", color: C.err },
  errorMsg: { fontSize: 14, color: C.textSec, textAlign: "center", lineHeight: 21 },

  resultBox: { width: "100%", gap: 8 },

  // Guidance
  guidanceRec: { fontSize: 15, fontWeight: "500", color: C.textSec, lineHeight: 22 },
  actionLine: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  actionArrow: { fontSize: 16, fontWeight: "800", color: C.ok, marginTop: 1 },
  actionLineText: { flex: 1, fontSize: 14, fontWeight: "600", color: C.black, lineHeight: 21 },

  // Findings
  findingsBox: { backgroundColor: C.surfaceSoft, borderRadius: 14, padding: 14, gap: 6 },
  findingsTitle: { fontSize: 12, fontWeight: "800", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8 },
  findingItem: { fontSize: 14, fontWeight: "500", color: C.textSec },

  // Macros
  macroRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  macroPill: {
    backgroundColor: C.surfaceSoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    minWidth: 70,
  },
  macroValue: { fontSize: 18, fontWeight: "800", color: C.black },
  macroUnit: { fontSize: 11, fontWeight: "600", color: C.textMuted },
  macroLabel: { fontSize: 10, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", marginTop: 2 },

  // Risk badges
  riskBadge: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  riskHigh: { backgroundColor: "#FEF2F2" },
  riskMid: { backgroundColor: "#FFFBEB" },
  riskHighText: { fontSize: 13, fontWeight: "700", color: C.err },
  riskMidText: { fontSize: 13, fontWeight: "700", color: "#D97706" },

  // Note modal (bottom sheet)
  noteOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  noteSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
    paddingBottom: 36,
    minHeight: 380,
  },
  noteTitle: { fontSize: 22, fontWeight: "900", color: C.black, marginBottom: 6 },
  noteSub: { fontSize: 14, fontWeight: "500", color: C.textSec, marginBottom: 16, lineHeight: 20 },
  noteModeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  noteModeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: C.surfaceSoft,
  },
  noteModeBtnActive: {
    backgroundColor: C.black,
  },
  noteModeText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textSec,
  },
  noteModeTextActive: {
    color: "#fff",
  },
  noteInput: {
    borderWidth: 1.5,
    borderColor: "#A0B4F0",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: "500",
    color: C.text,
    minHeight: 130,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  noteVoiceCard: {
    width: "100%",
    backgroundColor: C.surfaceSoft,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  noteVoiceOrb: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.pinkBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(212,96,138,0.16)",
  },
  noteVoiceOrbActive: {
    borderColor: C.pinkIcon,
    backgroundColor: "#FDE7F1",
  },
  noteVoiceTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: C.black,
    letterSpacing: -0.5,
  },
  noteVoiceHint: {
    fontSize: 14,
    fontWeight: "500",
    color: C.textSec,
    textAlign: "center",
    lineHeight: 20,
  },
  saveBtn: {
    backgroundColor: "#7B7B7B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  saveBtnOff: { backgroundColor: "#D0CCCA" },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  privacyBox: {
    width: "100%",
    backgroundColor: C.surfaceSoft,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  privacyEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  privacyText: {
    fontSize: 13,
    fontWeight: "500",
    color: C.textSec,
    lineHeight: 19,
  },
  noteCloseBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 6,
    backgroundColor: C.surfaceSoft,
    borderRadius: 12,
  },

  // ── Capture Summary Card (in chat) ───────────────────────────────────────────
  cscRoot: { gap: 10 },
  cscHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cscEmoji: { fontSize: 22, lineHeight: 28 },
  cscTitle: { fontSize: 14, fontWeight: "800", color: C.black, letterSpacing: -0.2 },
  cscKind: { fontSize: 12, fontWeight: "600", color: C.textMuted, marginTop: 1 },

  cscFoodName: { fontSize: 16, fontWeight: "800", color: C.black, letterSpacing: -0.3 },

  cscMacroRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chatMacro: {
    backgroundColor: C.surfaceSoft,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: "center",
    minWidth: 56,
  },
  chatMacroAccent: { backgroundColor: "#EBF2FF" },
  chatMacroVal: { fontSize: 15, fontWeight: "800", color: C.black },
  chatMacroValAccent: { color: C.blueIcon },
  chatMacroUnit: { fontSize: 10, fontWeight: "600", color: C.textMuted },
  chatMacroLabel: { fontSize: 9, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", marginTop: 1 },

  cscBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  cscBadgeHigh: { backgroundColor: "#FEF2F2" },
  cscBadgeMid: { backgroundColor: "#FFFBEB" },
  cscBadgeLow: { backgroundColor: C.okBg },
  cscBadgeText: { fontSize: 12, fontWeight: "700" },

  cscTranscript: { fontSize: 13, fontWeight: "500", color: C.textSec, fontStyle: "italic", lineHeight: 19 },

  cscFindings: { gap: 4 },
  cscFindingItem: { fontSize: 13, fontWeight: "500", color: C.textSec, lineHeight: 19 },

  cscRec: { fontSize: 14, fontWeight: "500", color: C.textSec, lineHeight: 21 },
  cscActionRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  cscActionArrow: { fontSize: 14, fontWeight: "800", color: C.ok, marginTop: 1 },
  cscActionText: { flex: 1, fontSize: 13, fontWeight: "600", color: C.black, lineHeight: 19 },

  // Food title (in modal result)
  foodTitle: { fontSize: 18, fontWeight: "800", color: C.black, letterSpacing: -0.3 },

  // Transcript
  transcriptBox: { backgroundColor: C.surfaceSoft, borderRadius: 14, padding: 14 },
  transcriptLabel: { fontSize: 11, fontWeight: "800", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  transcriptText: { fontSize: 14, fontWeight: "500", color: C.textSec, lineHeight: 21 },
});
