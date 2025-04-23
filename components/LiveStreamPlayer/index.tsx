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

type Props = {
  streamUrl: string;
};

export default function LiveStreamPlayer({ streamUrl }: Props) {
  const videoRef = useRef<Video>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensions, setDimensions] = useState<ScaledSize>(
    Dimensions.get("window")
  );
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);

  const scale = useSharedValue(1);

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
    <View style={styles.videoContainer}>
      <PinchGestureHandler onGestureEvent={onPinchEvent} onEnded={onPinchEnd}>
        <Animated.View
          style={[
            styles.animatedContainer,
            { width: videoWidth, height: videoHeight },
            animatedStyle,
          ]}
        >
          <Video
            ref={videoRef}
            source={{ uri: streamUrl }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isMuted={false}
            style={{ width: videoWidth, height: videoHeight }}
            onError={() => setHasError(true)}
            onLoadStart={() => {
              setHasError(false);
              setIsBuffering(true);
            }}
            onReadyForDisplay={() => setIsBuffering(false)}
          />
          {isBuffering && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          {hasError && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>Failed to load stream</Text>
            </View>
          )}
        </Animated.View>
      </PinchGestureHandler>

      <Pressable
        style={styles.fullscreenButton}
        onPress={handleToggleFullscreen}
      >
        <Ionicons
          name={isFullscreen ? "contract-outline" : "expand-outline"}
          size={24}
          color="white"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    overflow: "hidden",
    marginBottom: 20,
    position: "relative",
  },
  animatedContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,0,0,0.3)",
  },
  errorText: {
    color: "#fff",
    fontWeight: "bold",
  },
  fullscreenButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    borderRadius: 4,
  },
});
