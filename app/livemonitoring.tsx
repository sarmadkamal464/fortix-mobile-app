// app/live-monitoring.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LogoutButton from "@/components/LogoutButton";
import LiveStreamPlayer from "@/components/LiveStreamPlayer";
import useFetchStreams from "@/lib/streaming";
import { Stack } from "expo-router";
import Header from "@/components/Header"; // Correct path to the Header component
import { StreamState } from "@/lib/types/streaming"; // Correct path to the StreamState type
import { usePushToken } from "@/lib/hooks/usePushToken";

export default function LiveMonitoringScreen() {
  const [state, setState] = useState<StreamState>({
    streams: [],
    pagination: {
      page: 1, // Initialize default values for pagination
      limit: 10, // You can adjust these defaults based on your needs
      total: 0,
      totalPages: 0,
    },
    loading: false,
    error: null,
  });

  const device_token = usePushToken();

  const fetchStreams = useFetchStreams(setState);
  const activeStreams = state.streams.filter(stream => stream.status === 'active');

  useEffect(() => {
    fetchStreams();
  }, []);

  const handleRefresh = () => {
    fetchStreams(); // Refresh stream list
  };

  return (
    <View style={styles.container}>
      <Header 
      title="Live Monitoring"
      />
      <View style={styles.header}>
        <Text style={styles.title}>Live Monitoring</Text>
        <Pressable onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </Pressable>
      </View>

      {state.loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={activeStreams}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <LiveStreamPlayer
              key={item.id}
              streamUrl={`${item.business_case?.model_url}streams/${item.id}/stream.m3u8`}
            />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={state.loading}
          onRefresh={handleRefresh}
        />
      )}

      {
        !device_token && Platform.OS === 'ios' ? (
          <View style={styles.permissionContainer}>
            <Text>

            <Text style={styles.permissionText}>Please enable notification permission for receiving violation alerts</Text>
           {' '}
            <Text style={[styles.permissionText, {color: "#007bff", textDecorationLine: "underline" }]} onPress={() => {
              Linking.openSettings();
            }}>
              Grant Permission</Text>
            </Text>
            
          </View>
        ) : null
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 30 : 0,
  },
  header: {
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  refreshButton: {
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 6,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionContainer:{
    backgroundColor: "#f0f0f0",
    padding: 16,
    borderRadius: 8,
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    
  },
  permissionText:{
    fontSize: 16,
    color: "#000",
  }
});
