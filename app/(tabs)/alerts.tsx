import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const ALERTS_STORAGE_KEY = "preparedness:alerts";

type AlertRoute =
  | "/safety-kit"
  | "/evacuation-plan"
  | "/emergency-contacts"
  | "/quiz";

type StoredAlert = {
  id: string;
  title: string;
  severity: "Moderate" | "High";
  message: string;
  recommendedAction: string;
  route: AlertRoute;
  createdAt: string;
  read?: boolean;
};

// Creates a simulated alert object based on the selected alert type
const createAlert = (
  type: "storm" | "flood" | "communications" | "readiness"
): StoredAlert => {
  const timestamp = new Date().toISOString();
  const id = `${type}-${Date.now()}`;

  switch (type) {
    case "storm":
      return {
        id,
        title: "Heavy Storm Warning",
        severity: "High",
        message:
          "Strong winds and heavy rainfall are expected in your area. Review emergency supplies and prepare for disruption.",
        recommendedAction: "Review Safety Kit",
        route: "/safety-kit",
        createdAt: timestamp,
        read: false,
      };

    case "flood":
      return {
        id,
        title: "Flash Flood Risk",
        severity: "High",
        message:
          "Flooding may develop quickly. Check evacuation routes and prepare to move if instructed.",
        recommendedAction: "Open Evacuation Plan",
        route: "/evacuation-plan",
        createdAt: timestamp,
        read: false,
      };

    case "communications":
      return {
        id,
        title: "Communication Disruption Advisory",
        severity: "Moderate",
        message:
          "Phone or internet disruptions may affect emergency communication. Confirm who you would contact and how.",
        recommendedAction: "Open Emergency Contacts",
        route: "/emergency-contacts",
        createdAt: timestamp,
        read: false,
      };

    case "readiness":
    default:
      return {
        id,
        title: "Preparedness Check Reminder",
        severity: "Moderate",
        message:
          "Review your emergency knowledge and make sure you understand recommended actions.",
        recommendedAction: "Open Preparedness Quiz",
        route: "/quiz",
        createdAt: timestamp,
        read: false,
      };
  }
};

// Formats the saved alert timestamp into a simple readable form
const formatTimestamp = (isoString: string) => {
  const date = new Date(isoString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export default function AlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<StoredAlert[]>([]);

  // Load saved alerts from local storage
  const loadAlerts = async () => {
    try {
      const raw = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
      if (raw) {
        const parsed: StoredAlert[] = JSON.parse(raw);
        setAlerts(parsed);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.log("Error loading alerts:", error);
    }
  };

  // Refresh alerts whenever this screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, [])
  );

  // Save the full updated alert list
  const saveAlerts = async (updatedAlerts: StoredAlert[]) => {
    try {
      await AsyncStorage.setItem(
        ALERTS_STORAGE_KEY,
        JSON.stringify(updatedAlerts)
      );
      setAlerts(updatedAlerts);
    } catch (error) {
      console.log("Error saving alerts:", error);
    }
  };

  // Mark one alert as read
  const markAsRead = async (id: string) => {
    const updatedAlerts = alerts.map((alertItem) =>
      alertItem.id === id ? { ...alertItem, read: true } : alertItem
    );
    await saveAlerts(updatedAlerts);
  };

  // Create a new test alert and show a popup with a linked action
  const triggerAlert = async (
    type: "storm" | "flood" | "communications" | "readiness"
  ) => {
    const newAlert = createAlert(type);
    const updatedAlerts = [newAlert, ...alerts];

    await saveAlerts(updatedAlerts);

    Alert.alert(
      newAlert.title,
      `${newAlert.message}\n\nRecommended action: ${newAlert.recommendedAction}`,
      [
        { text: "Dismiss", style: "cancel" },
        {
          text: "Open",
          onPress: async () => {
            await markAsRead(newAlert.id);
            router.push(newAlert.route);
          },
        },
      ]
    );
  };

  // Open the linked screen for a saved alert
  const openAlert = async (alertItem: StoredAlert) => {
    await markAsRead(alertItem.id);
    router.push(alertItem.route);
  };

  // Clear all saved simulated alerts
  const clearAlerts = () => {
    Alert.alert("Clear alerts?", "This will remove all saved alerts.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(ALERTS_STORAGE_KEY);
          setAlerts([]);
        },
      },
    ]);
  };

  const unreadCount = alerts.filter((alert) => !alert.read).length;
  const totalCount = alerts.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Page heading */}
        <View style={styles.header}>
          <Text style={styles.title}>Alerts</Text>
          <Text style={styles.subtitle}>
            Trigger simulated warnings and review saved alert history with linked
            actions.
          </Text>
        </View>

        {/* Small overview cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Unread</Text>
            <Text style={styles.summaryValue}>{unreadCount}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{totalCount}</Text>
          </View>
        </View>

        {/* Buttons for triggering test alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trigger Test Alerts</Text>

          <View style={styles.triggerList}>
            <Pressable
              style={styles.triggerButtonPrimary}
              onPress={() => triggerAlert("storm")}
            >
              <Text style={styles.triggerButtonPrimaryText}>
                Trigger Storm Alert
              </Text>
            </Pressable>

            <Pressable
              style={styles.triggerButtonPrimary}
              onPress={() => triggerAlert("flood")}
            >
              <Text style={styles.triggerButtonPrimaryText}>
                Trigger Flood Alert
              </Text>
            </Pressable>

            <Pressable
              style={styles.triggerButtonSecondary}
              onPress={() => triggerAlert("communications")}
            >
              <Text style={styles.triggerButtonSecondaryText}>
                Trigger Communication Alert
              </Text>
            </Pressable>

            <Pressable
              style={styles.triggerButtonSecondary}
              onPress={() => triggerAlert("readiness")}
            >
              <Text style={styles.triggerButtonSecondaryText}>
                Trigger Readiness Reminder
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Saved alert history */}
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Alert History</Text>
          {alerts.length > 0 && (
            <Pressable onPress={clearAlerts}>
              <Text style={styles.clearText}>Clear all</Text>
            </Pressable>
          )}
        </View>

        {alerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptyText}>
              Trigger a test alert to simulate incoming warnings.
            </Text>
          </View>
        ) : (
          alerts.map((alertItem) => {
            const isUnread = !alertItem.read;
            const isHigh = alertItem.severity === "High";

            return (
              <View
                key={alertItem.id}
                style={[
                  styles.alertCard,
                  isUnread && styles.alertCardUnread,
                ]}
              >
                <View style={styles.alertHeaderRow}>
                  <View style={styles.alertHeaderText}>
                    <Text style={styles.alertTitle}>{alertItem.title}</Text>
                    <Text style={styles.timestamp}>
                      {formatTimestamp(alertItem.createdAt)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.severityBadge,
                      isHigh
                        ? styles.severityBadgeHigh
                        : styles.severityBadgeModerate,
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityBadgeText,
                        isHigh
                          ? styles.severityBadgeTextHigh
                          : styles.severityBadgeTextModerate,
                      ]}
                    >
                      {alertItem.severity}
                    </Text>
                  </View>
                </View>

                {isUnread && (
                  <Text style={styles.unreadText}>Unread</Text>
                )}

                <Text style={styles.message}>{alertItem.message}</Text>

                <View style={styles.actionBox}>
                  <Text style={styles.actionLabel}>Recommended action</Text>
                  <Text style={styles.actionText}>
                    {alertItem.recommendedAction}
                  </Text>
                </View>

                <Pressable
                  style={styles.openButton}
                  onPress={() => openAlert(alertItem)}
                >
                  <Text style={styles.openButtonText}>
                    {alertItem.recommendedAction}
                  </Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 88,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5F5F5F",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111111",
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 12,
  },
  triggerList: {
    gap: 10,
  },
  triggerButtonPrimary: {
    backgroundColor: "#8B1020",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  triggerButtonPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  triggerButtonSecondary: {
    backgroundColor: "#F5F5F5",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  triggerButtonSecondaryText: {
    color: "#1A1A1A",
    fontWeight: "700",
    fontSize: 14,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clearText: {
    color: "#8B1020",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#666666",
  },
  alertCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  alertCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: "#8B1020",
  },
  alertHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
  },
  alertHeaderText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 12,
    color: "#7A7A7A",
  },
  severityBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  severityBadgeHigh: {
    backgroundColor: "#FDEBEC",
  },
  severityBadgeModerate: {
    backgroundColor: "#F1F1F1",
  },
  severityBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  severityBadgeTextHigh: {
    color: "#8B1020",
  },
  severityBadgeTextModerate: {
    color: "#5E5E5E",
  },
  unreadText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B1020",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4F4F4F",
    marginBottom: 12,
  },
  actionBox: {
    backgroundColor: "#F8F8F8",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECECEC",
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7A7A7A",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#111111",
    fontWeight: "600",
  },
  openButton: {
    backgroundColor: "#111111",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  openButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});