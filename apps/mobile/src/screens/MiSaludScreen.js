import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
  Modal,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

function useSafeTabBarHeight() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useBottomTabBarHeight();
  } catch {
    return Platform.OS === 'web' ? 0 : 90;
  }
}
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Pill,
  Plus,
  UserRound,
  X,
} from 'lucide-react-native';
import { Card } from '../components/ui/Card';

const COLORS = {
  bgPrimary: '#F5EFE8',
  bgSecondary: '#FFF9F4',
  surfacePrimary: '#FFFFFF',
  surfaceSoft: '#F7F2EC',
  surfaceMuted: '#EEE8E1',
  lineSoft: '#E5DDD3',
  textPrimary: '#111111',
  textSecondary: '#4A4A4A',
  textMuted: '#7B7B7B',
  textInverse: '#FFFFFF',
  blackAnchor: '#0A0A0A',
  yellowSoft: '#F4DD75',
  pinkSoft: '#EEC0D8',
  greenSoft: '#CFE1A8',
  blueSoft: '#BCD0F3',
  orangeSoft: '#F6C29B',
  mintSoft: '#BFE8D9',
  warning: '#F7D154',
  error: '#F26D6D',
  success: '#88D66C',
};

const TABS = [
  { key: 'symptoms', label: 'Síntomas' },
  { key: 'meds', label: 'Medicación' },
  { key: 'experts', label: 'Expertos' },
  { key: 'timeline', label: 'Cronograma' },
];

const WEEKLY_BADGES = [
  { id: 'tingle', icon: '🦶', label: 'Hormigueo', count: 4, tone: 'warning' },
  { id: 'fatigue', icon: '😴', label: 'Cansancio', count: 3, tone: 'neutral' },
  { id: 'vision', icon: '👁', label: 'Visión borrosa', count: 1, tone: 'neutral' },
];

const SYMPTOM_TIMELINE = [
  { id: 'today-tingle', time: 'Hoy', title: 'Hormigueo leve', description: 'Pie derecho', icon: '🦶' },
  { id: 'yesterday-fatigue', time: 'Ayer', title: 'Cansancio severo', description: 'Después de almorzar', icon: '😴' },
  { id: 'mar-18-tingle', time: 'Mar 18', title: 'Hormigueo moderado', description: 'Ambos pies', icon: '🦶' },
];

const EXPERTS = [
  {
    id: 'podiatrist',
    role: 'Podólogo',
    timeframe: 'Próximas 2 semanas',
    reason: 'Hormigueo en pie x4 este mes',
    action: 'Ver perfil',
    route: '/(tabs)/perfil',
    accent: '#F68AC8',
    surface: '#FFF1F7',
  },
  {
    id: 'endocrinologist',
    role: 'Endocrinólogo',
    timeframe: 'Próximo mes',
    reason: 'HbA1c 8.2% y revisión de tratamiento',
    action: 'Preparar resumen',
    route: '/(tabs)/historial',
    accent: '#F6A36F',
    surface: '#FFF4EB',
  },
  {
    id: 'ophthalmologist',
    role: 'Oftalmólogo',
    timeframe: 'Próximos 3 meses',
    reason: 'Control anual pendiente',
    action: 'Abrir recordatorio',
    route: '/(tabs)/perfil',
    accent: '#88D66C',
    surface: '#F2FBEF',
  },
];

const INITIAL_MEDICATIONS = [
  {
    id: 'metformin',
    name: 'Metformina 1000mg',
    schedule: 'Noche · con cena',
    description: 'Ayuda a que tu cuerpo use mejor la insulina.',
    adherence: 71,
    takenToday: false,
    accent: '#F68AC8',
    accentSurface: '#FFF1F7',
  },
  {
    id: 'lisinopril',
    name: 'Lisinopril 10mg',
    schedule: 'Mañana · con desayuno',
    description: 'Protege tus riñones y ayuda a controlar la presión.',
    adherence: 94,
    takenToday: true,
    accent: '#88D66C',
    accentSurface: '#F2FBEF',
  },
];

const INITIAL_TASK_GROUPS = [
  {
    id: 'this-week',
    title: 'Esta semana',
    tasks: [
      { id: 'metformin-7-days', text: 'Tomar metformina 7 días', completed: false },
      { id: 'glucose-3', text: 'Registrar glucosa x3', completed: true },
      { id: 'call-podiatrist', text: 'Llamar para cita con podólogo', completed: false },
    ],
  },
  {
    id: 'this-month',
    title: 'Este mes',
    tasks: [
      { id: 'hba1c-lab', text: 'Lab HbA1c (vence en 18 días)', completed: false, urgent: true },
      { id: 'endo-follow-up', text: 'Cita endocrinólogo', completed: false },
    ],
  },
  {
    id: 'doctor-followups',
    title: 'Pendientes del médico',
    tasks: [
      { id: 'blood-pressure', text: 'Control de presión en 2 semanas', completed: false },
      { id: 'cholesterol', text: 'Lab colesterol (hace 4 meses)', completed: false },
    ],
  },
];

export default function MiSaludScreen() {
  const router = useRouter();
  const tabBarHeight = useSafeTabBarHeight();
  const [activeTab, setActiveTab] = useState('symptoms');
  const [medications, setMedications] = useState(INITIAL_MEDICATIONS);
  const [taskGroups, setTaskGroups] = useState(INITIAL_TASK_GROUPS);

  const completedTasks = taskGroups.reduce(
    (count, group) => count + group.tasks.filter((task) => task.completed).length,
    0
  );
  const totalTasks = taskGroups.reduce((count, group) => count + group.tasks.length, 0);
  const urgentSymptoms = WEEKLY_BADGES.find((badge) => badge.tone === 'warning')?.count ?? 0;

  // Animations
  const fadeAnim = useState(new Animated.Value(1))[0];
  const [loadingMed, setLoadingMed] = useState(null);
  const [loadingTask, setLoadingTask] = useState(null);

  // Modals
  const [symptomModalVisible, setSymptomModalVisible] = useState(false);
  const [newSymptomText, setNewSymptomText] = useState("");

  const handleTabChange = (key) => {
    const nativeDriver = Platform.OS !== 'web';
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: nativeDriver }).start(() => {
      setActiveTab(key);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: nativeDriver }).start();
    });
  };

  function handleMedicationToggle(medicationId) {
    if (loadingMed) return;
    setLoadingMed(medicationId);
    setTimeout(() => {
      setMedications((current) =>
        current.map((medication) =>
          medication.id === medicationId
            ? { ...medication, takenToday: !medication.takenToday }
            : medication
        )
      );
      setLoadingMed(null);
    }, 800);
  }

  function handleTaskToggle(groupId, taskId) {
    if (loadingTask) return;
    setLoadingTask(taskId);
    setTimeout(() => {
      setTaskGroups((current) =>
        current.map((group) =>
          group.id === groupId
            ? {
                ...group,
                tasks: group.tasks.map((task) =>
                  task.id === taskId ? { ...task, completed: !task.completed } : task
                ),
              }
            : group
        )
      );
      setLoadingTask(null);
    }, 600);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + 32 },
        ]}
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.screenTitle}>Mi Salud</Text>
              <Text style={styles.screenSubtitle}>
                Resumen claro de síntomas, medicación y próximos pasos.
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Abrir perfil"
              onPress={() => router.push('/(tabs)/perfil')}
              style={({ pressed }) => [
                styles.utilityButton,
                pressed && styles.pressedButton,
              ]}
            >
              <UserRound color={COLORS.textInverse} size={20} />
            </Pressable>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroAccentBubble} />
            <Text style={styles.heroEyebrow}>Resumen de hoy</Text>
            <Text style={styles.heroTitle}>Tu control va mejorando.</Text>
            <Text style={styles.heroBody}>
              Mantén foco en el hormigueo y en tomar tu medicación a tiempo.
            </Text>

            <View style={styles.heroMetrics}>
              <MetricChip
                icon={Activity}
                label="Glucosa"
                value="124 mg/dL"
                backgroundColor={COLORS.surfacePrimary}
              />
              <MetricChip
                icon={Pill}
                label="Adherencia"
                value="71%"
                backgroundColor={COLORS.surfacePrimary}
              />
            </View>

            <View style={styles.heroFooter}>
              <View style={styles.heroStatus}>
                <AlertTriangle color={COLORS.textPrimary} size={16} />
                <Text style={styles.heroStatusText}>
                  {urgentSymptoms} alertas activas esta semana
                </Text>
              </View>
              <Pressable
                onPress={() => setActiveTab('timeline')}
                style={({ pressed }) => [
                  styles.heroFooterButton,
                  pressed && styles.pressedButton,
                ]}
              >
                <Text style={styles.heroFooterButtonText}>Ver plan</Text>
                <ChevronRight color={COLORS.textPrimary} size={16} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.stickyTabsShell}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => handleTabChange(tab.key)}
                  style={({ pressed }) => [
                    styles.tabButton,
                    isActive && styles.tabButtonActive,
                    pressed && styles.pressedButton,
                  ]}
                >
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <Animated.View style={[styles.bodyContent, { opacity: fadeAnim }]}>
          {activeTab === 'symptoms' ? (
            <SymptomsTab router={router} openModal={() => setSymptomModalVisible(true)} />
          ) : null}
          {activeTab === 'meds' ? (
            <MedicationTab
              medications={medications}
              onToggleMedication={handleMedicationToggle}
              loadingMed={loadingMed}
              onManage={() => router.push('/(tabs)/perfil')}
            />
          ) : null}
          {activeTab === 'experts' ? (
            <ExpertsTab router={router} />
          ) : null}
          {activeTab === 'timeline' ? (
            <TimelineTab
              completedTasks={completedTasks}
              onToggleTask={handleTaskToggle}
              loadingTask={loadingTask}
              taskGroups={taskGroups}
              totalTasks={totalTasks}
            />
          ) : null}
        </Animated.View>
      </ScrollView>

      <Modal visible={symptomModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Registrar Síntoma</Text>
               <Pressable onPress={() => setSymptomModalVisible(false)} style={styles.modalClose}>
                  <X color={COLORS.textSecondary} size={20} />
               </Pressable>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="¿Qué sientes? (Ej. dolor cabeza)"
              placeholderTextColor={COLORS.textMuted}
              value={newSymptomText}
              onChangeText={setNewSymptomText}
            />
            <Pressable 
              style={[styles.modalBtn, !newSymptomText.trim() && {opacity: 0.5}]}
              onPress={() => {
                if(newSymptomText.trim()) {
                  setNewSymptomText("");
                  setSymptomModalVisible(false);
                }
              }}
            >
              <Text style={styles.modalBtnText}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function SymptomsTab({ router, openModal }) {
  return (
    <View style={styles.tabPanel}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>Esta semana</Text>
          <Text style={styles.sectionTitle}>Síntomas frecuentes</Text>
        </View>
        <Pressable
          onPress={openModal}
          style={({ pressed }) => [
            styles.inlineAction,
            pressed && styles.pressedButton,
          ]}
        >
          <Plus color={COLORS.blackAnchor} size={16} />
          <Text style={styles.inlineActionText}>Registrar</Text>
        </Pressable>
      </View>

      <View style={styles.badgesWrap}>
        {WEEKLY_BADGES.map((badge) => (
          <SymptomBadge key={badge.id} {...badge} />
        ))}
      </View>

      <Card variant="alert" style={styles.alertCard}>
        <View style={styles.alertCardRow}>
          <AlertTriangle color="#B45309" size={20} />
          <Text style={styles.alertCardText}>
            El hormigueo frecuente puede indicar neuropatía. Conviene mencionarlo
            en tu próxima consulta.
          </Text>
        </View>
      </Card>

      <Card style={styles.surfaceCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.surfaceCardTitle}>Historial reciente</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/historial')}
            style={({ pressed }) => [styles.inlineLink, pressed && styles.pressedButton]}
          >
            <Text style={styles.inlineLinkText}>Ver historial</Text>
            <ChevronRight color={COLORS.textMuted} size={16} />
          </Pressable>
        </View>

        <View style={styles.timelineList}>
          {SYMPTOM_TIMELINE.map((item, index) => (
            <TimelineEntry
              key={item.id}
              description={item.description}
              icon={item.icon}
              isLast={index === SYMPTOM_TIMELINE.length - 1}
              time={item.time}
              title={item.title}
            />
          ))}
        </View>
      </Card>
    </View>
  );
}

function MedicationTab({ medications, onToggleMedication, loadingMed, onManage }) {
  return (
    <View style={styles.tabPanel}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>Rutina</Text>
          <Text style={styles.sectionTitle}>Medicación activa</Text>
        </View>
        <View style={styles.summaryPill}>
          <Clock3 color={COLORS.textPrimary} size={14} />
          <Text style={styles.summaryPillText}>Hoy</Text>
        </View>
      </View>

      {medications.map((medication) => (
        <MedicationCard
          key={medication.id}
          medication={medication}
          onToggleMedication={onToggleMedication}
          isLoading={loadingMed === medication.id}
        />
      ))}

      <Pressable
        onPress={onManage}
        style={({ pressed }) => [
          styles.manageCard,
          pressed && styles.pressedButton,
        ]}
      >
        <Plus color={COLORS.textSecondary} size={20} />
        <Text style={styles.manageCardTitle}>Administrar medicamentos</Text>
        <Text style={styles.manageCardBody}>
          Abre tu perfil para revisar tratamientos, recordatorios y dosis.
        </Text>
      </Pressable>
    </View>
  );
}

function ExpertsTab({ router }) {
  return (
    <View style={styles.tabPanel}>
      <Text style={styles.sectionHint}>
        Sugerencias basadas en tus síntomas recientes y controles pendientes.
      </Text>

      {EXPERTS.map((expert) => (
        <Card key={expert.id} style={styles.expertCard}>
          <View style={styles.expertHeader}>
            <View style={styles.expertTitleRow}>
              <View style={[styles.expertDot, { backgroundColor: expert.accent }]} />
              <Text style={styles.expertRole}>{expert.role}</Text>
            </View>
            <View style={styles.timeframeChip}>
              <CalendarDays color={COLORS.textMuted} size={12} />
              <Text style={styles.timeframeChipText}>{expert.timeframe}</Text>
            </View>
          </View>

          <View style={[styles.expertReason, { backgroundColor: expert.surface }]}>
            <Text style={styles.expertReasonText}>{expert.reason}</Text>
          </View>

          <Pressable
            onPress={() => router.push(expert.route)}
            style={({ pressed }) => [
              styles.expertAction,
              { backgroundColor: expert.surface, borderColor: expert.accent },
              pressed && styles.pressedButton,
            ]}
          >
            <Text style={[styles.expertActionText, { color: COLORS.textPrimary }]}>
              {expert.action}
            </Text>
          </Pressable>
        </Card>
      ))}
    </View>
  );
}

function TimelineTab({ completedTasks, onToggleTask, loadingTask, taskGroups, totalTasks }) {
  return (
    <View style={styles.tabPanel}>
      <Card style={[styles.surfaceCard, styles.timelineSummaryCard]}>
        <Text style={styles.sectionEyebrow}>Seguimiento</Text>
        <Text style={styles.surfaceCardTitle}>Tu plan del mes</Text>
        <Text style={styles.timelineSummaryBody}>
          {completedTasks} de {totalTasks} tareas completadas. Sigue con lo urgente
          primero para mantener el control estable.
        </Text>
      </Card>

      {taskGroups.map((group) => (
        <View key={group.id} style={styles.taskGroup}>
          <Text style={styles.sectionEyebrow}>{group.title}</Text>
          <View style={styles.taskList}>
            {group.tasks.map((task) => (
              <TaskRow
                key={task.id}
                groupId={group.id}
                onToggleTask={onToggleTask}
                task={task}
                isLoading={loadingTask === task.id}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function MetricChip({ backgroundColor, icon: Icon, label, value }) {
  return (
    <View style={[styles.metricChip, { backgroundColor }]}>
      <Icon color={COLORS.textPrimary} size={16} />
      <View style={styles.metricChipCopy}>
        <Text style={styles.metricChipLabel}>{label}</Text>
        <Text style={styles.metricChipValue}>{value}</Text>
      </View>
    </View>
  );
}

function SymptomBadge({ count, icon, label, tone }) {
  const isWarning = tone === 'warning';

  return (
    <View
      style={[
        styles.symptomBadge,
        isWarning ? styles.symptomBadgeWarning : styles.symptomBadgeNeutral,
      ]}
    >
      <Text style={styles.symptomEmoji}>{icon}</Text>
      <Text style={styles.symptomLabel}>{label}</Text>
      <View
        style={[
          styles.symptomCount,
          isWarning ? styles.symptomCountWarning : styles.symptomCountNeutral,
        ]}
      >
        <Text style={styles.symptomCountText}>x{count}</Text>
      </View>
    </View>
  );
}

function TimelineEntry({ description, icon, isLast, time, title }) {
  return (
    <View style={styles.timelineEntry}>
      <View style={styles.timelineRail}>
        <View style={styles.timelineIconWrap}>
          <Text style={styles.timelineIcon}>{icon}</Text>
        </View>
        {!isLast ? <View style={styles.timelineLine} /> : null}
      </View>
      <View style={styles.timelineCopy}>
        <Text style={styles.timelineTime}>{time}</Text>
        <Text style={styles.timelineTitle}>{title}</Text>
        <Text style={styles.timelineDescription}>{description}</Text>
      </View>
    </View>
  );
}

function MedicationCard({ medication, onToggleMedication, isLoading }) {
  const isTaken = medication.takenToday;

  return (
    <Card style={[styles.medicationCard, { borderLeftColor: medication.accent }]}>
      <View style={styles.medicationHeader}>
        <View style={styles.medicationIdentity}>
          <View
            style={[
              styles.medicationIconWrap,
              { backgroundColor: medication.accentSurface },
            ]}
          >
            <Pill color={COLORS.textPrimary} size={20} />
          </View>
          <View style={styles.medicationCopy}>
            <Text style={styles.medicationName}>{medication.name}</Text>
            <Text style={styles.medicationSchedule}>{medication.schedule}</Text>
          </View>
        </View>
        <Text style={styles.medicationAdherence}>{medication.adherence}%</Text>
      </View>

      <Text style={styles.medicationDescription}>{medication.description}</Text>

      <View style={styles.medicationFooter}>
        <Text style={styles.medicationFooterNote}>adherencia del mes</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onToggleMedication(medication.id)}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.medicationAction,
            isTaken ? styles.medicationActionDone : styles.medicationActionPending,
            pressed && styles.pressedButton,
          ]}
        >
          {isLoading ? (
             <ActivityIndicator color={isTaken ? COLORS.textPrimary : COLORS.textInverse} size="small" />
          ) : isTaken ? (
            <>
              <CheckCircle2 color={COLORS.textPrimary} size={16} />
              <Text style={styles.medicationActionDoneText}>Tomada hoy</Text>
            </>
          ) : (
            <>
              <Text style={styles.medicationActionPendingText}>Marcar hoy</Text>
            </>
          )}
        </Pressable>
      </View>
    </Card>
  );
}

function TaskRow({ groupId, onToggleTask, task, isLoading }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: task.completed }}
      onPress={() => onToggleTask(groupId, task.id)}
      disabled={isLoading}
      style={({ pressed }) => [
        styles.taskRow,
        pressed && styles.pressedButton,
      ]}
    >
      <View
        style={[
          styles.taskCheckbox,
          task.completed && styles.taskCheckboxChecked,
        ]}
      >
        {isLoading ? (
         <ActivityIndicator color={task.completed ? COLORS.textInverse : COLORS.textPrimary} size="small" style={{transform: [{scale: 0.6}]}} />
        ) : task.completed ? <Check color={COLORS.textInverse} size={14} /> : null}
      </View>
      <Text
        style={[
          styles.taskText,
          task.urgent && styles.taskTextUrgent,
          task.completed && styles.taskTextCompleted,
        ]}
      >
        {task.text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
  },
  headerBlock: {
    gap: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  screenSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    maxWidth: 260,
  },
  utilityButton: {
    alignItems: 'center',
    backgroundColor: COLORS.blackAnchor,
    borderRadius: 18,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  heroCard: {
    backgroundColor: COLORS.yellowSoft,
    borderRadius: 24,
    gap: 14,
    overflow: 'hidden',
    padding: 20,
    position: 'relative',
  },
  heroAccentBubble: {
    backgroundColor: COLORS.pinkSoft,
    borderRadius: 999,
    height: 128,
    opacity: 0.7,
    position: 'absolute',
    right: -24,
    top: -26,
    width: 128,
  },
  heroEyebrow: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    maxWidth: 260,
  },
  heroBody: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    maxWidth: 280,
  },
  heroMetrics: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  heroFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  heroStatus: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  heroStatusText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  heroFooterButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(17,17,17,0.08)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroFooterButtonText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  stickyTabsShell: {
    backgroundColor: COLORS.bgPrimary,
    borderBottomColor: COLORS.lineSoft,
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 2,
  },
  tabsContent: {
    gap: 10,
    paddingRight: 20,
  },
  tabButton: {
    alignItems: 'center',
    backgroundColor: COLORS.surfacePrimary,
    borderColor: COLORS.lineSoft,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabButtonActive: {
    backgroundColor: COLORS.blackAnchor,
    borderColor: COLORS.blackAnchor,
  },
  tabLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: COLORS.textInverse,
  },
  bodyContent: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tabPanel: {
    gap: 16,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionEyebrow: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  sectionHint: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
  inlineAction: {
    alignItems: 'center',
    backgroundColor: COLORS.surfacePrimary,
    borderColor: COLORS.lineSoft,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineActionText: {
    color: COLORS.blackAnchor,
    fontSize: 13,
    fontWeight: '700',
  },
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  symptomBadge: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  symptomBadgeNeutral: {
    backgroundColor: COLORS.surfacePrimary,
    borderColor: COLORS.lineSoft,
  },
  symptomBadgeWarning: {
    backgroundColor: '#FFF3E6',
    borderColor: '#F3C28E',
  },
  symptomEmoji: {
    fontSize: 16,
  },
  symptomLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  symptomCount: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  symptomCountNeutral: {
    backgroundColor: COLORS.surfaceSoft,
  },
  symptomCountWarning: {
    backgroundColor: '#FDE2C3',
  },
  symptomCountText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  alertCard: {
    backgroundColor: '#FFF5E8',
    borderColor: '#F6C29B',
  },
  alertCardRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  alertCardText: {
    color: '#9A3412',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  surfaceCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderColor: COLORS.lineSoft,
  },
  surfaceCardTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  inlineLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  inlineLinkText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  timelineList: {
    gap: 2,
    marginTop: 16,
  },
  timelineEntry: {
    flexDirection: 'row',
    gap: 14,
  },
  timelineRail: {
    alignItems: 'center',
    width: 40,
  },
  timelineIconWrap: {
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderColor: COLORS.lineSoft,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  timelineIcon: {
    fontSize: 17,
  },
  timelineLine: {
    backgroundColor: COLORS.lineSoft,
    flex: 1,
    marginTop: 6,
    width: 2,
  },
  timelineCopy: {
    flex: 1,
    paddingBottom: 18,
    paddingTop: 2,
  },
  timelineTime: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timelineTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  timelineDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  summaryPill: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  summaryPillText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  medicationCard: {
    borderColor: COLORS.lineSoft,
    borderLeftWidth: 4,
    gap: 14,
  },
  medicationHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  medicationIdentity: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  medicationIconWrap: {
    alignItems: 'center',
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  medicationCopy: {
    flex: 1,
    gap: 3,
  },
  medicationName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  medicationSchedule: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  medicationAdherence: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  medicationDescription: {
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: 16,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  medicationFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  medicationFooterNote: {
    color: COLORS.textMuted,
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  medicationAction: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  medicationActionPending: {
    backgroundColor: COLORS.blackAnchor,
  },
  medicationActionDone: {
    backgroundColor: COLORS.greenSoft,
  },
  medicationActionPendingText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
  medicationActionDoneText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  manageCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSoft,
    borderColor: COLORS.lineSoft,
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 2,
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  manageCardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  manageCardBody: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  expertCard: {
    gap: 14,
  },
  expertHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  expertTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  expertDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  expertRole: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  timeframeChip: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  timeframeChipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  expertReason: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  expertReasonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  expertAction: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  expertActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  timelineSummaryCard: {
    gap: 8,
  },
  timelineSummaryBody: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  taskGroup: {
    gap: 10,
  },
  taskList: {
    gap: 10,
  },
  taskRow: {
    alignItems: 'flex-start',
    backgroundColor: COLORS.surfacePrimary,
    borderColor: COLORS.lineSoft,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  taskCheckbox: {
    alignItems: 'center',
    backgroundColor: COLORS.surfacePrimary,
    borderColor: COLORS.textMuted,
    borderRadius: 10,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    marginTop: 1,
    width: 22,
  },
  taskCheckboxChecked: {
    backgroundColor: COLORS.blackAnchor,
    borderColor: COLORS.blackAnchor,
  },
  taskText: {
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  taskTextUrgent: {
    color: '#B45309',
  },
  taskTextCompleted: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  metricChip: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 10,
    minWidth: 132,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  metricChipCopy: {
    gap: 2,
  },
  metricChipLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricChipValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  pressedButton: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: COLORS.surfacePrimary, borderRadius: 32, padding: 24, width: '100%', elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.4 },
  modalClose: { padding: 4, borderRadius: 12, backgroundColor: COLORS.surfaceSoft },
  modalInput: { borderWidth: 1, borderColor: COLORS.lineSoft, borderRadius: 16, padding: 16, fontSize: 16, color: COLORS.textPrimary, marginBottom: 24, backgroundColor: '#FAFAFA' },
  modalBtn: { backgroundColor: COLORS.blackAnchor, paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  modalBtnText: { color: COLORS.textInverse, fontSize: 16, fontWeight: '700' },
});
