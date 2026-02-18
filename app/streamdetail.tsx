import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/lib/hooks/auth";
import { Stream } from "@/lib/types/streaming";
import axiosInstance from "@/lib/utils/axios";
import LiveStreamPlayer from "@/components/LiveStreamPlayer";
import BottomNav from "@/components/BottomNav";
import FortixLogo from "@/assets/images/fortix-logo.png";

type StreamDetailResponse = {
  data?: {
    stream?: Stream[];
  };
};

export default function StreamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [podId, setPodId] = useState("")
  const router = useRouter();
  const { logout } = useAuth();
  const checkIntervals = useRef<Record<number, NodeJS.Timeout>>({});
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<number, { streamUrl?: string; isLoading: boolean }>>({});


  const fetchStream = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get<StreamDetailResponse>(
        `/streaming/${id}`
      );
      const streamData =
        (response.data as any)?.data?.stream ||
        (response.data as any)?.data ||
        null;
      setStream(streamData);
    } catch (err: any) {
      console.warn("Failed to fetch stream detail", err?.message);
      setError("Failed to load camera details");
    } finally {
      setLoading(false);
    }
  };

  const getPodId = async () => {
    const podId = await SecureStore.getItemAsync("podId") || "";
    setPodId(podId)
  }

  useEffect(() => {
    fetchStream();
    getPodId()
  }, [id]);

  const handleRefresh = () => {
    fetchStream();
  };

  // Build HLS stream URL similar to web RealTimePreview logic
  const getStreamUrl = useCallback((stream: Stream) => {
    // Prefer model_url from business case if available (may already include pod / base URL)
    const modelUrl =
      ((stream as any).business_case?.model_url as string | undefined) ||
      (process.env.EXPO_FAST_PUBLIC_API_URL as string | undefined) ||
      "http://127.0.0.1:8000/";

    const base = modelUrl.endsWith("/") ? modelUrl : `${modelUrl}/`;

    // Add cache-busting query params to avoid stale HLS playlists
    const timestamp = Date.now();
    const cacheBust = Math.random();

    return `${base}streams/${stream.id}/stream.m3u8?t=${timestamp}&nocache=${cacheBust}`;
  }, []);

  const statusText =
    stream?.status === "active" ? "Online" : stream ? "Offline" : "-";

  const streamType = stream?.video_source?.source_type || "-";
  const businessUseCase = stream?.business_case?.name || "-";
  const ipAddress =
    (stream?.video_source?.credentials as any)?.ip_address ?? "N/A";
  const fps =
    (stream as any)?.fps ??
    (stream?.configurations && stream.configurations[0]?.confidence_threshold) ??
    "N/A";
  const lastUpdated = stream?.status === "active" ? "LIVE" : "Inactive";

  const cameraName = stream?.video_source?.name || `Camera ID: ${id}`;


  const checkStreamAvailability = useCallback(
    async (stream: any) => {
      const streamUrl = getStreamUrl(stream);
      try {
        // Add no-cache headers to prevent disk caching
        const head = await fetch(streamUrl, {
          method: "HEAD",
          cache: "no-store", // Prevent caching
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
        if (head.ok) {
          const m3u8Response = await fetch(streamUrl, {
            cache: "no-store", // Prevent caching
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          });
          const m3u8Text = await m3u8Response.text();
          if (m3u8Text.includes(".ts")) {
            setAvailability((prev) => ({
              ...prev,
              [stream.id]: { streamUrl, isLoading: false },
            }));
            if (checkIntervals.current[stream.id]) {
              clearInterval(checkIntervals.current[stream.id]);
              delete checkIntervals.current[stream.id];
            }
          }
        }
      } catch {
        // ignore errors and keep polling until available
      }
    },
    [getStreamUrl]
  );

  const startStreamCheck = useCallback(
    (stream: any) => {
      setAvailability((prev) => ({
        ...prev,
        [stream.id]: { streamUrl: prev[stream.id]?.streamUrl, isLoading: true },
      }));
      // Check immediately, then poll
      checkStreamAvailability(stream);
      checkIntervals.current[stream.id] = setInterval(() => {
        checkStreamAvailability(stream);
      }, 3000);
    },
    [checkStreamAvailability]
  );

  // When streams update, start/stop availability polling for active/inactive streams
  useEffect(() => {
    if (stream && stream?.status === "active") {
      startStreamCheck(stream);
    }
    return () => {
      Object.values(checkIntervals.current).forEach(clearInterval);
      checkIntervals.current = {} as Record<number, NodeJS.Timeout>;
    };
  }, [stream, startStreamCheck]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={FortixLogo} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={handleRefresh} style={styles.iconButton}>
            <Ionicons name="refresh" size={20} color="#00BCD4" />
          </Pressable>
          <Pressable onPress={logout} style={styles.iconButton}>
            <Ionicons name="share-outline" size={20} color="#999" />
          </Pressable>
        </View>
      </View>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#00BCD4" />
        </View>
      )}

      {!loading && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Camera title row */}
          <View style={styles.cameraHeader}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </Pressable>
            <View style={styles.cameraHeaderText}>
              <Text style={styles.cameraTitle}>{cameraName}</Text>
              {stream && (
                <View style={styles.cameraLocationRow}>
                  <Ionicons
                    name="location"
                    size={14}
                    color="#9CA3AF"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.cameraLocation}>
                    {stream.site?.location || "Unknown Location"}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{statusText}</Text>
            </View>
          </View>

          {/* Video */}
          {stream && (
            <View style={styles.videoWrapper}>
              <LiveStreamPlayer
                stream={stream}
                streamUrl={availability[stream?.id]?.streamUrl}
                showCardDetails={false}
                showLiveOnlineTag={false}
                timestampTop={true}
                showBusinessCaseLabel={false}
                showCameraID={true}
              />
            </View>
          )}

          {/* Error message */}
          {error && (
            <Text style={styles.errorTextInline}>{error}</Text>
          )}

          {/* Camera Information Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Camera Information</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.infoValue, styles.infoValueAccent]}>
                {statusText}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Stream Type</Text>
              <Text style={styles.infoValue}>{streamType}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Business Use Case</Text>
              <Text style={[styles.infoValue, styles.infoValueAccent]}>
                {businessUseCase}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>IP Address</Text>
              <Text style={[styles.infoValue, styles.infoValueAccent]}>
                {ipAddress}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>FPS</Text>
              <Text style={styles.infoValue}>{fps}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={[styles.infoValue, styles.infoValueAccent]}>
                {lastUpdated}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      <BottomNav activeTab="cameras" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 160,
    height: 40,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 6,
    marginRight: 6,
  },
  cameraHeaderText: {
    flex: 1,
  },
  cameraTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  cameraLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  cameraLocation: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  statusPill: {
    backgroundColor: "#00BCD4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  statusPillText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "600",
  },
  videoWrapper: {
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: "#111111",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  infoTitle: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  infoLabel: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  infoValue: {
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "500",
  },
  infoValueAccent: {
    color: "#00BCD4",
  },
  errorTextInline: {
    color: "#F87171",
    marginBottom: 12,
  },
});

