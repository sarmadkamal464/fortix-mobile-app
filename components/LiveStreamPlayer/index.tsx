// app/live-monitoring.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import * as ScreenOrientation from "expo-screen-orientation";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import {
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

export default function LiveMonitoringScreen() {
  const videoRef = useRef<Video>(null);
  const { width, height } = useWindowDimensions();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Shared value for zoom (default scale = 1)
  const scale = useSharedValue(1);

  // Update scale during pinch gesture
  const onPinchEvent = (event: PinchGestureHandlerGestureEvent) => {
    scale.value = event.scale;
  };

  // Reset zoom when gesture ends
  const onPinchEnd = () => {
    scale.value = withTiming(1);
  };

  // Apply animated style using the shared scale value
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Calculate video dimensions based on fullscreen state:
  // - Portrait (default): 16:9 video based on device width
  // - Landscape (fullscreen): swap width/height accordingly
  const videoWidth = isFullscreen ? height : width;
  const videoHeight = isFullscreen ? width : width * (9 / 16);

  // Toggle fullscreen by locking the screen orientation
  const handleToggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        // Lock to LANDSCAPE when entering fullscreen
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      } else {
        // Lock to PORTRAIT when exiting fullscreen
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      }
      setIsFullscreen((prev) => !prev);
    } catch (error) {
      console.warn("Error toggling fullscreen:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Configure header for the screen via expo-router's Stack.Screen */}
      <Stack.Screen options={{ title: "Live Monitoring" }} />
      <View style={styles.screenContent}>
        <Text style={styles.title}>Live Monitoring</Text>
        <View style={styles.videoContainer}>
          {/* Wrap the video in a PinchGestureHandler */}
          <PinchGestureHandler
            onGestureEvent={onPinchEvent}
            onEnded={onPinchEnd}
          >
            <Animated.View
              style={[
                styles.animatedContainer,
                { width: videoWidth, height: videoHeight },
                animatedStyle,
              ]}
            >
              <Video
                ref={videoRef}
                source={{
                  uri: "https://r786r1wr2wd557-8000.proxy.runpod.net/streams/39/stream.m3u8", // Replace with your HLS stream URL
                }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isMuted={false}
                style={{ width: videoWidth, height: videoHeight }}
              />
            </Animated.View>
          </PinchGestureHandler>
          {/* Fullscreen toggle button overlay */}
          {/* <Pressable
            style={styles.fullscreenButton}
            onPress={handleToggleFullscreen}
          >
            <Ionicons
              name={isFullscreen ? "contract-outline" : "expand-outline"}
              size={24}
              color="white"
            />
          </Pressable> */}
        </View>
        <Text style={styles.description}>
          Pinch to zoom the video. Tap the button for fullscreen.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
    alignSelf: "center",
  },
  videoContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    overflow: "hidden",
    alignSelf: "center",
    marginBottom: 16,
    position: "relative",
  },
  animatedContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    borderRadius: 4,
  },
  description: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
