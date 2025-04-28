import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  PanGestureHandlerGestureEvent,
  PinchGestureHandlerGestureEvent,
  TapGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withTiming,
} from "react-native-reanimated";
import { useToast } from "@/lib/utils/toast";

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  imageUrl?: string;
  title?: string | null;
  body?: string | null;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  imageUrl,
  title,
  body,
}) => {
  const [loading, setLoading] = useState(true);
  const { successToast, errorToast } = useToast();

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const pinchHandler =
    useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
      onActive: (event) => {
        scale.value = Math.max(1, Math.min(event.scale, 3));
      },
      onEnd: () => {
        if (scale.value <= 1) {
          scale.value = withTiming(1);
          translateX.value = withTiming(0);
          translateY.value = withTiming(0);
        }
      },
    });

  const panHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number; startY: number }
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      if (scale.value > 1) {
        translateX.value = ctx.startX + event.translationX;
        translateY.value = ctx.startY + event.translationY;
      }
    },
  });

  const onDoubleTap = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onActive: () => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      } else {
        scale.value = withTiming(2);
      }
    },
  });

  const handleDownload = async (imageUrl: string | undefined) => {
    if (!imageUrl) {
      errorToast("No image URL provided.");
      return;
    }

    if (typeof imageUrl !== "string") {
      errorToast("Invalid image URL.");
      console.error("Invalid image URL:", imageUrl);
      return;
    }

    try {
      // Request permissions (Android 10+)
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        errorToast("Media library permission not granted.");
        return;
      }

      // Save to the document directory (Scoped Storage)
      const fileUri =
        FileSystem.documentDirectory + `downloaded_${Date.now()}.jpg`;

      console.log("Downloading image from:", imageUrl);

      // Download the image
      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
      console.log("Download successful:", downloadResult.uri);
      if (!downloadResult?.uri) {
        errorToast("Image download failed.");
        return;
      }

      // Save to gallery
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      const album = await MediaLibrary.getAlbumAsync("Download");

      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync("Download", asset, false);
      }

      successToast("Image saved to gallery!");
    } catch (error: any) {
      console.error("Download error:", error);
      errorToast(`Download error: ${error.message}`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <View style={styles.headerButtons}>
              {imageUrl && (
                <Pressable
                  style={styles.iconButton}
                  onPress={() => handleDownload(imageUrl)}
                >
                  <Ionicons name="download" size={26} color="#fff" />
                </Pressable>
              )}
              <Pressable style={styles.iconButton} onPress={onClose}>
                <Ionicons name="close" size={28} color="#fff" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
              {imageUrl && (
                <TapGestureHandler
                  numberOfTaps={2}
                  maxDelayMs={250}
                  onGestureEvent={onDoubleTap}
                >
                  <Animated.View>
                    <PanGestureHandler onGestureEvent={panHandler}>
                      <Animated.View>
                        <PinchGestureHandler onGestureEvent={pinchHandler}>
                          <Animated.View
                            style={[styles.imageContainer, animatedStyle]}
                          >
                            {loading && (
                              <ActivityIndicator
                                style={styles.loader}
                                size="large"
                                color="#fff"
                              />
                            )}
                            <Image
                              source={{ uri: imageUrl }}
                              style={styles.image}
                              resizeMode="contain"
                              onLoadEnd={() => setLoading(false)}
                            />
                          </Animated.View>
                        </PinchGestureHandler>
                      </Animated.View>
                    </PanGestureHandler>
                  </Animated.View>
                </TapGestureHandler>
              )}

              {title && <Text style={styles.title}>{title}</Text>}
              {body && <Text style={styles.body}>{body}</Text>}
            </ScrollView>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default NotificationModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
  },
  popup: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerButtons: {
    position: "absolute",
    top: 20,
    right: 20,
    flexDirection: "row",
    zIndex: 10,
  },
  iconButton: {
    marginLeft: 12,
    padding: 8,
  },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 10,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 20,
  },
  loader: {
    position: "absolute",
    zIndex: 2,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  body: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
  },
});
