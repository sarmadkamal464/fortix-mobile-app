// app/live-monitoring.tsx
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  Image,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/hooks/auth";
import LiveStreamPlayer from "@/components/LiveStreamPlayer";
import BottomNav from "@/components/BottomNav";
import useFetchStreams from "@/lib/streaming";
import { Stack, useRouter } from "expo-router";
import { StreamState, Stream, RealTimePreviewFiltersQuery } from "@/lib/types/streaming";
import FortixLogo from "@/assets/images/fortix-logo.png";

export default function LiveMonitoringScreen() {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<StreamState>({
    streams: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
    loading: false,
    error: null,
    filters: {
      sites: [],
      businessCases: [],
    },
    activeStreams: 0,
    inactiveStreams: 0,
  });
  const checkIntervals = useRef<Record<number, NodeJS.Timeout>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<number | null>(null);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [showUseCaseDropdown, setShowUseCaseDropdown] = useState(false);
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [availability, setAvailability] = useState<Record<number, { streamUrl?: string; isLoading: boolean }>>({});
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevFiltersStrRef = useRef<string>("");

  const fetchStreams = useFetchStreams(setState);
  const router = useRouter();

  // Build HLS stream URL similar to web RealTimePreview logic
  const getStreamUrl = useCallback((stream: Stream) => {
    // Prefer model_url from business case if available (may already include pod / base URL)
    const modelUrl =
      ((stream as any).business_case?.model_url as string);

    const base = modelUrl.endsWith("/") ? modelUrl : `${modelUrl}/`;

    // Add cache-busting query params to avoid stale HLS playlists
    const timestamp = Date.now();
    const cacheBust = Math.random();

    return `${base}streams/${stream.id}/stream.m3u8?t=${timestamp}&nocache=${cacheBust}`;
  }, []);

  useEffect(() => {
    const filtersStr = JSON.stringify({ selectedSiteId, selectedUseCaseId });

    if (prevFiltersStrRef.current !== filtersStr && page !== 1) {
      prevFiltersStrRef.current = filtersStr;
      setPage(1);
      setAllStreams([]);
      setHasMore(true);
    } else if (prevFiltersStrRef.current !== filtersStr) {
      prevFiltersStrRef.current = filtersStr;
    }
  }, [selectedSiteId, selectedUseCaseId, page]);

  useEffect(() => {
    const currentFilters: RealTimePreviewFiltersQuery = {
      page: page,
      limit: state.pagination.limit,
      ...(searchQuery && { search: searchQuery }),
      ...(selectedSiteId && { site_id: selectedSiteId }),
      ...(selectedUseCaseId && { business_case_id: selectedUseCaseId }),
    };

    if (page === 1) {
      setAllStreams([]);
      setHasMore(true);
      fetchStreams(currentFilters);
    } else {
      setLoadingMore(true);
      fetchStreams(currentFilters);
    }
  }, [selectedSiteId, selectedUseCaseId, page, state.pagination.limit]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      setAllStreams([]);
      setHasMore(true);
      const currentFilters: RealTimePreviewFiltersQuery = {
        page: 1,
        limit: state.pagination.limit,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedSiteId && { site_id: selectedSiteId }),
        ...(selectedUseCaseId && { business_case_id: selectedUseCaseId }),
      };
      fetchStreams(currentFilters);
    }, 500);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    if (state.loading) {
      return;
    }

    if (page === 1) {
      setAllStreams(state.streams);
    } else {
      setAllStreams((prev) => {
        const existingIds = new Set(prev.map((s) => s.id));
        const newStreams = state.streams.filter((s) => !existingIds.has(s.id));
        return [...prev, ...newStreams];
      });
      setLoadingMore(false);
    }

    if (state.pagination) {
      const totalPages = Math.ceil((state.pagination.total || 0) / state.pagination.limit);
      setHasMore(page < totalPages);
    }
  }, [state.streams, state.loading, page, state.pagination]);

  // Close dropdowns when filters section is hidden
  useEffect(() => {
    if (!showFilters) {
      setShowSiteDropdown(false);
      setShowUseCaseDropdown(false);
    }
  }, [showFilters]);

  const handleRefresh = () => {
    setPage(1);
    setAllStreams([]);
    setHasMore(true);
    const currentFilters: RealTimePreviewFiltersQuery = {
      page: 1,
      limit: state.pagination.limit,
      ...(searchQuery && { search: searchQuery }),
      ...(selectedSiteId && { site_id: selectedSiteId }),
      ...(selectedUseCaseId && { business_case_id: selectedUseCaseId }),
    };
    fetchStreams(currentFilters);
  };

  const loadMore = useCallback(() => {
    if (!state.loading && !loadingMore && hasMore && state.pagination) {
      const totalPages = Math.ceil((state.pagination.total || 0) / state.pagination.limit);
      if (page < totalPages) {
        setPage((prev) => prev + 1);
      }
    }
  }, [state.loading, loadingMore, hasMore, state.pagination, page]);

  const sites = state.filters?.sites || [];
  const useCases = state.filters?.businessCases || [];

  const selectedSiteName = useMemo(() => {
    return sites.find((s) => s.id === selectedSiteId)?.name || null;
  }, [sites, selectedSiteId]);

  const selectedUseCaseName = useMemo(() => {
    return useCases.find((uc) => uc.id === selectedUseCaseId)?.name || null;
  }, [useCases, selectedUseCaseId]);


  const { logout } = useAuth();

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
    allStreams.forEach((s) => {
      if (s.status === "active") {
        startStreamCheck(s);
      }
    });
    return () => {
      Object.values(checkIntervals.current).forEach(clearInterval);
      checkIntervals.current = {} as Record<number, NodeJS.Timeout>;
    };
  }, [allStreams, startStreamCheck]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Image source={FortixLogo} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#00BCD4" />
          </Pressable>
          <Pressable onPress={logout} style={styles.logoutButton}>
            <Ionicons name="share-outline" size={20} color="#999" />
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cameras..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <Pressable
          style={showFilters ? styles.activeFilterButton : styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="funnel-outline" size={20} color={`${showFilters ? "#000" : "#fff"}`} />
        </Pressable>
      </View>

      {/* Detailed Filters */}
      {showFilters && (
        <View style={styles.filtersSection}>
          <Text style={styles.filtersTitle}>Detailed Filters</Text>

          {/* Filter by Site */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>FILTER BY SITE</Text>
            <View style={styles.dropdownWrapper}>
              <Pressable
                style={[
                  styles.filterDropdown,
                  showSiteDropdown && styles.filterDropdownActive,
                ]}
                onPress={() => {
                  setShowSiteDropdown(!showSiteDropdown);
                  setShowUseCaseDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.filterDropdownText,
                    selectedSiteId !== null && styles.filterDropdownTextSelected,
                  ]}
                >
                  {selectedSiteName || "All Sites"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </Pressable>
              {showSiteDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled={true}
                  >
                    <Pressable
                      style={[
                        styles.dropdownOption,
                        !selectedSiteId && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedSiteId(null);
                        setPage(1);
                        setAllStreams([]);
                        setHasMore(true);
                        setShowSiteDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          !selectedSiteId && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        All Sites
                      </Text>
                    </Pressable>
                    {sites.map((option) => (
                      <Pressable
                        key={option.id}
                        style={[
                          styles.dropdownOption,
                          selectedSiteId === option.id && styles.dropdownOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedSiteId(option.id);
                          setPage(1);
                          setAllStreams([]);
                          setHasMore(true);
                          setShowSiteDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selectedSiteId === option.id && styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {option.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Filter by Use Case */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>FILTER BY USE CASE</Text>
            <View style={styles.dropdownWrapper}>
              <Pressable
                style={[
                  styles.filterDropdown,
                  showUseCaseDropdown && styles.filterDropdownActive,
                ]}
                onPress={() => {
                  setShowUseCaseDropdown(!showUseCaseDropdown);
                  setShowSiteDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.filterDropdownText,
                    selectedUseCaseId !== null && styles.filterDropdownTextSelected,
                  ]}
                >
                  {selectedUseCaseName || "All Use Cases"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </Pressable>
              {showUseCaseDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled={true}
                  >
                    <Pressable
                      style={[
                        styles.dropdownOption,
                        !selectedUseCaseId && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedUseCaseId(null);
                        setPage(1);
                        setAllStreams([]);
                        setHasMore(true);
                        setShowUseCaseDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          !selectedUseCaseId && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        All Use Cases
                      </Text>
                    </Pressable>
                    {useCases.map((option) => (
                      <Pressable
                        key={option.id}
                        style={[
                          styles.dropdownOption,
                          selectedUseCaseId === option.id && styles.dropdownOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedUseCaseId(option.id);
                          setPage(1);
                          setAllStreams([]);
                          setHasMore(true);
                          setShowUseCaseDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selectedUseCaseId === option.id && styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {option.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* System Status */}
      <View style={styles.systemStatusCard}>
        <View style={styles.systemStatusLeft}>
          <Text style={styles.systemStatusLabel}>SYSTEM STATUS</Text>
          <View style={styles.systemStatusRow}>
            <Text style={styles.systemStatusCount}>
              {state.activeStreams}/{(state.activeStreams || 0) + (state.inactiveStreams || 0)}
            </Text>
            <Text style={styles.systemStatusSubtext}> Cameras Online</Text>
          </View>
        </View>
        <View style={styles.systemStatusIcon}>
          <Ionicons name="wifi" size={24} color="#00BCD4" />
        </View>
      </View>

      {/* Streams List */}
      {state.loading && allStreams.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#14b8a6" />
        </View>
      ) : allStreams.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-off" size={48} color="#666" />
          <Text style={styles.emptyText}>No cameras found</Text>
          <Text style={styles.emptySubtext}>
            Try adjusting your filters or search query
          </Text>
        </View>
      ) : (
        <FlatList
          data={allStreams}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <LiveStreamPlayer
              key={item.id}
              stream={item}
              streamUrl={availability[item?.id]?.streamUrl}
              onPress={() =>
                router.push(`/streamdetail?id=${item.id}` as any)
              }
              isExpand={false}
            />
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshing={state.loading && page === 1}
          onRefresh={handleRefresh}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color="#14b8a6" />
              </View>
            ) : null
          }
        />
      )}
      <BottomNav activeTab="cameras" />
    </View>
  );
}

const styles = StyleSheet.create({
  topBarAction: {
    display: "flex",
    gap: "20px",
    flexDirection: "row",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    paddingBottom: 6,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 160,
    height: 40,
  },
  logoText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  refreshButton: {
    padding: 4,
  },
  logoutButton: {
    padding: 4,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  activeFilterButton: {
    width: 44,
    height: 44,
    backgroundColor: "#00BCD4",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  filtersSection: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dropdownWrapper: {
    position: "relative",
  },
  filterDropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  filterDropdownActive: {
    borderColor: "#00BCD4",
  },
  filterDropdownText: {
    color: "#666",
    fontSize: 16,
  },
  filterDropdownTextSelected: {
    color: "#fff",
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    maxHeight: 200,
    zIndex: 2000,
    elevation: 2000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  dropdownOptionSelected: {
    backgroundColor: "rgba(0, 188, 212, 0.2)",
  },
  dropdownOptionText: {
    color: "#fff",
    fontSize: 16,
  },
  dropdownOptionTextSelected: {
    color: "#00BCD4",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
    marginTop: 8,
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  // System Status Card
  systemStatusCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  systemStatusLeft: {
    flexDirection: "column",
    gap: 4,
  },
  systemStatusLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  systemStatusRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  systemStatusCount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  systemStatusSubtext: {
    fontSize: 14,
    color: "#aaa",
    marginLeft: 4,
  },
  systemStatusIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "rgba(0, 188, 212, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
});
