import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import {
  Home,
  Sparkles,
  HeartPulse,
  LayoutList,
  Activity,
} from "lucide-react-native";

function TabIcon({ IconComponent, label, focused }) {
  return (
    <View style={styles.tabItem}>
      <IconComponent
        size={22}
        color={focused ? "#FFFFFF" : "#78716c"}
        strokeWidth={focused ? 2.2 : 1.75}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

function AsistenteTabIcon({ focused }) {
  return (
    <View style={[styles.tabItem, styles.aiTabItem]}>
      <View style={[styles.aiIconWrap, focused && styles.aiIconWrapActive]}>
        <Sparkles
          size={18}
          color={focused ? "#E11D48" : "#71717A"}
          strokeWidth={focused ? 2.2 : 1.75}
        />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        Asistente
      </Text>
    </View>
  );
}

export default function LayoutTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#78716c",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon IconComponent={Home} label="Inicio" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              IconComponent={Activity}
              label="MiSalud"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="asistente"
        options={{
          tabBarIcon: ({ focused }) => <AsistenteTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              IconComponent={LayoutList}
              label="Plan"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="captura"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#000000",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    height: 90,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 0,
    position: "absolute",
    borderLeftWidth: 0,
    borderRightWidth: 0,
    elevation: 0,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 50, // Permite ajustar dinamicamente
    paddingHorizontal: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#71717A",
    letterSpacing: -0.2, // Ayuda a que quepa en una línea
    flexShrink: 1,
    textAlign: "center",
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
  aiTabItem: {
    gap: 4,
  },
  aiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  aiIconWrapActive: {
    backgroundColor: "#FFFFFF",
  },
});
