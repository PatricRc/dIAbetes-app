import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

function useSafeTabBarHeight() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useBottomTabBarHeight();
  } catch {
    return Platform.OS === 'web' ? 0 : 90;
  }
}
import {
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Check,
  Star,
  X,
  FileText,
  Activity,
  ShieldCheck,
  ChevronRight,
  Stethoscope,
  BrainCircuit,
  Zap,
} from "lucide-react-native";
import Svg, { LinearGradient as SvgLinearGradient, Rect, Defs, Stop, Circle } from "react-native-svg";

const { width } = Dimensions.get('window');

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
  roseDeep: "#C95675",
  success: "#88D66C",
  successSoft: "#EDFAE7",
  warning: "#F7D154",
  warningSoft: "#FFF5CF",
  error: "#F26D6D",
  errorSoft: "#FFE6E2",
  info: "#8ECDF3",
  infoSoft: "#E8F5FF",
  overlay: "rgba(10, 10, 10, 0.45)"
};

const INITIAL_ACTIONS = [
  { 
    id: 1, 
    title: "Caminar 15 min Post-Comida", 
    sub: "Impacto clínico: Reduce picos de glucosa un 15%", 
    emoji: "👟", 
    done: true, 
    bg: COLORS.successSoft, 
    accent: COLORS.success 
  },
  { 
    id: 2, 
    title: "Evaluar Composición de Cena", 
    sub: "Usa el Asistente IA para validar tus carbohidratos netos.", 
    emoji: "📸", 
    done: false, 
    bg: COLORS.pinkSoft, 
    accent: COLORS.pinkBright 
  },
  { 
    id: 3, 
    title: "Toma de Presión Arterial", 
    sub: "Meta diaria (120/80 mmHg). Ayuda al riesgo cardiovascular.", 
    emoji: "🩸", 
    done: false, 
    bg: COLORS.infoSoft, 
    accent: COLORS.info 
  },
];

export default function PlanScreen() {
  const tabBarHeight = useSafeTabBarHeight();
  
  const [actions, setActions] = useState(INITIAL_ACTIONS);
  const [isCheckinLoading, setIsCheckinLoading] = useState(false);
  const [isCheckinDone, setIsCheckinDone] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const nativeDriver = Platform.OS !== 'web';
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: nativeDriver }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: nativeDriver }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1200, useNativeDriver: nativeDriver }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: nativeDriver }),
      ])
    ).start();
  }, []);

  const openModal = (type) => {
    setModalContent(type);
    setModalVisible(true);
  };

  const toggleAction = (id) => {
    setActions(actions.map(a => a.id === id ? { ...a, done: !a.done } : a));
  };

  const handleCheckin = () => {
    if (isCheckinDone) return;
    openModal('checkin');
  };

  const confirmCheckin = () => {
    setIsCheckinLoading(true);
    setTimeout(() => {
      setIsCheckinLoading(false);
      setIsCheckinDone(true);
      setModalVisible(false);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Premium Header */}
      <View style={styles.headerBlock}>

        
        <Text style={styles.headerTitle}>Tu Ruta de Bienestar</Text>
        <Text style={styles.headerSubtitle}>
          Metas clínicas adaptativas actualizadas hoy. Todo tu progreso clínico en base médica sólida.
        </Text>
      </View>

      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 140 }]}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Urgent AI Action Banner */}
        <Animated.View style={[styles.warningCard, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.warningHeader}>
            <View style={styles.warningIconWrap}>
              <AlertTriangle color={COLORS.roseDeep} size={22} strokeWidth={2.5}/>
            </View>
            <Text style={styles.warningTitle}>Alerta Preventiva IA</Text>
          </View>
          <Text style={styles.warningDesc}>
            Hemos notado una probabilidad de pico post-prandial en tus próximas comidas. Te sugerimos revisar las grasas saludables de tu próxima ingesta.
          </Text>
          <Pressable style={({ pressed }) => [styles.warningBtn, pressed && { opacity: 0.85 }]} onPress={() => openModal('warning')}>
            <Text style={styles.warningBtnText}>Ver Recomendación Clínica</Text>
            <ChevronRight color={COLORS.textInverse} size={18} />
          </Pressable>
        </Animated.View>

        {/* Action Plan */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>AGENDA HOY • 2 PENDIENTES</Text>
          <Text style={styles.sectionTitle}>Acciones Inmediatas</Text>
        </View>

        <View style={styles.actionList}>
          {actions.map(action => (
            <ActionItem 
              key={action.id} 
              {...action} 
              onPress={() => toggleAction(action.id)} 
            />
          ))}
        </View>

        {/* Check-in Value Proposition Banner */}
        <Pressable 
          style={({ pressed }) => [styles.checkinBanner, pressed && styles.pressedSoft]}
          onPress={handleCheckin}
        >
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgLinearGradient id="checkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#1E1E1E" />
                <Stop offset="100%" stopColor="#2D2D2D" />
              </SvgLinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx="32" fill="url(#checkinGrad)" />
            <Circle cx="85%" cy="15%" r="60" fill="rgba(255,255,255,0.03)" />
            <Circle cx="10%" cy="80%" r="80" fill="rgba(255,255,255,0.02)" />
          </Svg>
          
          <View style={styles.checkinBannerInner}>
            <View style={styles.checkinBannerTop}>
              <View style={styles.checkinIconBlock}>
                <BrainCircuit color={COLORS.yellowSoft} size={24} />
              </View>
              <View style={styles.checkinBadge}>
                <Text style={styles.checkinBadgeText}>REPORTE SEMANAL</Text>
              </View>
            </View>
            
            <View style={styles.checkinBannerTextCol}>
              <Text style={styles.checkinBannerTitle}>Sincronización Médica</Text>
              <Text style={styles.checkinBannerDesc}>
                Consolida todos tus datos de glucosa, actividad y síntomas de la semana. La IA genera un reporte unificado que actualiza tus metas y prepara los datos para tu próxima visita médica.
              </Text>
            </View>

            <View style={styles.checkinBannerFooter}>
              <Text style={styles.checkinBannerLink}>Preparar Check-in de Hoy</Text>
              <ArrowRight color={COLORS.yellowSoft} size={18} />
            </View>
          </View>
        </Pressable>

        {/* Long Term Goals */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>METAS VIGENTES</Text>
          <Text style={styles.sectionTitle}>Tus Objetivos a Largo Plazo</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalScroller}>
          <GoalCard title="Glucosa en Ayunas" value="142" target="< 110 mg/dL" progress={65} bg={COLORS.infoSoft} accent="#4FAAE5" desc="Promedio semanal muestra estabilidad metabólica. 65% de progreso al objetivo ideal." />
          <GoalCard title="Pérdida de Peso" value="82.4" target="75 kg" progress={40} bg={COLORS.pinkSoft} accent={COLORS.pinkBright} desc="Has perdido 1.2kg este mes. Tendencia de reducción de masa grasa visible." />
          <GoalCard title="Hemoglobina A1c" value="6.8%" target="< 6.5%" progress={80} bg={COLORS.warningSoft} accent="#DDA91B" desc="Último análisis: 2 días atrás. Excelente estado cerca del umbral de control clínico." />
        </ScrollView>

        {/* Next Appt */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>CALENDARIO</Text>
          <Text style={styles.sectionTitle}>Próximo Contacto Médico</Text>
        </View>

        <Pressable style={({ pressed }) => [styles.apptCard, pressed && { opacity: 0.85 }]} onPress={() => openModal('appointment')}>
          <View style={styles.apptIconBox}>
            <Stethoscope color={COLORS.textPrimary} size={24} />
          </View>
          <View style={styles.apptLeft}>
            <Text style={styles.apptName}>Dra. Elena Silva (Endocrinología)</Text>
            <View style={styles.apptTimeRow}>
              <Text style={styles.apptTime}>Jueves, 12 Oct • 10:00 AM </Text>
            </View>
            <Text style={styles.apptLoc}>Hospital Central - Consultorio 304</Text>
          </View>
          <ChevronRight color={COLORS.textMuted} size={24} />
        </Pressable>
        
      </Animated.ScrollView>

      {/* Floating Check-in Action */}
      <View style={[styles.fabContainer, { bottom: tabBarHeight + 16 }]}>
        <Pressable 
          style={({ pressed }) => [
            styles.fab, 
            isCheckinDone && { backgroundColor: COLORS.success },
            pressed && { transform: [{ scale: 0.96 }] }
          ]}
          onPress={handleCheckin}
        >
          {isCheckinLoading ? (
            <ActivityIndicator color={isCheckinDone ? COLORS.blackAnchor : COLORS.textInverse} />
          ) : (
            <Zap color={isCheckinDone ? COLORS.blackAnchor : COLORS.textInverse} size={22} strokeWidth={2.5} fill={isCheckinDone ? COLORS.blackAnchor : COLORS.textInverse} />
          )}
          <Text style={[styles.fabText, isCheckinDone && { color: COLORS.blackAnchor }]}>
            {isCheckinDone ? "Check-in Completado" : "Realizar Check-in Semanal"}
          </Text>
        </Pressable>
      </View>

      {/* Premium Reusable Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>
                 {modalContent === 'warning' ? 'Recomendación IA' 
                 : modalContent === 'appointment' ? 'Detalles de Atención'
                 : 'Check-in Semanal'}
               </Text>
               <Pressable onPress={() => setModalVisible(false)} style={styles.modalClose}>
                  <X color={COLORS.textSecondary} size={20} />
               </Pressable>
            </View>
            
            <View style={styles.modalBodyWrap}>
              {modalContent === 'warning' ? (
                <>
                  <Text style={styles.modalBodyText}>
                    Las lecturas recientes indican que las cenas ricas en carbohidratos simples están provocando hiperglucemias nocturnas intermitentes.
                  </Text>
                  <View style={styles.dataSyncBox}>
                     <Text style={styles.dataSyncTitle}>Acción sugerida:</Text>
                     <View style={styles.dataSyncRow}>
                        <ShieldCheck color={COLORS.roseDeep} size={18} />
                        <Text style={styles.dataSyncItem}>Sustituye carbohidratos blancos por integrales esta semana.</Text>
                     </View>
                  </View>
                </>
              ) : modalContent === 'appointment' ? (
                <>
                  <Text style={styles.modalBodyText}>
                    La revisión programada evaluará tu progreso general, los niveles de Hemoglobina A1c y adherencia reciente a los fármacos recetados.
                  </Text>
                  <View style={styles.dataSyncBox}>
                     <Text style={styles.dataSyncTitle}>Qué llevar preparado:</Text>
                     <View style={styles.dataSyncRow}>
                        <Activity color={COLORS.blackAnchor} size={18} />
                        <Text style={styles.dataSyncItem}>Tener tu Check-in en la app completado.</Text>
                     </View>
                  </View>
                </>
              ) : (
                <View style={styles.checkinContent}>
                  <Text style={styles.modalBodyText}>
                    El Check-in extrae patrones complejos a partir de tus registros diarios para brindarte insights accionables. Esto reduce la fricción clínica y genera resúmenes listos para que la IA prevenga eventos agudos con alta precisión y tu médico apruebe los avances.
                  </Text>
                  
                  <View style={styles.dataSyncBox}>
                     <Text style={styles.dataSyncTitle}>Datos que se procesarán en este reporte:</Text>
                     
                     <View style={styles.dataSyncRow}>
                        <Activity color={COLORS.roseDeep} size={18} />
                        <View style={{flex: 1}}>
                          <Text style={styles.dataSyncItem}>14 Registros de Glucosa</Text>
                          <Text style={styles.dataSyncSubItem}>Promedio: 102 mg/dL con variabilidad baja.</Text>
                        </View>
                     </View>
                     <View style={styles.dataSyncRow}>
                        <FileText color={COLORS.info} size={18} />
                        <View style={{flex: 1}}>
                          <Text style={styles.dataSyncItem}>Evolución Sintomatológica</Text>
                          <Text style={styles.dataSyncSubItem}>2 alertas menores cruzadas con tu rutina.</Text>
                        </View>
                     </View>
                     <View style={styles.dataSyncRow}>
                        <ShieldCheck color={COLORS.success} size={18} />
                        <View style={{flex: 1}}>
                          <Text style={styles.dataSyncItem}>Cumplimiento Farmacológico</Text>
                          <Text style={styles.dataSyncSubItem}>85% adherencia a Metformina esta semana.</Text>
                        </View>
                     </View>
                  </View>
                </View>
              )}
            </View>

            {modalContent === 'checkin' ? (
              <Pressable 
                style={[styles.modalBtn, isCheckinLoading && {opacity: 0.85}]} 
                onPress={confirmCheckin} 
                disabled={isCheckinLoading}
              >
                {isCheckinLoading ? (
                  <ActivityIndicator color={COLORS.textInverse} />
                ) : (
                  <>
                    <Text style={styles.modalBtnText}>Analizar y Generar Check-in</Text>
                    <ArrowRight color={COLORS.textInverse} size={18}/>
                  </>
                )}
              </Pressable>
            ) : (
              <Pressable style={styles.modalBtnLight} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnTextLight}>Cerrar</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ActionItem({ title, sub, emoji, done, bg, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionItem, 
        pressed && styles.pressedSoft, 
        done && { opacity: 0.65 }
      ]}
    >
      <View style={[styles.actionEmojiWrap, { backgroundColor: bg }]}>
        <Text style={styles.actionEmoji}>{emoji}</Text>
      </View>
      <View style={styles.actionTextWrap}>
        <Text style={[styles.actionTitle, done && { textDecorationLine: 'line-through', color: COLORS.textMuted }]}>{title}</Text>
        <Text style={styles.actionSub}>{sub}</Text>
      </View>
      <View
        style={[
          styles.actionCheck,
          done ? { backgroundColor: COLORS.success, borderColor: COLORS.success } : null
        ]}
      >
        {done && <Check color="#111" size={16} strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

function GoalCard({ title, value, target, progress, bg, accent, desc }) {
  return (
    <View style={[styles.goalCard, { backgroundColor: bg }]}>
      <View style={styles.goalCardHeader}>
        <Text style={styles.goalCardTitle}>{title}</Text>
        <TrendingDown color={COLORS.blackAnchor} size={20} />
      </View>

      <View style={styles.goalCardValues}>
        <Text style={styles.goalCardCurrent}>{value}</Text>
        <Text style={styles.goalCardTarget}>Meta: {target}</Text>
      </View>
      
      {desc && <Text style={styles.goalCardDesc}>{desc}</Text>}

      <View style={styles.progressTrack}>
        <View
          style={[
             styles.progressFill,
            { width: `${progress}%`, backgroundColor: accent },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.bgPrimary 
  },
  headerBlock: { 
    paddingHorizontal: 24, 
    paddingTop: 16, 
    paddingBottom: 8 
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  badgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.yellowSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.blackAnchor,
    letterSpacing: 0.5,
  },
  headerTitle: { 
    fontSize: 34, 
    fontWeight: "800", 
    color: COLORS.blackAnchor, 
    letterSpacing: -1, 
    lineHeight: 38 
  },
  headerSubtitle: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: COLORS.textSecondary, 
    marginTop: 10, 
    lineHeight: 24 
  },
  scrollContent: { 
    padding: 20, 
    gap: 32 
  },
  pressedSoft: { 
    opacity: 0.75, 
    transform: [{ scale: 0.98 }] 
  },
  
  warningCard: {
    backgroundColor: COLORS.errorSoft, 
    padding: 24, 
    borderRadius: 32, 
    borderWidth: 1,
    borderColor: "#FAD4D4",
  },
  warningHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    marginBottom: 12 
  },
  warningIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FCE8E8",
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningTitle: { 
    fontSize: 19, 
    fontWeight: "800", 
    color: COLORS.roseDeep, 
    letterSpacing: -0.5 
  },
  warningDesc: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#823A4A", 
    lineHeight: 24, 
    marginBottom: 20 
  },
  warningBtn: { 
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.roseDeep, 
    paddingVertical: 16, 
    borderRadius: 20, 
    alignItems: "center" 
  },
  warningBtnText: { 
    color: "#FFFFFF", 
    fontWeight: "800", 
    fontSize: 15 
  },
  
  sectionHeader: { 
    paddingHorizontal: 4, 
    gap: 6 
  },
  sectionEyebrow: { 
    fontSize: 12, 
    fontWeight: "800", 
    letterSpacing: 1.5, 
    color: COLORS.textMuted 
  },
  sectionTitle: { 
    fontSize: 26, 
    fontWeight: "800", 
    color: COLORS.blackAnchor, 
    letterSpacing: -0.8 
  },
  
  actionList: { 
    gap: 16, 
  },
  actionItem: {
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: COLORS.surfacePrimary, 
    padding: 16,
    borderRadius: 28, 
    gap: 16, 
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  actionEmojiWrap: { 
    width: 56, 
    height: 56, 
    borderRadius: 22, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  actionEmoji: { 
    fontSize: 26 
  },
  actionTextWrap: { 
    flex: 1, 
    gap: 4 
  },
  actionTitle: { 
    fontSize: 17, 
    fontWeight: "800", 
    color: COLORS.blackAnchor,
    letterSpacing: -0.2,
  },
  actionSub: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionCheck: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    borderWidth: 2, 
    borderColor: COLORS.lineStrong,
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: COLORS.surfacePrimary,
  },
  
  checkinBanner: {
    borderRadius: 32,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  checkinBannerInner: {
    padding: 28,
  },
  checkinBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkinIconBlock: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 221, 117, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 221, 117, 0.3)',
  },
  checkinBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.yellowSoft,
    letterSpacing: 1,
  },
  checkinBannerTextCol: {
    gap: 10,
    marginBottom: 24,
  },
  checkinBannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textInverse,
    letterSpacing: -0.5,
  },
  checkinBannerDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
  },
  checkinBannerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkinBannerLink: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.yellowSoft,
  },

  goalScroller: { 
    gap: 16, 
  },
  goalCard: { 
    width: 280, 
    padding: 24, 
    borderRadius: 32,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
  },
  goalCardHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginBottom: 20 
  },
  goalCardTitle: { 
    fontSize: 16, 
    fontWeight: "800", 
    color: COLORS.blackAnchor 
  },
  goalCardValues: { 
    marginBottom: 12 
  },
  goalCardCurrent: { 
    fontSize: 38, 
    fontWeight: "900", 
    color: COLORS.blackAnchor, 
    letterSpacing: -1, 
    lineHeight: 44 
  },
  goalCardTarget: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: COLORS.textSecondary, 
    marginTop: 4 
  },
  goalCardDesc: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: COLORS.textSecondary, 
    marginBottom: 20,
    lineHeight: 18,
  },
  progressTrack: { 
    height: 8, 
    backgroundColor: "rgba(0,0,0,0.06)", 
    borderRadius: 4, 
    overflow: "hidden" 
  },
  progressFill: { 
    height: "100%", 
    borderRadius: 4 
  },
  
  apptCard: {
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: COLORS.surfacePrimary,
    padding: 20, 
    borderRadius: 28, 
    borderWidth: 1, 
    borderColor: COLORS.lineSoft,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    gap: 16,
  },
  apptIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptLeft: { 
    flex: 1,
    gap: 4 
  },
  apptName: { 
    fontSize: 16, 
    fontWeight: "800", 
    color: COLORS.blackAnchor 
  },
  apptTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  apptTime: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: COLORS.roseDeep 
  },
  apptLoc: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginTop: 2,
  },
  
  fabContainer: { 
    position: "absolute", 
    left: 20, 
    right: 20, 
    alignItems: "center" 
  },
  fab: {
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: 'center',
    backgroundColor: COLORS.blackAnchor, 
    paddingVertical: 18,
    paddingHorizontal: 24, 
    borderRadius: 999, 
    gap: 12, 
    elevation: 10, 
    shadowColor: "#000", 
    shadowOpacity: 0.15, 
    shadowRadius: 12, 
    shadowOffset: {height: 6},
    width: '100%',
    maxWidth: 400,
  },
  fabText: { 
    color: COLORS.textInverse, 
    fontSize: 17, 
    fontWeight: "800" 
  },

  modalOverlay: { 
    flex: 1, 
    backgroundColor: COLORS.overlay, 
    justifyContent: 'flex-end', 
    alignItems: 'center',
  },
  modalContent: { 
    backgroundColor: COLORS.surfacePrimary, 
    borderTopLeftRadius: 36, 
    borderTopRightRadius: 36, 
    padding: 28, 
    paddingBottom: 40,
    width: '100%', 
    elevation: 20, 
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -5 },
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: COLORS.blackAnchor, 
    letterSpacing: -0.4 
  },
  modalClose: { 
    padding: 8, 
    borderRadius: 16, 
    backgroundColor: COLORS.surfaceSoft 
  },
  modalBodyWrap: { 
    paddingVertical: 8, 
    marginBottom: 28 
  },
  modalBodyText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.textSecondary, 
    lineHeight: 24 
  },
  modalBtn: { 
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: COLORS.blackAnchor, 
    paddingVertical: 20, 
    borderRadius: 20, 
    alignItems: 'center' 
  },
  modalBtnText: { 
    color: COLORS.textInverse, 
    fontSize: 16, 
    fontWeight: '800' 
  },
  modalBtnLight: { 
    backgroundColor: COLORS.surfaceSoft, 
    paddingVertical: 20, 
    borderRadius: 20, 
    alignItems: 'center' 
  },
  modalBtnTextLight: { 
    color: COLORS.textPrimary, 
    fontSize: 16, 
    fontWeight: '800' 
  },
  
  checkinContent: { 
    gap: 20 
  },
  dataSyncBox: { 
    marginTop: 8,
    backgroundColor: COLORS.surfaceSoft, 
    borderRadius: 22, 
    padding: 20, 
    gap: 16, 
    borderWidth: 1, 
    borderColor: COLORS.lineSoft 
  },
  dataSyncTitle: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: COLORS.blackAnchor, 
    letterSpacing: -0.2 
  },
  dataSyncRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14 
  },
  dataSyncItem: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: COLORS.textPrimary 
  },
  dataSyncSubItem: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

