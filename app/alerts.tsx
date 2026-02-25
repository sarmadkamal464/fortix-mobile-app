import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import BottomNav from "@/components/BottomNav";
import FortixLogo from "@/assets/images/fortix-logo.png";
import { useAuth } from "@/lib/hooks/auth";
import { useAlarmManagement } from "@/lib/hooks/alarmCenter";
import { Alarm, AlarmFilters } from "@/lib/types/alarm";

type FilterOption = { id: number | null; label: string };

export const getTimeAgo = (isoDate: string | undefined) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

type ConfidenceFilter = "all" | "high" | "medium" | "low" | "na";

const getAlarmConfidenceBucket = (alarm: Alarm): Exclude<ConfidenceFilter, "all"> => {
  if (!alarm.confidence_scores || alarm.confidence_scores.length === 0) return "na";

  const maxConfidence = Math.max(...alarm.confidence_scores.map((c) => c.confidence));
  // Assume confidence is between 0 and 1; adjust thresholds as needed
  if (maxConfidence >= 0.8) return "high";
  if (maxConfidence >= 0.5) return "medium";
  return "low";
};

const getConfidenceMeta = (alarm: Alarm) => {
  const bucket = getAlarmConfidenceBucket(alarm);
  if (bucket === "na") {
    return { label: "CONFIDENCE: N/A", color: "#E5E7EB", bg: "#374151" };
  }
  if (bucket === "high") {
    return { label: "CONFIDENCE: HIGH", color: "#FEE2E2", bg: "#DC2626" };
  }
  if (bucket === "medium") {
    return { label: "CONFIDENCE: MEDIUM", color: "#FFEDD5", bg: "#EA580C" };
  }
  return { label: "CONFIDENCE: LOW", color: "#ECFEFF", bg: "#0891B2" };
};

const getConfidenceIconTheme = (bucket: Exclude<ConfidenceFilter, "all">) => {
  switch (bucket) {
    case "high":
      return {
        icon: "warning" as const,
        fg: "#FCA5A5",
        bg: "rgba(220, 38, 38, 0.18)",
        border: "rgba(220, 38, 38, 0.45)",
      };
    case "medium":
      return {
        icon: "warning-outline" as const,
        fg: "#FDBA74",
        bg: "rgba(234, 88, 12, 0.18)",
        border: "rgba(234, 88, 12, 0.45)",
      };
    case "low":
      return {
        icon: "alert-circle-outline" as const,
        fg: "#67E8F9",
        bg: "rgba(8, 145, 178, 0.18)",
        border: "rgba(8, 145, 178, 0.45)",
      };
    case "na":
    default:
      return {
        icon: "help-circle-outline" as const,
        fg: "#D1D5DB",
        bg: "rgba(55, 65, 81, 0.55)",
        border: "rgba(229, 231, 235, 0.20)",
      };
  }
};

const AlertsScreen = () => {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const {
    alarms,
    loading,
    pagination,
    fetchAlarms,
    filterOptions,
  } = useAlarmManagement();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AlarmFilters>({});
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const router = useRouter();
  const [confidenceFilter, setConfidenceFilter] =
    useState<ConfidenceFilter>("all");

  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<number | null>(
    null
  );
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(
    null
  );

  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [showUseCaseDropdown, setShowUseCaseDropdown] = useState(false);
  const [showCameraDropdown, setShowCameraDropdown] = useState(false);
  const [allAlarms, setAllAlarms] = useState<Alarm[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const handleRefresh = () => {
    setPage(1);
    setAllAlarms([]);
    setHasMore(true);
    fetchAlarms(filters, 1, limit);
  };

  // Track previous filters to detect changes
  const prevFiltersStrRef = useRef<string>(JSON.stringify(filters));

  // Reset to page 1 when filters change
  useEffect(() => {
    const filtersStr = JSON.stringify(filters);
    
    if (prevFiltersStrRef.current !== filtersStr && page !== 1) {
      prevFiltersStrRef.current = filtersStr;
      setPage(1);
      setAllAlarms([]);
      setHasMore(true);
    } else if (prevFiltersStrRef.current !== filtersStr) {
      prevFiltersStrRef.current = filtersStr;
    }
  }, [filters, page]);

  // Fetch alarms when filters or pagination change
  useEffect(() => {
    if (page === 1) {
      // First page or filter change - replace all alarms
      setAllAlarms([]);
      setHasMore(true);
      fetchAlarms(filters, page, limit);
    } else {
      // Loading more pages - append to existing alarms
      setLoadingMore(true);
      fetchAlarms(filters, page, limit);
    }
    // Intentionally omit fetchAlarms from dependencies to avoid
    // re-running this effect when the hook re-creates the callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, limit]);

  // Update accumulated alarms when new data arrives
  useEffect(() => {
    if (loading) {
      return; // Still loading, don't update yet
    }

    if (page === 1) {
      // First page - replace all alarms
      setAllAlarms(alarms);
    } else {
      // Subsequent pages - append new alarms (avoid duplicates)
      setAllAlarms((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const newAlarms = alarms.filter((a) => !existingIds.has(a.id));
        return [...prev, ...newAlarms];
      });
      setLoadingMore(false);
    }

    // Check if there are more pages to load
    if (pagination) {
      const totalPages = Math.ceil((pagination.total || 0) / limit);
      setHasMore(page < totalPages);
    }
  }, [alarms, loading, page, limit, pagination]);

  // Close dropdowns when filters section is hidden
  useEffect(() => {
    if (!showFilters) {
      setShowSiteDropdown(false);
      setShowUseCaseDropdown(false);
      setShowCameraDropdown(false);
    }
  }, [showFilters]);

  const totalCount = pagination?.total ?? alarms.length ?? 0;

  const displayedAlarms = useMemo(() => {
    if (confidenceFilter === "all") return allAlarms;
    return allAlarms.filter(
      (a) => getAlarmConfidenceBucket(a) === confidenceFilter
    );
  }, [allAlarms, confidenceFilter]);

  // Build filter options from alarms
  const siteOptions: FilterOption[] = filterOptions.sites.map((site) => ({
    id: site.id,
    label: site.name,
  }));
  const useCaseOptions: FilterOption[] = filterOptions.businessUseCases.map(
    (useCase) => ({
      id: useCase.id,
      label: useCase.name,
    })
  );
  const cameraOptions: FilterOption[] = filterOptions.cameras.map((camera) => ({
    id: camera.id,
    label: camera.name,
  }));

  const updateFilters = useCallback(
    (key: keyof AlarmFilters, value: number | null) => {
      setFilters((prev) => {
        const next: any = { ...prev };
        if (value === null) {
          delete next[key];
        } else {
          next[key] = value;
        }
        return next;
      });
      setPage(1);
      setAllAlarms([]);
      setHasMore(true);
    },
    []
  );

  const clearAllFilters = () => {
    setFilters({});
    setSelectedSiteId(null);
    setSelectedUseCaseId(null);
    setSelectedCameraId(null);
    setPage(1);
    setAllAlarms([]);
    setHasMore(true);
  };

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore && pagination) {
      const totalPages = Math.ceil((pagination.total || 0) / limit);
      if (page < totalPages) {
        setPage((prev) => prev + 1);
      }
    }
  }, [loading, loadingMore, hasMore, pagination, page, limit]);

  const renderAlarmCard = ({ item, index }: { item: Alarm; index: number }) => {
    const confidence = getConfidenceMeta(item);
    const bucket = getAlarmConfidenceBucket(item);
    const iconTheme = getConfidenceIconTheme(bucket);
    const timeAgo = getTimeAgo(item.full_timestamp || item.created_at) || "—";
    return (
        <Pressable 
          onPress={() =>
            router.push(`/alertdetails?id=${item.id}` as any)
          }
        >
          <View
            style={[styles.alarmCard]}
          >
            {/* Thumbnail / Image */}
            <View style={styles.thumbnailContainer}>
              {item.image_s3_url ? (
                <Image
                  source={{ uri: item.image_s3_url }}
                  style={styles.thumbnail}
                />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <View
                    style={[
                      styles.iconBadge,
                      {
                        backgroundColor: iconTheme.bg,
                        borderColor: iconTheme.border,
                      },
                    ]}
                  >
                    <Ionicons name={iconTheme.icon} size={22} color={iconTheme.fg} />
                  </View>
                </View>
              )}
            </View>

            {/* Main content */}
            <View style={styles.alarmContent}>
              <View style={styles.alarmTitleRow}>
                <View
                  style={[
                    styles.iconBadgeSmall,
                    {
                      backgroundColor: iconTheme.bg,
                      borderColor: iconTheme.border,
                    },
                  ]}
                >
                  <Ionicons name={iconTheme.icon} size={16} color={iconTheme.fg} />
                </View>
                <Text style={styles.alarmTitle}>
                  {item.video_source_name || `Camera ${item.video_source_id}`}
                </Text>
              </View>

              <Text style={styles.alarmSubtitle}>
                {`Site ${item?.site?.name ?? "N/A"} • ${item.business_case_name || item.alert_type || "Unknown"
                  }`}
              </Text>

              <Text
                style={styles.alarmDescription}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.alert_content || "No additional description provided."}
              </Text>

              <View style={styles.alarmFooterRow}>
                <Text style={styles.timeAgo}>{timeAgo}</Text>
                <View
                  style={[
                    styles.confidencePill,
                    { backgroundColor: confidence.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.confidenceText,
                      { color: confidence.color },
                    ]}
                  >
                    {confidence.label}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
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

      {/* Stats + Filter Icon */}
      <View style={styles.statsCard}>

        <View style={styles.statsColumn}>
          <Text style={styles.statsLabel}>TOTAL</Text>
          <Text style={styles.statsValue}>{totalCount}</Text>
        </View>
        <Pressable
          style={styles.statsFilterButton}
          onPress={() => setShowFilters((prev) => !prev)}
        >
          <Ionicons name="funnel-outline" size={22} color="#000" />
        </Pressable>
      </View>

      {/* Confidence Filter Chips */}
      <View style={styles.confidenceChipsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.confidenceChipsContent}
        >
          {(
            [
              { key: "all", label: "All Alerts" },
              { key: "high", label: "Confidence: High" },
              { key: "medium", label: "Confidence: Medium" },
              { key: "low", label: "Confidence: Low" },
            ] as const
          ).map((chip) => {
            const active = confidenceFilter === chip.key;
            return (
              <Pressable
                key={chip.key}
                onPress={() => setConfidenceFilter(chip.key)}
                style={[
                  styles.confidenceChip,
                  active && styles.confidenceChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.confidenceChipText,
                    active && styles.confidenceChipTextActive,
                  ]}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Filters Section */}
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
                  setShowCameraDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.filterDropdownText,
                    selectedSiteId !== null && styles.filterDropdownTextSelected,
                  ]}
                >
                  {siteOptions.find((o) => o.id === selectedSiteId)?.label ||
                    "All Sites"}
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
                        updateFilters("stream_id", null);
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
                    {siteOptions.map((option) => (
                      <Pressable
                        key={`${option.label}-${option.id ?? "all"}`}
                        style={[
                          styles.dropdownOption,
                          selectedSiteId === option.id && styles.dropdownOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedSiteId(option.id);
                          updateFilters("site_id", option.id);
                          setShowSiteDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selectedSiteId === option.id && styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {option.label}
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
                  setShowCameraDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.filterDropdownText,
                    selectedUseCaseId !== null &&
                    styles.filterDropdownTextSelected,
                  ]}
                >
                  {useCaseOptions.find((o) => o.id === selectedUseCaseId)
                    ?.label || "All Use Cases"}
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
                        updateFilters("business_case_id", null);
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
                    {useCaseOptions.map((option) => (
                      <Pressable
                        key={`${option.label}-${option.id ?? "all"}`}
                        style={[
                          styles.dropdownOption,
                          selectedUseCaseId === option.id && styles.dropdownOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedUseCaseId(option.id);
                          updateFilters("business_case_id", option.id);
                          setShowUseCaseDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selectedUseCaseId === option.id && styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Filter by Camera */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>FILTER BY CAMERA</Text>
            <View style={styles.dropdownWrapper}>
              <Pressable
                style={[
                  styles.filterDropdown,
                  showCameraDropdown && styles.filterDropdownActive,
                ]}
                onPress={() => {
                  setShowCameraDropdown(!showCameraDropdown);
                  setShowSiteDropdown(false);
                  setShowUseCaseDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.filterDropdownText,
                    selectedCameraId !== null &&
                    styles.filterDropdownTextSelected,
                  ]}
                >
                  {cameraOptions.find((o) => o.id === selectedCameraId)
                    ?.label || "All Cameras"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </Pressable>
              {showCameraDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled={true}
                  >
                    <Pressable
                      style={[
                        styles.dropdownOption,
                        !selectedCameraId && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedCameraId(null);
                        updateFilters("video_source_id", null);
                        setShowCameraDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          !selectedCameraId && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        All Cameras
                      </Text>
                    </Pressable>
                    {cameraOptions.map((option) => (
                      <Pressable
                        key={`${option.label}-${option.id ?? "all"}`}
                        style={[
                          styles.dropdownOption,
                          selectedCameraId === option.id && styles.dropdownOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedCameraId(option.id);
                          updateFilters("video_source_id", option.id);
                          setShowCameraDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selectedCameraId === option.id && styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <Pressable
            style={styles.clearFiltersButton}
            onPress={clearAllFilters}
          >
            <Ionicons
              name="close-circle-outline"
              size={18}
              color="#9CA3AF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </Pressable>
        </View>
      )}

      {/* Alarms List */}
      {loading && allAlarms.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#00BCD4" />
        </View>
      ) : displayedAlarms.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="notifications-off-outline"
            size={48}
            color="#4B5563"
          />
          <Text style={styles.emptyTitle}>No alerts found</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your filters or check back later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedAlarms}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAlarmCard}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 8 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color="#00BCD4" />
              </View>
            ) : null
          }
          refreshing={loading && page === 1}
          onRefresh={handleRefresh}
        />
      )}

      <BottomNav activeTab="alerts" />
    </View>
  );
};

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
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  statsColumn: {
    flex: 1,
  },
  statsLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 4,
  },
  statsValue: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "700",
  },
  statsDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#1F2937",
    marginHorizontal: 12,
  },
  statsFilterButton: {
    width: 44,
    height: 44,
    backgroundColor: "#00BCD4",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  confidenceChipsContainer: {
    marginHorizontal: 16,
    marginTop: -6,
    marginBottom: 12,
  },
  confidenceChipsContent: {
    gap: 10,
    paddingRight: 16,
  },
  confidenceChip: {
    backgroundColor: "#1a1a1a",
    borderColor: "#1a1a1a",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  confidenceChipActive: {
    backgroundColor: "#00BCD4",
    borderColor: "#00BCD4",
  },
  confidenceChipText: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "600",
  },
  confidenceChipTextActive: {
    color: "#000",
  },
  filtersSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filtersTitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 6,
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
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  filterDropdownActive: {
    borderColor: "#00BCD4",
  },
  filterDropdownText: {
    color: "#6B7280",
    fontSize: 14,
  },
  filterDropdownTextSelected: {
    color: "#F9FAFB",
  },
  clearFiltersButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  clearFiltersText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: "#111827",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F2937",
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
    borderBottomColor: "#1F2937",
  },
  dropdownOptionSelected: {
    backgroundColor: "rgba(0, 188, 212, 0.2)",
  },
  dropdownOptionText: {
    color: "#F9FAFB",
    fontSize: 14,
  },
  dropdownOptionTextSelected: {
    color: "#00BCD4",
    fontWeight: "600",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  alarmCard: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#111827",
  },
  alarmCardPrimary: {
    borderColor: "#00BCD4",
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 10,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  thumbnailPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  iconBadgeSmall: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginRight: 8,
  },
  alarmContent: {
    flex: 1,
  },
  alarmTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  alarmTitle: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "600",
  },
  alarmSubtitle: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 4,
  },
  alarmDescription: {
    color: "#D1D5DB",
    fontSize: 13,
    marginBottom: 8,
  },
  alarmFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeAgo: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  confidencePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: "600",
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AlertsScreen;

