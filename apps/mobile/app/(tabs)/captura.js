import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Camera, Mic, Paperclip, Send } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { processCapture } from '../../src/services/captureService';
import { ensurePatientSession } from '../../src/services/patientSessionService';
import {
  cancelMicrophoneRecording,
  startMicrophoneRecording,
  stopMicrophoneRecording,
} from '../../src/services/audioRecordingService';

const DS = {
  bgPrimary: '#F5EFE8',
  surface: '#FFFFFF',
  black: '#0A0A0A',
  stone200: '#e7e5e4',
  stone300: '#d6d3d1',
  stone400: '#a8a29e',
  stone500: '#78716c',
  stone700: '#44403c',
  stone900: '#1c1917',
  rose50: '#fff1f2',
  rose100: '#ffe4e6',
  rose600: '#e11d48',
  emerald600: '#059669',
};

const CHIPS = [
  { icon: '💉', label: 'Glucosa', text: 'Mi glucosa fue ' },
  { icon: '🍽', label: 'Comida', text: 'Acabo de comer ' },
  { icon: '💊', label: 'Medicación', text: 'Ya tomé mi ' },
  { icon: '😟', label: 'Síntoma', text: 'Me siento ' },
  { icon: '🏃', label: 'Actividad', text: 'Hice ejercicio: ' },
];

export default function PantallaCaptura() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [result, setResult] = useState(null);
  const [voiceMode, setVoiceMode] = useState(params.mode === 'voice');
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recordingRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const autoStartHandledRef = useRef(false);
  const autoFileHandledRef = useRef(false);

  useEffect(() => {
    if (params.mode === 'voice') {
      setVoiceMode(true);
    }
  }, [params.mode]);

  useEffect(() => {
    if (params.mode !== 'voice' || params.autostart !== '1' || autoStartHandledRef.current) {
      return;
    }
    autoStartHandledRef.current = true;
    void handleVoicePress();
  }, [params.autostart, params.mode]);

  // Auto-process files passed via router params (from HomeScreen shortcuts)
  useEffect(() => {
    if (autoFileHandledRef.current) return;
    if (params.imageUri) {
      autoFileHandledRef.current = true;
      setVoiceMode(false);
      void runCapture({ type: 'meal_photo', imageUri: params.imageUri });
    } else if (params.docUri) {
      autoFileHandledRef.current = true;
      setVoiceMode(false);
      void runCapture({ type: 'document', documentUri: params.docUri, documentMime: params.docMime ?? 'application/pdf' });
    }
  }, [params.imageUri, params.docUri]);

  useEffect(() => {
    return () => {
      clearRecordingTimer();

      if (recordingRef.current) {
        void cancelMicrophoneRecording(recordingRef.current);
        recordingRef.current = null;
      }
    };
  }, []);

  const clearRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const showMicrophoneError = (error) => {
    if (error?.code === 'MICROPHONE_PERMISSION_DENIED') {
      Alert.alert(
        'Permiso necesario',
        error.canAskAgain === false
          ? 'El micrófono está bloqueado. Actívalo desde la configuración del teléfono.'
          : 'Necesitamos acceso al micrófono para grabar.'
      );
      return;
    }

    Alert.alert(
      'No se pudo grabar',
      'Ocurrió un problema al acceder al micrófono. Intenta de nuevo.'
    );
  };

  const startVoiceRecording = async () => {
    if (isProcessing || recordingRef.current) {
      return;
    }

    setResult(null);
    setVoiceMode(true);

    try {
      const recording = await startMicrophoneRecording();
      recordingRef.current = recording;
      setIsRecording(true);
      setRecSeconds(0);
      clearRecordingTimer();
      recordingTimerRef.current = setInterval(() => setRecSeconds((current) => current + 1), 1000);
    } catch (error) {
      console.error('Voice recording start failed:', error);
      setIsRecording(false);
      showMicrophoneError(error);
    }
  };

  const stopVoiceRecording = async () => {
    const recording = recordingRef.current;
    if (!recording) {
      return;
    }

    clearRecordingTimer();
    recordingRef.current = null;
    setIsRecording(false);
    setProcessingStep('Preparando nota de voz...');

    try {
      const { uri, mimeType } = await stopMicrophoneRecording(recording);

      if (!uri) {
        throw new Error('No se generó ningún archivo de audio.');
      }

      await runCapture({
        type: 'audio',
        audioUri: uri,
        audioMime: mimeType,
      });
      setVoiceMode(false);
      setRecSeconds(0);
    } catch (error) {
      console.error('Voice recording stop failed:', error);
      setVoiceMode(true);
      setRecSeconds(0);
      Alert.alert(
        'No se pudo procesar',
        'Ocurrió un problema al finalizar la grabación. Intenta otra vez.'
      );
    }
  };

  const cancelVoiceFlow = async () => {
    clearRecordingTimer();
    setIsRecording(false);
    setRecSeconds(0);

    if (recordingRef.current) {
      const recording = recordingRef.current;
      recordingRef.current = null;
      await cancelMicrophoneRecording(recording);
    }

    setVoiceMode(false);
  };

  const handleVoicePress = async () => {
    if (isRecording) {
      await stopVoiceRecording();
      return;
    }

    await startVoiceRecording();
  };

  const formatRecordingTime = (seconds) =>
    `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60)
      .toString()
      .padStart(2, '0')}`;

  // ── Text processing ────────────────────────────────────────────────────────
  const handleProcess = async () => {
    if (!text.trim()) return;
    setVoiceMode(false);
    await runCapture({ type: 'text', text: text.trim() });
  };

  // ── Camera / Meal Photo ────────────────────────────────────────────────────
  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu cámara para fotografiar comidas.');
      return;
    }

    const picked = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!picked.canceled && picked.assets?.[0]?.uri) {
      setVoiceMode(false);
      setResult(null);
      await runCapture({ type: 'meal_photo', imageUri: picked.assets[0].uri });
    }
  };

  // ── Document upload ────────────────────────────────────────────────────────
  const handleDocument = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      copyToCacheDirectory: true,
    });

    if (!picked.canceled && picked.assets?.[0]) {
      const asset = picked.assets[0];
      setVoiceMode(false);
      setResult(null);
      await runCapture({
        type: 'document',
        documentUri: asset.uri,
        documentMime: asset.mimeType ?? 'application/pdf',
      });
    }
  };

  // ── Core pipeline runner ───────────────────────────────────────────────────
  const runCapture = async (params) => {
    setIsProcessing(true);
    setResult(null);

    try {
      setProcessingStep('Conectando tu perfil...');
      const { patientId } = await ensurePatientSession();

      setProcessingStep('Procesando con Gemini...');
      const output = await processCapture({
        ...params,
        patientId,
      });

      setResult(output);
    } catch (err) {
      console.error('Capture failed:', err);
      Alert.alert(
        'Error al procesar',
        'No se pudo procesar tu captura. Por favor intenta de nuevo.\n\n' + err.message,
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleChip = (chip) => {
    setText(chip.text);
  };

  const canProcess = text.trim().length > 0 && !isProcessing;

  // ── Guidance card ──────────────────────────────────────────────────────────
  const GuidanceCard = ({ result }) => {
    if (!result) return null;
    const { guidance, nutritionData } = result;

    return (
      <View style={s.guidanceCard}>
        <Text style={s.guidanceTitle}>
          {result.contentKind === 'meal_photo' ? '🍽 Análisis nutricional' :
           result.contentKind === 'glucose_note' ? '💉 Evaluación de glucosa' :
           result.contentKind?.startsWith('lab') ? '🔬 Resumen clínico' :
           '✓ Registrado'}
        </Text>

        {nutritionData?.totals && (
          <View style={s.macroRow}>
            <MacroPill label="Cal" value={Math.round(nutritionData.totals.calories)} unit="kcal" />
            <MacroPill label="Carbs" value={Math.round(nutritionData.totals.carbs_g)} unit="g" />
            <MacroPill label="Prot" value={Math.round(nutritionData.totals.protein_g)} unit="g" />
            <MacroPill label="Grasa" value={Math.round(nutritionData.totals.fat_g)} unit="g" />
          </View>
        )}

        {guidance?.spike_risk && (
          <View style={[s.riskBadge, { backgroundColor: guidance.spike_risk === 'alto' ? DS.rose100 : '#f0fdf4' }]}>
            <Text style={[s.riskText, { color: guidance.spike_risk === 'alto' ? DS.rose600 : DS.emerald600 }]}>
              Riesgo de pico: {guidance.spike_risk}
            </Text>
          </View>
        )}

        {guidance?.recommendation && (
          <Text style={s.guidanceRec}>{guidance.recommendation}</Text>
        )}

        {guidance?.action && (
          <View style={s.actionRow}>
            <Text style={s.actionArrow}>→</Text>
            <Text style={s.actionText}>{guidance.action}</Text>
          </View>
        )}

        {result.transcript ? (
          <View style={s.transcriptBox}>
            <Text style={s.transcriptLabel}>Transcripción</Text>
            <Text style={s.transcriptText}>{result.transcript}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={s.doneBtn}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Text style={s.doneBtnText}>Listo</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={async () => {
              await cancelVoiceFlow();
              router.back();
            }}
            style={s.closeBtn}
            activeOpacity={0.8}
          >
            <X size={20} color={DS.stone500} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>¿Qué pasó?</Text>
          <View style={s.headerSpacer} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Show result card if we have one, else show input */}
          {result ? (
            <GuidanceCard result={result} />
          ) : voiceMode ? (
            <View style={s.voiceCard}>
              <View style={s.voiceOrb}>
                <Mic size={34} color={DS.rose600} />
              </View>

              <Text style={s.voiceTitle}>
                {isRecording ? formatRecordingTime(recSeconds) : 'Nota de voz clínica'}
              </Text>
              <Text style={s.voiceSubtitle}>
                {isRecording
                  ? 'Grabando ahora. Pulsa detener para transcribir y analizar.'
                  : 'Usa tu micrófono para guardar una consulta, síntoma o cambio clínico.'}
              </Text>

              {isProcessing ? (
                <View style={s.processingRow}>
                  <ActivityIndicator color={DS.rose600} size="small" />
                  <Text style={s.processingText}>{processingStep || 'Procesando...'}</Text>
                </View>
              ) : null}

              <View style={s.voiceActions}>
                <TouchableOpacity
                  style={[s.voicePrimaryBtn, isProcessing && s.voicePrimaryBtnDisabled]}
                  activeOpacity={0.85}
                  onPress={handleVoicePress}
                  disabled={isProcessing}
                >
                  <Text style={s.voicePrimaryBtnText}>
                    {isRecording ? 'Detener grabación' : 'Empezar a grabar'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.voiceSecondaryBtn}
                  activeOpacity={0.8}
                  onPress={cancelVoiceFlow}
                  disabled={isProcessing}
                >
                  <Text style={s.voiceSecondaryBtnText}>Volver al texto</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Escríbelo, fotografíalo o grábalo."
                placeholderTextColor={DS.stone300}
                style={s.textInput}
                multiline
                autoFocus={!isProcessing}
                textAlignVertical="top"
                editable={!isProcessing}
              />

              {isProcessing && (
                <View style={s.processingRow}>
                  <ActivityIndicator color={DS.rose600} size="small" />
                  <Text style={s.processingText}>{processingStep || 'Procesando...'}</Text>
                </View>
              )}

              {/* Quick Context Chips */}
              <View style={s.chipsSection}>
                <Text style={s.chipsLabel}>Atajos rápidos</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.chipsRow}
                >
                  {CHIPS.map((chip) => (
                    <TouchableOpacity
                      key={chip.label}
                      onPress={() => handleChip(chip)}
                      style={s.chip}
                      activeOpacity={0.78}
                      disabled={isProcessing}
                    >
                      <Text style={s.chipEmoji}>{chip.icon}</Text>
                      <Text style={s.chipLabel}>{chip.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          )}
        </ScrollView>

        {/* Bottom Action Bar */}
        {!result && !voiceMode && (
          <View style={s.bottomBar}>
            <View style={s.actionRow}>
              <View style={s.mediaRow}>
                <TouchableOpacity
                  style={s.mediaBtn}
                  activeOpacity={0.78}
                  onPress={handleCamera}
                  disabled={isProcessing}
                >
                  <Camera size={24} color={isProcessing ? DS.stone300 : DS.stone400} />
                  <Text style={s.mediaBtnLabel}>Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.mediaBtn}
                  activeOpacity={0.78}
                  onPress={handleVoicePress}
                  disabled={isProcessing}
                >
                  <Mic size={24} color={isProcessing ? DS.stone300 : DS.stone400} />
                  <Text style={s.mediaBtnLabel}>Grabar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.mediaBtn}
                  activeOpacity={0.78}
                  onPress={handleDocument}
                  disabled={isProcessing}
                >
                  <Paperclip size={24} color={isProcessing ? DS.stone300 : DS.stone400} />
                  <Text style={s.mediaBtnLabel}>Subir</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleProcess}
                disabled={!canProcess}
                style={[s.processBtn, !canProcess && s.processBtnDisabled]}
                activeOpacity={0.85}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={s.processBtnText}>Procesar</Text>
                    <Send size={15} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MacroPill({ label, value, unit }) {
  return (
    <View style={s.macroPill}>
      <Text style={s.macroPillValue}>{value}</Text>
      <Text style={s.macroPillUnit}>{unit}</Text>
      <Text style={s.macroPillLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DS.bgPrimary },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DS.stone200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: DS.stone900 },
  headerSpacer: { width: 40 },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },

  textInput: {
    fontSize: 24,
    fontWeight: '500',
    color: DS.stone900,
    lineHeight: 34,
    minHeight: 180,
    flex: 1,
  },

  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  processingText: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.stone500,
  },

  voiceCard: {
    backgroundColor: DS.surface,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  voiceOrb: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: DS.rose50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: DS.stone900,
    letterSpacing: -0.4,
  },
  voiceSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: DS.stone700,
    lineHeight: 22,
    textAlign: 'center',
  },
  voiceActions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  voicePrimaryBtn: {
    backgroundColor: DS.rose600,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  voicePrimaryBtnDisabled: {
    opacity: 0.75,
  },
  voicePrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  voiceSecondaryBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DS.stone200,
  },
  voiceSecondaryBtnText: {
    color: DS.stone700,
    fontSize: 14,
    fontWeight: '700',
  },

  chipsSection: { gap: 10, marginTop: 28 },
  chipsLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: DS.stone400,
    paddingLeft: 2,
  },
  chipsRow: { gap: 8, paddingBottom: 4, paddingRight: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.stone200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chipEmoji: { fontSize: 16 },
  chipLabel: { fontSize: 14, fontWeight: '600', color: DS.stone700 },

  // Guidance card
  guidanceCard: {
    backgroundColor: DS.surface,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  guidanceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DS.stone900,
    letterSpacing: -0.3,
  },
  macroRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  macroPill: {
    backgroundColor: DS.bgPrimary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 70,
  },
  macroPillValue: { fontSize: 18, fontWeight: '800', color: DS.stone900 },
  macroPillUnit: { fontSize: 11, fontWeight: '600', color: DS.stone500 },
  macroPillLabel: { fontSize: 10, fontWeight: '700', color: DS.stone400, marginTop: 2, textTransform: 'uppercase' },

  riskBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  riskText: { fontSize: 13, fontWeight: '700' },

  guidanceRec: {
    fontSize: 16,
    fontWeight: '500',
    color: DS.stone700,
    lineHeight: 24,
  },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  actionArrow: { fontSize: 16, fontWeight: '700', color: DS.rose600, marginTop: 1 },
  actionText: { flex: 1, fontSize: 15, fontWeight: '600', color: DS.stone900, lineHeight: 22 },
  transcriptBox: {
    backgroundColor: DS.bgPrimary,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  transcriptLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: DS.stone500,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transcriptText: {
    fontSize: 14,
    fontWeight: '500',
    color: DS.stone700,
    lineHeight: 21,
  },

  doneBtn: {
    backgroundColor: DS.black,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Bottom bar
  bottomBar: {
    backgroundColor: DS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: DS.stone200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  mediaRow: { flexDirection: 'row', gap: 24 },
  mediaBtn: { alignItems: 'center', gap: 4 },
  mediaBtnLabel: { fontSize: 10, fontWeight: '700', color: DS.stone400 },

  processBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: DS.rose600,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 999,
    shadowColor: DS.rose600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  processBtnDisabled: {
    backgroundColor: DS.stone300,
    shadowOpacity: 0,
    elevation: 0,
  },
  processBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
