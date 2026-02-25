import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type BottomNavProps = {
  activeTab: "cameras" | "alerts";
};

const BottomNav: React.FC<BottomNavProps> = ({ activeTab }) => {
  const router = useRouter();

  const handleNavigate = (tab: "cameras" | "alerts") => {
    if (tab === activeTab) return;

    if (tab === "cameras") {
      router.replace("/livemonitoring");
    } else {
      router.replace("/alerts" as any);
    }
  };

  const camerasActive = activeTab === "cameras";
  const alertsActive = activeTab === "alerts";

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.tab, camerasActive && styles.tabActive]}
        onPress={() => handleNavigate("cameras")}
      >
        <Ionicons
          name="camera-outline"
          size={22}
          color={camerasActive ? "#00BCD4" : "#9CA3AF"}
        />
        <Text
          style={[styles.label, camerasActive && styles.labelActive]}
        >
          Cameras
        </Text>
      </Pressable>

      <Pressable
        style={[styles.tab, alertsActive && styles.tabActive]}
        onPress={() => handleNavigate("alerts")}
      >
        <Ionicons
          name="notifications-outline"
          size={22}
          color={alertsActive ? "#00BCD4" : "#9CA3AF"}
        />
        <Text
          style={[styles.label, alertsActive && styles.labelActive]}
        >
          Alerts
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#111111",
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: "#222222",
  },
  tab: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: "#022c32",
  },
  label: {
    marginTop: 6,
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  labelActive: {
    color: "#00BCD4",
    fontWeight: "600",
  },
});

export default BottomNav;

