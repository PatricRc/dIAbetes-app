import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

function useSafeTabBarHeight() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useBottomTabBarHeight();
  } catch {
    return Platform.OS === 'web' ? 0 : 90;
  }
}
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  Clock,
  ChevronRight,
  Camera,
  Mic,
  Paperclip,
  Pencil,
  Plus,
  Droplet,
  Check,
  X,
  Activity,
  Sparkles,
} from "lucide-react-native";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Circle,
} from "react-native-svg";

const COLORS = {
  bgPrimary: "#F5EFE8",
  bgSecondary: "#FFF9F4",
  surfacePrimary: "#FFFFFF",
  surfaceSoft: "#F7F2EC",
  surfaceMuted: "#EEE8E1",
  lineSoft: "#E5DDD3",
  lineStrong: "#D9CDBF",
  textPrimary: "#111111",
  textSecondary: "#4A4A4A",
  textMuted: "#7B7B7B",
  textInverse: "#FFFFFF",
  blackAnchor: "#0A0A0A",
  yellowSoft: "#F4DD75",
  pinkSoft: "#EEC0D8",
  pinkBright: "#F68AC8",
  orangeSoft: "#F6C29B",
  purpleSoft: "#CDB8F4",
  roseDeep: "#C95675",
  success: "#88D66C",
  successSoft: "#EDFAE7",
  warning: "#F7D154",
  warningSoft: "#FFF5CF",
  error: "#F26D6D",
  errorSoft: "#FFE6E2",
  info: "#8ECDF3",
  infoSoft: "#E8F5FF",
};

const FEELINGS = [
  { id: "cansancio", icon: "😴", label: "Cansancio" },
  { id: "vision", icon: "👁️", label: "Visión" },
  { id: "piemanos", icon: "🦶", label: "Pie/manos" },
  { id: "sed", icon: "💧", label: "Sed" },
  { id: "mareo", icon: "🤢", label: "Mareo" },
];

const GLUCOSE_KEYS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "esc",
  "0",
  "delete",
];

function formatTime(date = new Date()) {
  return date.toLocaleTimeString("es-PE", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isValidGlucoseValue(value) {
  return Number.isFinite(value) && value >= 40 && value <= 450;
}

function getGlucoseStatus(value) {
  if (!Number.isFinite(value)) {
    return {
      label: "Sin dato",
      color: COLORS.textMuted,
      pillBg: COLORS.surfaceMuted,
      helper: "Ingresa tu glucosa para registrarla.",
    };
  }

  if (value < 70) {
    return {
      label: "Baja",
      color: "#2A72B5",
      pillBg: COLORS.infoSoft,
      helper: "Está por debajo del rango habitual. Regístralo y revísalo.",
    };
  }

  if (value <= 140) {
    return {
      label: "Estable",
      color: "#12B981",
      pillBg: "#E8FFF4",
      helper: "Está en buen rango para un check-in rápido.",
    };
  }

  if (value <= 180) {
    return {
      label: "Elevada",
      color: "#B7791F",
      pillBg: COLORS.warningSoft,
      helper: "Está por encima del objetivo. Conviene dejarlo registrado.",
    };
  }

  return {
    label: "Alta",
    color: "#D64545",
    pillBg: COLORS.errorSoft,
    helper: "Está alta. Regístrala para que el seguimiento la considere.",
  };
}

function getFeedbackStyles(tone) {
  switch (tone) {
    case "success":
      return {
        backgroundColor: COLORS.successSoft,
        borderColor: "#CFEEC3",
        textColor: "#2C6A1F",
      };
    case "error":
      return {
        backgroundColor: COLORS.errorSoft,
        borderColor: "#F7C9BF",
        textColor: "#A63D33",
      };
    default:
      return {
        backgroundColor: COLORS.infoSoft,
        borderColor: "#CFE7F8",
        textColor: "#235A7B",
      };
  }
}

function GlucoseModal({
  visible,
  draft,
  onClose,
  onKeyPress,
  onSave,
}) {
  const numericValue = Number(draft);
  const canSave = isValidGlucoseValue(numericValue);
  const status = getGlucoseStatus(numericValue);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.glucoseModalCard}>
          <Text style={styles.glucoseModalEyebrow}>REGISTRO RÁPIDO</Text>

          <View style={styles.glucoseDisplayRow}>
            <Text style={styles.glucoseDisplayValue}>{draft || "--"}</Text>
            <Text style={styles.glucoseDisplayUnit}>mg/dL</Text>
          </View>

          <View
            style={[
              styles.glucoseStatusPill,
              { backgroundColor: status.pillBg },
            ]}
          >
            <Activity color={status.color} size={16} />
            <Text style={[styles.glucoseStatusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>

          <Text style={styles.glucoseHelperText}>
            {canSave
              ? status.helper
              : "Ingresa un valor válido entre 40 y 450 mg/dL."}
          </Text>

          <View style={styles.glucoseKeypad}>
            {GLUCOSE_KEYS.map((key) => (
              <Pressable
                key={key}
                style={({ pressed }) => [
                  styles.glucoseKey,
                  key === "esc" && styles.glucoseKeyMuted,
                  key === "delete" && styles.glucoseKeyMuted,
                  pressed && styles.glucoseKeyPressed,
                ]}
                onPress={() => onKeyPress(key)}
              >
                {key === "delete" ? (
                  <X color={COLORS.textSecondary} size={20} />
                ) : (
                  <Text
                    style={[
                      styles.glucoseKeyText,
                      key === "esc" && styles.glucoseKeyTextSmall,
                    ]}
                  >
                    {key === "esc" ? "ESC" : key}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.saveGlucoseButton,
              !canSave && styles.saveGlucoseButtonDisabled,
              pressed && canSave && { opacity: 0.92 },
            ]}
            disabled={!canSave}
            onPress={onSave}
          >
            <Check color={COLORS.textInverse} size={18} strokeWidth={3} />
            <Text style={styles.saveGlucoseButtonText}>Guardar Glucosa</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ComposerModal({
  visible,
  inputText,
  setInputText,
  onClose,
  onSave,
  onShortcut,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlayBottom}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <View style={styles.composerModalCard}>
          <View style={styles.composerModalHandle} />
          <View style={styles.composerHeader}>
            <Text style={styles.composerTitle}>¿Qué pasó hoy?</Text>
            <Text style={styles.composerSubtitle}>
              Escríbelo aquí para que no lo tape el teclado y quede guardado.
            </Text>
          </View>

          <TextInput
            style={styles.composerModalInput}
            placeholder="Describe tu comida, glucosa, síntomas o cualquier cambio…"
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            autoFocus
            textAlignVertical="top"
          />

          <View style={styles.composerFooter}>
            <View style={styles.floatingIcons}>
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.pressedSoft,
                ]}
                onPress={() => onShortcut("camera")}
              >
                <Camera color={COLORS.textSecondary} size={18} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.pressedSoft,
                ]}
                onPress={() => onShortcut("mic")}
              >
                <Mic color={COLORS.textSecondary} size={18} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.pressedSoft,
                ]}
                onPress={() => onShortcut("attachment")}
              >
                <Paperclip color={COLORS.textSecondary} size={18} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.pressedSoft,
                ]}
                onPress={() => onShortcut("pencil")}
              >
                <Pencil color={COLORS.textSecondary} size={18} />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.saveEntryButton,
                !inputText.trim() && styles.saveEntryButtonDisabled,
                pressed && inputText.trim() && { opacity: 0.92 },
              ]}
              onPress={onSave}
            >
              <Text style={styles.saveEntryButtonText}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tabBarHeight = useSafeTabBarHeight();
  const scrollRef = useRef(null);
  const otherInputRef = useRef(null);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const medButtonScale = useRef(new Animated.Value(1)).current;
  const feedbackTimerRef = useRef(null);

  const [feedback, setFeedback] = useState(null);
  const [inputText, setInputText] = useState("");
  const [lastJournalEntry, setLastJournalEntry] = useState(null);
  const [metforminaTomada, setMetforminaTomada] = useState(false);
  const [medicationLoggedAt, setMedicationLoggedAt] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [showCustomSymptom, setShowCustomSymptom] = useState(false);
  const [customSymptom, setCustomSymptom] = useState("");
  const [symptomError, setSymptomError] = useState("");
  const [symptomLog, setSymptomLog] = useState(null);
  const [glucoseModalVisible, setGlucoseModalVisible] = useState(false);
  const [composerModalVisible, setComposerModalVisible] = useState(false);
  const [glucoseValue, setGlucoseValue] = useState(124);
  const [glucoseDraft, setGlucoseDraft] = useState("124");

  const glucoseStatus = getGlucoseStatus(glucoseValue);
  const canSaveSymptoms =
    selectedSymptoms.length > 0 ||
    (showCustomSymptom && customSymptom.trim().length > 0);
  const composerBottom = Math.max(tabBarHeight - insets.bottom + 42, 48);
  const feedbackStyles = feedback ? getFeedbackStyles(feedback.tone) : null;

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  function showFeedback(message, tone = "info") {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    setFeedback({ message, tone });
    feedbackOpacity.setValue(0);

    Animated.timing(feedbackOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    feedbackTimerRef.current = setTimeout(() => {
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }).start(({ finished }) => {
        if (finished) {
          setFeedback(null);
        }
      });
    }, 2600);
  }

  function handleOpenGlucoseModal() {
    setGlucoseDraft(String(glucoseValue));
    setGlucoseModalVisible(true);
  }

  function handleGlucoseKeyPress(key) {
    if (key === "esc") {
      setGlucoseModalVisible(false);
      return;
    }

    if (key === "delete") {
      setGlucoseDraft((current) => current.slice(0, -1));
      return;
    }

    setGlucoseDraft((current) => {
      if (current.length >= 3) {
        return current;
      }

      if (current === "0") {
        return key;
      }

      return `${current}${key}`;
    });
  }

  function handleSaveGlucose() {
    const nextValue = Number(glucoseDraft);

    if (!isValidGlucoseValue(nextValue)) {
      showFeedback("Ingresa una glucosa válida entre 40 y 450 mg/dL.", "error");
      return;
    }

    const nextStatus = getGlucoseStatus(nextValue);

    setGlucoseValue(nextValue);
    setGlucoseModalVisible(false);
    showFeedback(
      `Glucosa guardada: ${nextValue} mg/dL (${nextStatus.label.toLowerCase()}).`,
      "success"
    );
  }

  function handleMedicationPress() {
    const nextValue = !metforminaTomada;
    setMetforminaTomada(nextValue);

    Animated.sequence([
      Animated.spring(medButtonScale, {
        toValue: 0.96,
        friction: 5,
        tension: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(medButtonScale, {
        toValue: 1.04,
        friction: 5,
        tension: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(medButtonScale, {
        toValue: 1,
        friction: 5,
        tension: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    if (nextValue) {
      const loggedAt = formatTime();
      setMedicationLoggedAt(loggedAt);
      showFeedback("Metformina marcada como tomada.", "success");
      return;
    }

    setMedicationLoggedAt("");
    showFeedback("Marcado de medicación revertido.", "info");
  }

  function handleToggleSymptom(id) {
    setSymptomError("");

    if (id === "other") {
      const nextValue = !showCustomSymptom;
      setShowCustomSymptom(nextValue);

      if (!nextValue) {
        setCustomSymptom("");
        return;
      }

      setTimeout(() => {
        otherInputRef.current?.focus();
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 120);
      return;
    }

    setSelectedSymptoms((current) =>
      current.includes(id)
        ? current.filter((symptomId) => symptomId !== id)
        : [...current, id]
    );
  }

  function handleSaveSymptoms() {
    const selectedLabels = FEELINGS.filter((item) =>
      selectedSymptoms.includes(item.id)
    ).map((item) => item.label);

    if (showCustomSymptom && !customSymptom.trim()) {
      setSymptomError("Escribe el síntoma en “Otro” para poder guardarlo.");
      showFeedback("Falta escribir el síntoma personalizado.", "error");
      return;
    }

    const nextSymptoms = showCustomSymptom
      ? [...selectedLabels, customSymptom.trim()]
      : selectedLabels;

    if (!nextSymptoms.length) {
      setSymptomError("Selecciona al menos un síntoma para registrarlo.");
      showFeedback("Selecciona al menos un síntoma.", "error");
      return;
    }

    setSymptomLog({
      labels: nextSymptoms,
      loggedAt: formatTime(),
    });
    setSelectedSymptoms([]);
    setShowCustomSymptom(false);
    setCustomSymptom("");
    setSymptomError("");
    Keyboard.dismiss();
    showFeedback("Síntomas registrados correctamente.", "success");
  }

  async function handleCaptureShortcut(type) {
    if (type === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showFeedback("Permiso de cámara requerido.", "error");
        return;
      }
      const picked = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.85 });
      if (!picked.canceled && picked.assets?.[0]?.uri) {
        router.push({ pathname: "/captura", params: { imageUri: picked.assets[0].uri } });
      }
      return;
    }

    if (type === "attachment") {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        copyToCacheDirectory: true,
      });
      if (!picked.canceled && picked.assets?.[0]) {
        const asset = picked.assets[0];
        router.push({
          pathname: "/captura",
          params: { docUri: asset.uri, docMime: asset.mimeType ?? "application/pdf", docName: asset.name ?? "documento" },
        });
      }
      return;
    }

    if (type === "mic") {
      router.push({ pathname: "/captura", params: { mode: "voice", autostart: "1" } });
      return;
    }

    // pencil — keep composer open, focus text input
  }

  function handleSaveJournalEntry() {
    const nextText = inputText.trim();

    if (!nextText) {
      showFeedback("Escribe algo para guardarlo en tu día.", "error");
      return;
    }

    setLastJournalEntry({
      text: nextText,
      loggedAt: formatTime(),
    });
    setInputText("");
    Keyboard.dismiss();
    showFeedback("Tu nota de hoy quedó guardada.", "success");
  }

  const symptomMetricCount = symptomLog ? symptomLog.labels.length : 2;
  const adherenceMetric = metforminaTomada ? "✓ Hoy" : "71%";
  const attentionMessage = symptomLog
    ? `Síntomas guardados hoy: ${symptomLog.labels.join(", ")}.`
    : metforminaTomada
      ? `Metformina registrada a las ${medicationLoggedAt}.`
      : `Tienes hormigueo registrado 2 veces esta semana.`;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {feedback && feedbackStyles ? (
            <Animated.View
              style={[
                styles.feedbackBanner,
                {
                  backgroundColor: feedbackStyles.backgroundColor,
                  borderColor: feedbackStyles.borderColor,
                  opacity: feedbackOpacity,
                },
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  { color: feedbackStyles.textColor },
                ]}
              >
                {feedback.message}
              </Text>
            </Animated.View>
          ) : null}

          <View style={styles.header}>
            <View style={styles.headerTextCol}>
              <Text style={styles.greetingTitle}>Hola, Patricio 👋</Text>
              <Text style={styles.dateSubtitle}>Sáb 21/03</Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.dropButton,
                  pressed && styles.pressedSoft,
                ]}
                onPress={handleOpenGlucoseModal}
              >
                <Droplet color={COLORS.error} size={20} />
              </Pressable>

              <Image
                source={{ uri: "https://i.pravatar.cc/100?img=11" }}
                style={styles.profilePic}
              />
            </View>
          </View>

          <Text style={styles.mainQuote}>
            "Tu control esta semana va mejorando."
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.attnCard,
              pressed && styles.pressedSoft,
            ]}
            onPress={() => router.push("/historial")}
          >
            <View style={styles.attnHeader}>
              <View style={styles.attnHeaderLeft}>
                <View
                  style={[
                    styles.attnDot,
                    { backgroundColor: glucoseStatus.color },
                  ]}
                />
                <Text style={styles.attnTitle}>Resumen de hoy</Text>
              </View>

              <ChevronRight color={COLORS.textSecondary} size={18} />
            </View>

            <View style={styles.attnMetrics}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>GLUCOSA</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricPrimary}>{glucoseValue}</Text>
                  <Text style={styles.metricUnit}> mg/dL</Text>
                </View>
                <Text style={[styles.metricSub, { color: glucoseStatus.color }]}>
                  {glucoseStatus.label}
                </Text>
              </View>

              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>SÍNTOMAS</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricAlert}>⚠️ x{symptomMetricCount}</Text>
                </View>
                <Text style={styles.metricSub}>
                  {symptomLog ? "Registrados" : "Pendientes"}
                </Text>
              </View>

              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>MEDS</Text>
                <View style={styles.metricValueRow}>
                  <Text
                    style={[
                      styles.metricGreen,
                      !metforminaTomada && { color: COLORS.success },
                    ]}
                  >
                    {adherenceMetric}
                  </Text>
                </View>
                <Text style={styles.metricSub}>
                  {metforminaTomada ? "Completada" : "Adherencia"}
                </Text>
              </View>
            </View>

            <View style={styles.attnInnerBox}>
              <Text style={styles.attnInnerText}>{attentionMessage}</Text>
            </View>
          </Pressable>

          <Animated.View style={{ transform: [{ scale: medButtonScale }] }}>
            <View style={styles.medsCard}>
              <View style={styles.medsCardTop}>
                <View style={styles.pillIconWrap}>
                  <Text
                    style={{
                      fontSize: 24,
                      transform: [{ rotate: "45deg" }],
                    }}
                  >
                    💊
                  </Text>
                </View>

                <View style={styles.medsInfoCol}>
                  <Text style={styles.medsTitle}>Toma tu metformina</Text>
                  <View style={styles.medsTimeRow}>
                    <Clock color={COLORS.textSecondary} size={14} />
                    <Text style={styles.medsTimeText}>
                      en los próximos 30 min
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.blackBtn,
                  metforminaTomada && styles.successBtn,
                  pressed && { opacity: 0.86 },
                ]}
                onPress={handleMedicationPress}
              >
                <Text
                  style={[
                    styles.blackBtnText,
                    metforminaTomada && styles.successBtnText,
                  ]}
                >
                  {metforminaTomada ? "Tomada ✓" : "Marcar como tomada"}
                </Text>
              </Pressable>

              {metforminaTomada ? (
                <View style={styles.medicationSuccessRow}>
                  <View style={styles.medicationSuccessBadge}>
                    <Check color="#1E7A34" size={14} strokeWidth={3} />
                    <Text style={styles.medicationSuccessText}>
                      Registrada a las {medicationLoggedAt}
                    </Text>
                  </View>

                  <Pressable onPress={handleMedicationPress}>
                    <Text style={styles.undoText}>Deshacer</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.medsHelperText}>
                  Marca la toma para actualizar tu adherencia de hoy.
                </Text>
              )}
            </View>
          </Animated.View>

          <View style={styles.symptomSection}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>¿Cómo te sientes ahora?</Text>
              <Text style={styles.sectionCaption}>
                Toca, valida y guarda el registro de síntomas.
              </Text>
            </View>

            <View style={styles.feelingsGrid}>
              {FEELINGS.map((item) => {
                const isSelected = selectedSymptoms.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.feelingPill,
                      isSelected && styles.feelingPillActive,
                      pressed && styles.pressedSoft,
                    ]}
                    onPress={() => handleToggleSymptom(item.id)}
                  >
                    <Text style={styles.feelingEmoji}>{item.icon}</Text>
                    <Text
                      style={[
                        styles.feelingLabel,
                        isSelected && styles.feelingLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                style={({ pressed }) => [
                  styles.feelingPill,
                  showCustomSymptom && styles.feelingPillActive,
                  pressed && styles.pressedSoft,
                ]}
                onPress={() => handleToggleSymptom("other")}
              >
                <Plus
                  color={
                    showCustomSymptom
                      ? COLORS.textInverse
                      : COLORS.textSecondary
                  }
                  size={16}
                />
                <Text
                  style={[
                    styles.feelingLabel,
                    showCustomSymptom && styles.feelingLabelActive,
                  ]}
                >
                  Otro +
                </Text>
              </Pressable>
            </View>

            {showCustomSymptom ? (
              <View style={styles.customSymptomWrap}>
                <Text style={styles.customSymptomLabel}>
                  Describe el síntoma adicional
                </Text>
                <TextInput
                  ref={otherInputRef}
                  style={styles.customSymptomInput}
                  placeholder="Ej. dolor de cabeza, náusea, hormigueo"
                  placeholderTextColor={COLORS.textMuted}
                  value={customSymptom}
                  onChangeText={(value) => {
                    setCustomSymptom(value);
                    if (symptomError) {
                      setSymptomError("");
                    }
                  }}
                  returnKeyType="done"
                  onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
                />
              </View>
            ) : null}

            {symptomError ? (
              <Text style={styles.errorText}>{symptomError}</Text>
            ) : (
              <Text style={styles.sectionHint}>
                {showCustomSymptom && !customSymptom.trim()
                  ? "Escribe el síntoma en “Otro +” para habilitar el guardado."
                  : "Selecciona uno o varios síntomas y guárdalos."}
              </Text>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.symptomSaveBtn,
                !canSaveSymptoms && styles.symptomSaveBtnDisabled,
                pressed && canSaveSymptoms && { opacity: 0.9 },
              ]}
              disabled={!canSaveSymptoms}
              onPress={handleSaveSymptoms}
            >
              <Text style={styles.symptomSaveBtnText}>Registrar síntomas</Text>
            </Pressable>

            {symptomLog ? (
              <View style={styles.symptomLogCard}>
                <View style={styles.symptomLogHeader}>
                  <Text style={styles.symptomLogTitle}>Último registro</Text>
                  <Text style={styles.symptomLogTime}>{symptomLog.loggedAt}</Text>
                </View>
                <Text style={styles.symptomLogBody}>
                  {symptomLog.labels.join(" • ")}
                </Text>
              </View>
            ) : null}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.insightCard,
              pressed && { opacity: 0.96 },
            ]}
            onPress={() => router.push("/asistente")}
          >
            <Svg style={StyleSheet.absoluteFill}>
              <Defs>
                <SvgLinearGradient
                  id="insightGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <Stop offset="0%" stopColor="#1C1917" />
                  <Stop offset="58%" stopColor={COLORS.roseDeep} />
                  <Stop offset="100%" stopColor={COLORS.orangeSoft} />
                </SvgLinearGradient>
              </Defs>

              <Rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                rx="32"
                fill="url(#insightGradient)"
              />
              <Circle cx="90%" cy="14%" r="52" fill="rgba(255,255,255,0.10)" />
              <Circle cx="16%" cy="88%" r="72" fill="rgba(255,255,255,0.08)" />
            </Svg>

            <View style={styles.insightContent}>
              <View style={styles.insightHeaderRow}>
                <View style={styles.insightBadge}>
                  <Sparkles color="#FFECD9" size={14} />
                  <Text style={styles.insightBadgeText}>INSIGHT IA</Text>
                </View>
                <ChevronRight color={COLORS.textInverse} size={18} />
              </View>

              <Text style={styles.insightBody}>
                Tu glucosa bajó 18 puntos frente a la semana pasada. La
                adherencia a medicación está ayudando y vale la pena mantenerla.
              </Text>

              <Text style={styles.insightFooter}>
                Ver explicación completa en tu asistente
              </Text>
            </View>
          </Pressable>

          {lastJournalEntry ? (
            <View style={styles.journalPreviewCard}>
              <View style={styles.journalPreviewHeader}>
                <Text style={styles.journalPreviewTitle}>Nota guardada hoy</Text>
                <Text style={styles.journalPreviewTime}>
                  {lastJournalEntry.loggedAt}
                </Text>
              </View>
              <Text style={styles.journalPreviewText}>
                {lastJournalEntry.text}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <Pressable
          style={({ pressed }) => [
            styles.fab,
            { bottom: composerBottom },
            pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] },
          ]}
          onPress={() => setComposerModalVisible(true)}
        >
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgLinearGradient id="fabGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={COLORS.pinkBright} />
                <Stop offset="50%" stopColor={COLORS.orangeSoft} />
                <Stop offset="100%" stopColor={COLORS.purpleSoft} />
              </SvgLinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx="30" fill="url(#fabGradient)" />
          </Svg>
          <Pencil color={COLORS.textInverse} size={24} />
        </Pressable>

        <GlucoseModal
          visible={glucoseModalVisible}
          draft={glucoseDraft}
          onClose={() => setGlucoseModalVisible(false)}
          onKeyPress={handleGlucoseKeyPress}
          onSave={handleSaveGlucose}
        />

        <ComposerModal
          visible={composerModalVisible}
          inputText={inputText}
          setInputText={setInputText}
          onClose={() => setComposerModalVisible(false)}
          onSave={() => {
            handleSaveJournalEntry();
            setComposerModalVisible(false);
          }}
          onShortcut={(type) => {
            handleCaptureShortcut(type);
            setComposerModalVisible(false);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 24,
  },
  feedbackBanner: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextCol: {
    gap: 4,
  },
  greetingTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.blackAnchor,
    letterSpacing: -0.8,
  },
  dateSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dropButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.pinkSoft,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfacePrimary,
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  pressedSoft: {
    opacity: 0.75,
  },
  mainQuote: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  attnCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 32,
    padding: 24,
    gap: 20,
    borderWidth: 1,
    borderColor: "#FFF3E0",
  },
  attnHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  attnHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  attnDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  attnTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  attnMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricBlock: {
    gap: 4,
    maxWidth: "31%",
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.roseDeep,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  metricPrimary: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  metricAlert: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  metricGreen: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.success,
  },
  metricSub: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  attnInnerBox: {
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: 16,
    padding: 16,
  },
  attnInnerText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  medsCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: 32,
    padding: 24,
    gap: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  medsCardTop: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  pillIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.pinkSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  medsInfoCol: {
    flex: 1,
    gap: 4,
  },
  medsTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  medsTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  medsTimeText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  blackBtn: {
    backgroundColor: COLORS.blackAnchor,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  blackBtnText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: "700",
  },
  successBtn: {
    backgroundColor: COLORS.success,
  },
  successBtnText: {
    color: COLORS.blackAnchor,
  },
  medicationSuccessRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  medicationSuccessBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.successSoft,
    flexShrink: 1,
  },
  medicationSuccessText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E7A34",
  },
  undoText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  medsHelperText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  symptomSection: {
    gap: 14,
  },
  sectionHeaderText: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  sectionCaption: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  feelingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  feelingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfacePrimary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  feelingPillActive: {
    backgroundColor: COLORS.blackAnchor,
    borderColor: COLORS.blackAnchor,
  },
  feelingEmoji: {
    fontSize: 16,
  },
  feelingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  feelingLabelActive: {
    color: COLORS.textInverse,
  },
  customSymptomWrap: {
    gap: 8,
    padding: 16,
    borderRadius: 22,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
  },
  customSymptomLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  customSymptomInput: {
    minHeight: 48,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B23A2F",
  },
  symptomSaveBtn: {
    backgroundColor: COLORS.blackAnchor,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  symptomSaveBtnDisabled: {
    backgroundColor: "#B8B3AD",
  },
  symptomSaveBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textInverse,
  },
  symptomLogCard: {
    borderRadius: 22,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    padding: 16,
    gap: 8,
  },
  symptomLogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  symptomLogTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  symptomLogTime: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  symptomLogBody: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  insightCard: {
    borderRadius: 32,
    overflow: "hidden",
    minHeight: 180,
    backgroundColor: COLORS.roseDeep,
    marginBottom: 8,
  },
  insightContent: {
    padding: 28,
    paddingTop: 32,
    gap: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  insightHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  insightBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  insightBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1.2,
  },
  insightBody: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.textInverse,
    lineHeight: 28,
    marginTop: 6,
  },
  insightFooter: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    marginTop: 10,
  },
  journalPreviewCard: {
    borderRadius: 24,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    padding: 18,
    gap: 8,
  },
  journalPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  journalPreviewTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  journalPreviewTime: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  journalPreviewText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 12,
  },
  modalOverlayBottom: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 17, 17, 0.35)",
  },
  composerModalCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 24,
  },
  composerModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.lineStrong,
    alignSelf: "center",
    marginBottom: 8,
  },
  composerHeader: {
    gap: 4,
  },
  composerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  composerSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  composerModalInput: {
    minHeight: 120,
    maxHeight: 200,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    lineHeight: 24,
    padding: 0,
  },
  composerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  floatingIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
  },
  saveEntryButton: {
    backgroundColor: COLORS.blackAnchor,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  saveEntryButtonDisabled: {
    backgroundColor: "#B8B3AD",
  },
  saveEntryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textInverse,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    backgroundColor: "rgba(17, 17, 17, 0.35)",
  },
  glucoseModalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 36,
    backgroundColor: COLORS.surfacePrimary,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
    gap: 16,
  },
  glucoseModalEyebrow: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B0A59B",
    letterSpacing: 1.5,
  },
  glucoseDisplayRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  glucoseDisplayValue: {
    fontSize: 72,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: -2,
    lineHeight: 78,
  },
  glucoseDisplayUnit: {
    fontSize: 22,
    fontWeight: "800",
    color: "#A7A09A",
    marginBottom: 12,
  },
  glucoseStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  glucoseStatusText: {
    fontSize: 16,
    fontWeight: "800",
  },
  glucoseHelperText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginHorizontal: 8,
  },
  glucoseKeypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    width: "100%",
    marginTop: 8,
  },
  glucoseKey: {
    width: "30.5%",
    height: 72,
    borderRadius: 28,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: "#EFE9E2",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  glucoseKeyMuted: {
    backgroundColor: "#E7E2E0",
  },
  glucoseKeyPressed: {
    opacity: 0.78,
  },
  glucoseKeyText: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  glucoseKeyTextSmall: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  saveGlucoseButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.blackAnchor,
    borderRadius: 20,
    paddingVertical: 18,
    marginTop: 8,
  },
  saveGlucoseButtonDisabled: {
    backgroundColor: "#B8B3AD",
  },
  saveGlucoseButtonText: {
    color: COLORS.textInverse,
    fontSize: 18,
    fontWeight: "800",
  },
});
