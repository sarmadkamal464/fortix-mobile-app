// app/live-monitoring.tsx
import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import LogoutButton from "@/components/LogoutButton";
import LiveStreamPlayer from "@/components/LiveStreamPlayer";
LogoutButton;

export default function LiveMonitoringScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "Live Monitoring",
          headerBackVisible: false, // 👈 Removes back button
          headerRight: () => <LogoutButton />,
        }}
      />
      <View style={styles.container}>
        <Text style={styles.title}>Live Monitoring</Text>
        <LiveStreamPlayer />
        <Text style={styles.subtitle}>You're now viewing real-time data.</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
});
