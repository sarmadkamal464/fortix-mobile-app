// components/LiveStreamPlayer.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
  ScaledSize,
} from "react-native";
import { WebView } from "react-native-webview";
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
  showCameraID?: boolean;
};

/** Build the HLS.js HTML player injected into WebView */
function buildHlsHtml(streamUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
      display: block;
    }
  </style>
</head>
<body>
  <video id="video" autoplay playsinline muted="false"></video>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js"></script>
  <script>
    var video = document.getElementById('video');
    var src = ${JSON.stringify(streamUrl)};

    function startPlayer(url) {
      if (Hls.isSupported()) {
        var hls = new Hls({
          enableWorker: false,
          lowLatencyMode: true,
          backBufferLength: 90,
          xhrSetup: function(xhr) {
            xhr.setRequestHeader('Cache-Control', 'no-cache');
            xhr.setRequestHeader('Pragma', 'no-cache');
          }
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          video.play().catch(function(){});
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ready');
        });
        hls.on(Hls.Events.ERROR, function(event, data) {
          if (data.fatal) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage('error:' + data.type);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (iOS Safari)
        video.src = url;
        video.addEventListener('loadedmetadata', function() {
          video.play().catch(function(){});
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ready');
        });
      }
    }

    startPlayer(src);
  </script>
</body>
</html>`;
}

export default function LiveStreamPlayer({
  stream,
  streamUrl,
  onPress,
  showCardDetails = true,
  isExpand = true,
  showLiveOnlineTag = true,
  timestampTop = false,
  showBusinessCaseLabel = true,
  showCameraID = false,
}: Props) {
  const isOnline = stream.status === "active";
  const isLive = stream.status === "active";
  const businessCaseType = stream.business_case?.name || "UNKNOWN";
  const siteName = stream.video_source?.name || "Unknown Site";
  const locationInfo = `Site ${stream?.site?.name || ""}`;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensions, setDimensions] = useState<ScaledSize>(
    Dimensions.get("window")
  );
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const scale = useSharedValue(1);
  const webViewKey = useRef(0); // increment to force WebView remount on URL change
  const lastStreamUrl = useRef<string | null>(null);

  // Remount WebView when the base stream path changes
  const getBasePath = (url: string) => url.split("?")[0];
  if (
    streamUrl &&
    lastStreamUrl.current !== null &&
    getBasePath(streamUrl) !== getBasePath(lastStreamUrl.current)
  ) {
    webViewKey.current += 1;
  }
  if (streamUrl) lastStreamUrl.current = streamUrl;

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
    const subscription = Dimensions.addEventListener("change", updateDimensions);
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

  // Derive the stream server origin for baseUrl (fixes CORS on Android WebView)
  const streamBaseUrl = streamUrl
    ? (() => {
      try {
        const u = new URL(streamUrl);
        return `${u.protocol}//${u.host}`;
      } catch {
        return undefined;
      }
    })()
    : undefined;

  const hlsHtml =
    isOnline && streamUrl ? buildHlsHtml(streamUrl) : null;

  return (
    <Pressable style={styles.cardContainer}>
      <View style={styles.videoContainer}>
        <PinchGestureHandler onGestureEvent={onPinchEvent} onEnded={onPinchEnd}>
          <Animated.View
            style={[
              styles.animatedContainer,
              { width: videoWidth, height: videoHeight },
              animatedStyle,
            ]}
          >
            {/* HLS.js WebView player */}
            {isOnline && hlsHtml ? (
              <WebView
                key={webViewKey.current}
                source={{ html: hlsHtml, baseUrl: streamBaseUrl }}
                style={{ width: videoWidth, height: videoHeight, backgroundColor: "#000" }}
                originWhitelist={["*"]}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                mixedContentMode="always"
                onMessage={(event) => {
                  const msg = event.nativeEvent.data;
                  if (msg === "ready") {
                    setIsBuffering(false);
                  } else if (msg.startsWith("error:")) {
                    console.log("HLS ERROR:", msg);
                    setIsBuffering(false);
                  }
                }}
                onLoadStart={() => setIsBuffering(true)}
                onLoadEnd={() => {
                  // WebView loaded — actual stream ready fires via postMessage
                }}
                onError={(e) => {
                  console.log("WEBVIEW ERROR:", e.nativeEvent);
                  setIsBuffering(false);
                }}
                scrollEnabled={false}
                bounces={false}
                overScrollMode="never"
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              />
            ) : null}

            {/* Business Case Label - Top Left */}
            {showBusinessCaseLabel && (
              <View style={styles.businessCaseLabel}>
                <Text style={styles.businessCaseText}>{businessCaseType}</Text>
              </View>
            )}

            {/* Status Indicators - Top Right */}
            {showLiveOnlineTag && (
              <View style={styles.statusContainer}>
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
              </View>
            )}

            {/* Timestamp - Bottom Left */}
            <View
              style={[
                styles.timestampContainer,
                timestampTop && styles.timestampTop,
              ]}
            >
              <Text style={styles.timestampText}>
                {formatTimestamp(currentTime)}
              </Text>
            </View>

            {showCameraID && (
              <View style={styles.cameraCaseLabel}>
                <Text style={styles.cameraCaseText}>
                  Camera ID: {stream.video_source.id}
                </Text>
              </View>
            )}

            {/* Loading spinner while stream initialises */}
            {isBuffering && isOnline && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}

            {/* Inactive overlay */}
            {stream.status === "inactive" && (
              <View style={styles.inactiveOverlay}>
                <Text style={styles.inactiveText}>Stream is inactive</Text>
              </View>
            )}
          </Animated.View>
        </PinchGestureHandler>

        {/* Fullscreen Button */}
        {isExpand && (
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
        )}
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
    overflow: "hidden",
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
    bottom: undefined,
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
