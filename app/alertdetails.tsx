import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Image, FlatList } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAlarmManagement } from '@/lib/hooks/alarmCenter';
import { Alarm } from '@/lib/types/alarm';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { getTimeAgo } from './alerts';
import BottomNav from '@/components/BottomNav';
import FortixLogo from '@/assets/images/fortix-logo.png';
import { useAuth } from '@/lib/hooks/auth';

const AlertDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { logout } = useAuth();
  const { fetchAlarmById, loading, error } = useAlarmManagement();
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [activeTab, setActiveTab] = useState<'stills' | 'clip'>('stills');
  const [Images, setImages] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const videoRef = useRef<Video>(null);

  const loadAlarm = async () => {
    const data = await fetchAlarmById(id as string);
    if (data) {
      setAlarm(data);
      const images = [data.image_s3_url, ...(data?.image_urls || [])].filter(Boolean);
      if (images.length > 0) {
        setImages(images);
        setSelectedImageIndex(0);
      }
    }
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex < Images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const selectedImage = Images[selectedImageIndex] || null;

  useEffect(() => {
    if (id) {
      loadAlarm();
    }
  }, [id]);

  const handleRefresh = () => {
    loadAlarm();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !alarm) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Alarm not found.'}</Text>
      </View>
    );
  }

  const renderStills = () => (
    <View style={styles.contentContainer}>
      <View style={styles.mainImageContainer}>
        {selectedImage && (
          <Image source={{ uri: selectedImage }} style={styles.mainImage} />
        )}

        {/* Navigation Arrows */}
        {Images.length > 1 && selectedImageIndex > 0 && (
          <Pressable style={styles.navArrowLeft} onPress={handlePreviousImage}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
        )}
        {Images.length > 1 && selectedImageIndex < Images.length - 1 && (
          <Pressable style={styles.navArrowRight} onPress={handleNextImage}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </Pressable>
        )}

        {/* Top Left Overlay */}
        <View style={styles.imageOverlayTop}>
          <View style={styles.overlayContent}>
            <Text style={styles.overlayTitle}>DETECTION INCIDENT ID: {String(alarm.id).padStart(6, '0')}</Text>
            <Text style={styles.overlayText}>CAM: {alarm.video_source_name || 'N/A'}</Text>
            <Text style={styles.overlayText}>IP: {alarm.video_source_id || 'N/A'}</Text>
            <Text style={styles.overlayText}>LOC: {alarm.business_case_name || 'N/A'}</Text>
            <Text style={styles.overlayText}>SITE: Site 1</Text>
          </View>
        </View>

        {/* Bottom Right Footer */}
        <View style={styles.imageFooter}>
          <View style={styles.footerContent}>
            <Text style={styles.timeAgo}>{getTimeAgo(alarm.created_at)}</Text>
            <Text style={styles.exportText}>STILL EXPORT {selectedImageIndex + 1}/{Images.length}</Text>
          </View>
        </View>
      </View>
      <FlatList
        horizontal
        data={Images}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => setSelectedImageIndex(index)}>
            <View style={[styles.thumbnailContainer, selectedImageIndex === index && styles.selectedThumbnail]}>
              <Image source={{ uri: item }} style={styles.thumbnail} />
            </View>
          </Pressable>
        )}
        keyExtractor={(item, index) => index.toString()}
        style={styles.thumbnailList}
        contentContainerStyle={styles.thumbnailListContent}
      />
    </View>
  );

  const renderClip = () => {
    const videoUri = alarm.video_s3_url || '';

    return (
      <View style={[styles.contentContainer, styles.videoContentContainer]}>
        {videoUri ? (
          <Video
            ref={videoRef}
            style={styles.video}
            source={{ uri: videoUri }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay
            isMuted={false}
          />

        ) : (
          <View style={styles.mainImageContainer}>
            <View style={styles.imageOverlay}>
              <Text style={styles.overlayText}>No clip available for this alarm.</Text>
            </View>
          </View>
        )}
        <View style={styles.clipOverlay}>
          <Text style={styles.overlayText}>CLIP PLAYBACK: 0.75X - 2.0X</Text>
          <Text style={styles.overlayText}>DETECTION INCIDENT ID: {alarm.id}</Text>
          <Text style={styles.overlayText}>
            {alarm.business_case_type ? alarm.business_case_type.toUpperCase() : 'UNKNOWN'}
          </Text>
        </View>
      </View>
    );
  };

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

      <View style={styles.tabContainer}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerBody}>
          <Pressable
            style={[styles.tabButton, activeTab === 'stills' && styles.activeTabButton]}
            onPress={() => setActiveTab('stills')}
          >
            <Ionicons
              name="camera-outline"
              size={18}
              color={activeTab === 'stills' ? '#fff' : '#999'}
            />
            <Text style={[styles.tabButtonText, activeTab === 'stills' && styles.activeTabButtonText]}>
              STILLS
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'clip' && styles.activeTabButton]}
            onPress={() => setActiveTab('clip')}
          >
            <Ionicons
              name="play-outline"
              size={18}
              color={activeTab === 'clip' ? '#fff' : '#999'}
            />
            <Text style={[styles.tabButtonText, activeTab === 'clip' && styles.activeTabButtonText]}>
              CLIP
            </Text>
          </Pressable>
        </View>
        <View>
        </View>
      </View>
      {activeTab === 'stills' ? renderStills() : renderClip()}

      <BottomNav activeTab="alerts" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  backButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: '#333',
    gap: 6,
  },
  // headerCenter: {
  //   flexBasis: "75%",
  // },
  headerBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 4,
    width: "auto",
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 8,
  },
  activeTabButton: {
    backgroundColor: '#00BCD4',
  },
  tabButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  videoContentContainer: {
    maxHeight: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
  mainImageContainer: {
    width: '100%',
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  navArrowLeft: {
    position: 'absolute',
    left: 10,
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(51, 51, 51, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  navArrowRight: {
    position: 'absolute',
    right: 10,
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(51, 51, 51, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  imageOverlayTop: {
    position: 'absolute',
    top: 10,
    left: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bracketLeft: {
    width: 4,
    height: 60,
    backgroundColor: '#00BCD4',
    marginRight: 4,
  },
  overlayContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  overlayTitle: {
    color: '#00BCD4',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  overlayText: {
    color: '#fff',
    fontSize: 11,
    marginBottom: 1,
  },
  bracketRight: {
    width: 4,
    height: 60,
    backgroundColor: '#00BCD4',
    marginLeft: 4,
  },
  imageFooter: {
    position: 'absolute',
    bottom: 20,
    right: 5,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  footerBracketLeft: {
    width: 4,
    height: 40,
    backgroundColor: '#00BCD4',
    marginRight: 4,
  },
  footerContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
  },
  timeAgo: {
    color: '#fff',
    fontSize: 11,
    marginBottom: 2,
  },
  exportText: {
    color: '#ff0000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  footerBracketRight: {
    width: 4,
    height: 40,
    backgroundColor: '#00BCD4',
    marginLeft: 4,
  },
  thumbnailList: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  thumbnailListContent: {
    alignItems: 'center',
  },
  thumbnailContainer: {
    marginHorizontal: 5,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThumbnail: {
    borderColor: '#00BCD4',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  video: {
    width: '100%',
    height: "50%",
    flex: 1,
  },
  imageOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 5,
  },
  clipOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 5,
  },
});

export default AlertDetailScreen;
