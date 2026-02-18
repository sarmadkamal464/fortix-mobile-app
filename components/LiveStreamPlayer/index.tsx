// components/LiveStreamPlayer.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
  ScaledSize,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";
import {
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Stream } from "@/lib/types/streaming";

type Props = {
  stream: Stream;
  streamUrl: string | undefined;
  onPress?: () => void;
  showCardDetails?: boolean;
  isExpand?: boolean;
  showLiveOnlineTag?: boolean;
  timestampTop?: boolean;
  showBusinessCaseLabel?: boolean;
  showCameraID?: boolean
};

export default function LiveStreamPlayer({
  stream,
  streamUrl,
  onPress,
  showCardDetails = true,
  isExpand = true,
  showLiveOnlineTag = true,
  timestampTop = false,
  showBusinessCaseLabel = true,
  showCameraID = false
}: Props) {
  const videoRef = useRef<Video>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensions, setDimensions] = useState<ScaledSize>(
    Dimensions.get("window")
  );
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const scale = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return `${month}/${day}/${year} ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const businessCaseType = stream.business_case?.name || "UNKNOWN";
  const isOnline = stream.status === "active";
  const isLive = stream.status === "active"; 
  const siteName = stream.video_source?.name || "Unknown Site";
  const locationInfo = `Site ${stream?.site?.name ||""}`;

  const onPinchEvent = (event: PinchGestureHandlerGestureEvent) => {
    scale.value = event.nativeEvent.scale;
  };

  const onPinchEnd = () => {
    scale.value = withTiming(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const updateDimensions = () => {
    setDimensions(Dimensions.get("window"));
  };

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      "change",
      updateDimensions
    );
    return () => subscription?.remove();
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      } else {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      }
      setIsFullscreen((prev) => !prev);
    } catch (error) {
      console.warn("Error toggling fullscreen:", error);
    }
  };

  const { width, height } = dimensions;
  const videoWidth = isFullscreen ? width : width;
  const videoHeight = isFullscreen ? height : width * (9 / 16);

  return (
    <Pressable
      style={styles.cardContainer}
    >
    <View style={styles.videoContainer}>
      <PinchGestureHandler onGestureEvent={onPinchEvent} onEnded={onPinchEnd}>
        <Animated.View
          style={[
            styles.animatedContainer,
            { width: videoWidth, height: videoHeight },
            animatedStyle,
          ]}
        >
          {stream.status == "active" && streamUrl && <Video
            ref={videoRef}
            source={{ uri: streamUrl }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isMuted={false}
            style={{ width: videoWidth, height: videoHeight }}
            onError={(error) => {
              setHasError(true)
            }}
            onLoadStart={() => {
              setHasError(false);
              setIsBuffering(true);
            }}
            onReadyForDisplay={() => setIsBuffering(false)}
          />}

            {/* Business Case Label - Top Left */}
            {showBusinessCaseLabel && <View style={styles.businessCaseLabel}>
              <Text style={styles.businessCaseText}>{businessCaseType}</Text>
            </View>}

            {/* Status Indicators - Top Right */}
            {showLiveOnlineTag && <View style={styles.statusContainer}>
              {isLive && (
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
              {isOnline && (
                <View style={styles.onlineIndicator}>
                  <Text style={styles.onlineText}>ONLINE</Text>
                </View>
              )}
            </View>}

            {/* Timestamp - Bottom Left */}
            <View style={[styles.timestampContainer, timestampTop && styles.timestampTop]}>
              <Text style={styles.timestampText}>{formatTimestamp(currentTime)}</Text>
            </View>

            {showCameraID && <View style={styles.cameraCaseLabel}>
              <Text style={styles.cameraCaseText}>Camera ID: {stream.video_source.id}</Text>
            </View>}

            {isBuffering && stream.status == "active" && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
            {stream.status == "inactive" && (
              <View style={styles.inactiveOverlay}>
                <Text style={styles.inactiveText}>Stream is inactive</Text>
              </View>
            )}
            {/* {hasError && stream.status == "active" && (
              <View style={styles.errorOverlay}>
                <Text style={styles.errorText}>Failed to load stream</Text>
              </View>
            )} */}
          </Animated.View>
        </PinchGestureHandler>

        {/* Fullscreen Button - Bottom Right of Video */}
        {isExpand && <Pressable
          style={styles.fullscreenButton}
          onPress={handleToggleFullscreen}
        >
          <Ionicons
            name={isFullscreen ? "contract-outline" : "expand-outline"}
            size={24}
            color="white"
          />
        </Pressable>}
      </View>

      {/* Card Details Below Video */}
      {showCardDetails && (
        <View style={styles.cardDetails}>
          <View style={styles.cardDetailsLeft}>
            <Text style={styles.cardTitle}>{siteName}</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.locationText}>{locationInfo}</Text>
            </View>
          </View>
          <Pressable style={styles.navigationButton} onPress={onPress}>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333",
  },
  videoContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    position: "relative",
    width: "100%",
  },
  animatedContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  businessCaseLabel: {
    position: "absolute",
    top: 12,
    left: 20,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#00BCD4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    zIndex: 10,
  },
  businessCaseText: {
    color: "#00BCD4",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cameraCaseLabel: {
    position: "absolute",
    bottom: 12,
    left: 20,
    backgroundColor: "#000",
    borderWidth: 0.5,
    borderColor: "#00BCD4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    zIndex: 10,
  },
  cameraCaseText: {
    color: "#00BCD4",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  statusContainer: {
    position: "absolute",
    top: 12,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff0000",
  },
  liveText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  onlineIndicator: {
    backgroundColor: "#00BCD4",
    color: "#000",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  onlineText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "600",
  },
  timestampContainer: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  timestampTop: {
    top: 12,
  },
  timestampText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 5,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,0,0,0.3)",
    zIndex: 5,
  },
  errorText: {
    color: "#fff",
    fontWeight: "bold",
  },
  inactiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 5,
  },
  inactiveText: {
    color: "#fff",
    fontWeight: "bold",
  },
  fullscreenButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    borderRadius: 4,
    zIndex: 10,
  },
  cardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1a1a1a",
  },
  cardDetailsLeft: {
    flex: 1,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    color: "#666",
    fontSize: 14,
  },
  navigationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
});
