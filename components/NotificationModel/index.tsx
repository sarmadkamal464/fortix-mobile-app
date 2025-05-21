import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useToast } from "@/lib/utils/toast";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const [imageError, setImageError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { successToast, errorToast } = useToast();
  const insets = useSafeAreaInsets();

  // Animation values
  const translateY = useSharedValue(-SCREEN_HEIGHT);
  const gestureY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateYImage = useSharedValue(0);

  // Reset states when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setLoading(true);
      setImageError(false);
    }
  }, [imageUrl]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
    } else {
      translateY.value = withTiming(-SCREEN_HEIGHT, {
        duration: 300,
      });
    }
  }, [visible]);

  const panGestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startY: number }
  >({
    onStart: (_, ctx) => {
      ctx.startY = translateY.value;
      isDragging.value = true;
    },
    onActive: (event, ctx) => {
      gestureY.value = ctx.startY + event.translationY;
      translateY.value = Math.max(0, gestureY.value);
    },
    onEnd: (event) => {
      isDragging.value = false;
      if (event.velocityY > 500 || translateY.value > SCREEN_HEIGHT * 0.3) {
        translateY.value = withTiming(SCREEN_HEIGHT, {
          duration: 300,
        }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0, {
          damping: 15,
          stiffness: 100,
        });
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: interpolate(
          translateY.value,
          [-SCREEN_HEIGHT, 0],
          [0.8, 1],
          Extrapolate.CLAMP
        ) },
      ],
      paddingTop: insets.top,
    };
  });

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateYImage.value },
    ],
  }));

  const pinchHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
    onActive: (event) => {
      scale.value = Math.max(1, Math.min(event.scale, 3));
    },
    onEnd: () => {
      if (scale.value <= 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateYImage.value = withTiming(0);
      }
    },
  });

  const panHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number; startY: number }
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateYImage.value;
    },
    onActive: (event, ctx) => {
      if (scale.value > 1) {
        translateX.value = ctx.startX + event.translationX;
        translateYImage.value = ctx.startY + event.translationY;
      }
    },
  });

  const onDoubleTap = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onActive: () => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateYImage.value = withTiming(0);
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

    try {
      setDownloading(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        errorToast("Media library permission not granted.");
        setDownloading(false);
        return;
      }

      const fileUri = FileSystem.documentDirectory + `downloaded_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
      
      if (!downloadResult?.uri) {
        errorToast("Image download failed.");
        setDownloading(false);
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      const album = await MediaLibrary.getAlbumAsync("Download");

      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync("Download", asset, false);
      }

      successToast("Image saved to gallery!");
      setDownloading(false);
      onClose();
    } catch (error: any) {
      console.error("Download error:", error);
      errorToast(`Download error: ${error.message}`);
      setDownloading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <PanGestureHandler onGestureEvent={panGestureHandler}>
        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          <View style={styles.handle} />
          <View style={[styles.content, { paddingBottom: insets.bottom }]}>
            <View style={[styles.headerButtons, { top: insets.top + 10 }]}>
              {imageUrl && !imageError && (
                <Pressable
                  style={[styles.iconButton, downloading && styles.disabledButton]}
                  onPress={() => !downloading && handleDownload(imageUrl)}
                  disabled={downloading}
                >
                  {downloading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="download" size={26} color="#fff" />
                  )}
                </Pressable>
              )}
              <Pressable 
                style={styles.iconButton} 
                onPress={onClose}
                disabled={downloading}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </Pressable>
            </View>

            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + 20 }
              ]}
              showsVerticalScrollIndicator={false}
            >
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
                            style={[styles.imageContainer, imageAnimatedStyle]}
                          >
                            {loading && (
                              <View style={styles.loaderContainer}>
                                <ActivityIndicator
                                  size="large"
                                  color="#fff"
                                />
                                <Text style={styles.loadingText}>Loading image...</Text>
                              </View>
                            )}
                            {imageError ? (
                              <View style={styles.errorContainer}>
                                <Ionicons name="image-outline" size={40} color="#666" />
                                <Text style={styles.errorText}>Failed to load image</Text>
                              </View>
                            ) : (
                              <Image
                                source={{ uri: imageUrl }}
                                style={styles.image}
                                resizeMode="contain"
                                onLoadEnd={() => setLoading(false)}
                                onError={() => {
                                  setLoading(false);
                                  setImageError(true);
                                }}
                              />
                            )}
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
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

export default NotificationModal;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#666",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  content: {
    padding: 20,
  },
  headerButtons: {
    position: "absolute",
    right: 10,
    flexDirection: "row",
    zIndex: 10,
  },
  iconButton: {
    marginLeft: 12,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  scrollView: {
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  scrollContent: {
    paddingTop: 40,
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
  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  errorText: {
    color: "#666",
    marginTop: 10,
    fontSize: 14,
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
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
    }),
  },
  body: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 10,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
    }),
  },
});
