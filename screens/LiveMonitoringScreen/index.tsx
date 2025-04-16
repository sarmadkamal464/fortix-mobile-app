// app/live-monitoring.tsx
import LogoutButton from "@/components/LogoutButton";
import { useToast } from "@/lib/utils/toast";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text,
  Button,
} from "react-native";

// Set header options (forcing header to be shown)
export const unstable_settings = {
  headerShown: true,
  headerRight: () => <LogoutButton />,
};

const LiveMonitoringScreen = () => {
  const { successToast } = useToast();

  const handleStartMonitoring = () => {
    // Add your live monitoring logic here
    successToast("Live monitoring started");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Live Monitoring</Text>
        <Text style={styles.description}>
          Monitor your system in real-time. Tap below to begin streaming or view
          alerts.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stream Status</Text>
          <Text style={styles.cardContent}>No active streams</Text>
        </View>

        <Button title="Start Monitoring" onPress={handleStartMonitoring} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default LiveMonitoringScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#f1f5f9",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardContent: {
    fontSize: 16,
    color: "#333",
  },
});
