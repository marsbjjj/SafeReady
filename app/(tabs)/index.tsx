import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { Link } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

const SAFETY_KIT_STORAGE_KEY = "preparedness:safety-kit";
const EVACUATION_PLAN_STORAGE_KEY = "preparedness:evacuation-plan";
const EMERGENCY_CONTACTS_STORAGE_KEY = "preparedness:emergency-contacts";
const CHECKLIST_STORAGE_KEY = "preparedness:custom-checklist";
const QUIZ_STORAGE_KEY = "preparedness:quiz";
const ALERTS_STORAGE_KEY = "preparedness:alerts";

type ChecklistItem = {
  id: string;
  label: string;
  completed: boolean;
};

type ChecklistData = {
  id?: string;
  title?: string;
  items?: ChecklistItem[];
};

type StoredAlert = {
  id: string;
  title: string;
  severity: "Moderate" | "High";
  message: string;
  recommendedAction: string;
  route: string;
  createdAt: string;
  read?: boolean;
};

type QuizQuestion = {
  id: string;
  correctIndex: number;
};

type EmergencyService = {
  id: string;
  label: string;
  number: string;
};

// Quiz answer key 
const QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: "q1", correctIndex: 1 },
  { id: "q2", correctIndex: 1 },
  { id: "q3", correctIndex: 2 },
  { id: "q4", correctIndex: 2 },
  { id: "q5", correctIndex: 1 },
];

// Emergency call shortcuts 
const EMERGENCY_SERVICES: EmergencyService[] = [
  { id: "police", label: "Call Police", number: "17" },
  { id: "fire", label: "Call Fire Department", number: "18" },
  { id: "medical", label: "Call Medical Emergency", number: "17" },
];

// Makes sure checklist data can still be read even if the saved format changes a bit
function normalizeChecklistData(raw: string | null): ChecklistData[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed.map((checklist) => ({
        id: checklist?.id,
        title: checklist?.title,
        items: Array.isArray(checklist?.items) ? checklist.items : [],
      }));
    }

    if (parsed && typeof parsed === "object") {
      return [
        {
          id: parsed.id,
          title: parsed.title,
          items: Array.isArray(parsed.items) ? parsed.items : [],
        },
      ];
    }

    return [];
  } catch (error) {
    console.log("Error parsing checklist data:", error);
    return [];
  }
}

// Reads saved quiz data and works out the result summary
function getQuizResults(raw: string | null) {
  if (!raw) {
    return {
      submitted: false,
      correctCount: 0,
      percentage: 0,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    const answers = parsed.selectedAnswers || {};
    const submitted = parsed.submitted || false;

    const correctCount = QUIZ_QUESTIONS.reduce((total, question) => {
      return total + (answers[question.id] === question.correctIndex ? 1 : 0);
    }, 0);

    const percentage =
      QUIZ_QUESTIONS.length > 0
        ? Math.round((correctCount / QUIZ_QUESTIONS.length) * 100)
        : 0;

    return {
      submitted,
      correctCount,
      percentage,
    };
  } catch (error) {
    console.log("Error parsing quiz data:", error);
    return {
      submitted: false,
      correctCount: 0,
      percentage: 0,
    };
  }
}

// Converts quiz performance into extra dashboard points
function getQuizPoints(correctCount: number, percentage: number) {
  let points = correctCount * 10;

  if (percentage >= 75) {
    points += 20;
  } else if (percentage >= 50) {
    points += 10;
  }

  return points;
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [score, setScore] = useState(0);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [nextAction, setNextAction] = useState(
    "Start your first preparedness task."
  );
  const [emergencyVisible, setEmergencyVisible] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);

  // Loads all saved app data needed for the dashboard summary
  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [
        safetyKitRaw,
        evacuationRaw,
        contactsRaw,
        checklistRaw,
        quizRaw,
        alertsRaw,
      ] = await Promise.all([
        AsyncStorage.getItem(SAFETY_KIT_STORAGE_KEY),
        AsyncStorage.getItem(EVACUATION_PLAN_STORAGE_KEY),
        AsyncStorage.getItem(EMERGENCY_CONTACTS_STORAGE_KEY),
        AsyncStorage.getItem(CHECKLIST_STORAGE_KEY),
        AsyncStorage.getItem(QUIZ_STORAGE_KEY),
        AsyncStorage.getItem(ALERTS_STORAGE_KEY),
      ]);

      let totalPoints = 0;
      let completedModules = 0;

      // Safety kit scoring
      if (safetyKitRaw) {
        const parsed = JSON.parse(safetyKitRaw);
        const checked = parsed.checked || {};
        const completed = Object.values(checked).filter(Boolean).length;

        totalPoints += completed * 10;

        if (parsed.badge) {
          totalPoints += 50;
          completedModules += 1;
        }
      }

      // Evacuation plan scoring
      if (evacuationRaw) {
        const parsed = JSON.parse(evacuationRaw);
        const checked = parsed.checked || {};
        const completed = Object.values(checked).filter(Boolean).length;

        totalPoints += completed * 10;

        if (parsed.badge) {
          totalPoints += 60;
          completedModules += 1;
        }
      }

      // Emergency contacts scoring
      if (contactsRaw) {
        const parsed = JSON.parse(contactsRaw);
        const completedFields = [
          (parsed.primaryContact || "").trim().length > 0,
          (parsed.backupContact || "").trim().length > 0,
          (parsed.meetingPoint || "").trim().length > 0,
          parsed.communicationMethod !== null &&
            parsed.communicationMethod !== undefined,
        ].filter(Boolean).length;

        totalPoints += completedFields * 15;

        if (parsed.badge) {
          totalPoints += 50;
          completedModules += 1;
        }
      }

      // Custom checklist scoring
      if (checklistRaw) {
        const parsedChecklists = normalizeChecklistData(checklistRaw);
        const allItems = parsedChecklists.flatMap((checklist) =>
          Array.isArray(checklist.items) ? checklist.items : []
        );
        const completed = allItems.filter((item) => item.completed).length;

        totalPoints += completed * 8;

        if (allItems.length > 0) {
          completedModules += 1;
        }

        if (allItems.length > 0 && completed === allItems.length) {
          totalPoints += 40;
        }
      }

      // Quiz scoring
      const quizResults = getQuizResults(quizRaw);
      if (quizResults.submitted) {
        totalPoints += getQuizPoints(
          quizResults.correctCount,
          quizResults.percentage
        );
        completedModules += 1;
      }

      let unreadCount = 0;

      // Count unread saved alerts
      if (alertsRaw) {
        const parsedAlerts: StoredAlert[] = JSON.parse(alertsRaw);
        unreadCount = parsedAlerts.filter((alert) => !alert.read).length;
      }

      // Convert total points into a simplified preparedness score
      const preparednessScore = Math.min(
        100,
        Math.round((totalPoints / 450) * 100)
      );

      // Suggest the next task depending on progress so far
      let recommendation = "Start your first preparedness task.";

      if (completedModules === 0) {
        recommendation = "Start with the Safety Kit task.";
      } else if (completedModules === 1) {
        recommendation = "Next, try the Evacuation Plan.";
      } else if (completedModules === 2) {
        recommendation = "Now complete Emergency Contacts.";
      } else if (completedModules === 3) {
        recommendation = "Create your own Checklist for extra preparedness.";
      } else if (completedModules === 4) {
        recommendation =
          "Finish the disaster-specific Quiz to complete your readiness plan.";
      } else {
        recommendation =
          "Great progress. Review alerts and resources regularly.";
      }

      setPoints(totalPoints);
      setScore(preparednessScore);
      setUnreadAlerts(unreadCount);
      setNextAction(recommendation);
    } catch (error) {
      console.log("Error loading home dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reload dashboard whenever this tab comes back into focus
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  // Opens the phone app for an emergency call
  const handleCallEmergency = async (number: string) => {
    const url = `tel:${number}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert("Unable to call", `Could not open the phone app for ${number}.`);
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Unable to call", `Could not open the phone app for ${number}.`);
    }
  };

  // Gets the user's current location and opens the share sheet
  const handleShareLocation = async () => {
    try {
      setLocationBusy(true);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Location permission needed",
          "Allow location access so SafeReady can share your current location in an emergency."
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = position.coords;
      const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      const message =
        `Emergency: this is my current location.\n\n` +
        `Latitude: ${latitude}\n` +
        `Longitude: ${longitude}\n` +
        `Map: ${mapsUrl}`;

      await Share.share({
        message,
      });
    } catch (error) {
      Alert.alert(
        "Unable to share location",
        "SafeReady could not get your current location right now."
      );
    } finally {
      setLocationBusy(false);
    }
  };

  // Loading state while dashboard data is being calculated
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingSafeArea}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#F6D7DC" />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Reusable action card used in the action grid
  const ActionItem = ({
    href,
    title,
    text,
    alert = false,
  }: {
    href:
      | "/safety-kit"
      | "/evacuation-plan"
      | "/emergency-contacts"
      | "/checklist"
      | "/quiz"
      | "/alerts";
    title: string;
    text: string;
    alert?: boolean;
  }) => (
    <Link href={href} style={alert ? styles.actionCardAlert : styles.actionCard}>
      <View style={styles.actionHeaderRow}>
        <View style={alert ? styles.actionDotAlert : styles.actionDot} />
        <Text style={alert ? styles.actionTitleAlert : styles.actionTitle}>
          {title}
        </Text>
      </View>
      <Text style={alert ? styles.actionTextAlert : styles.actionText}>
        {text}
      </Text>
    </Link>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergency shortcut banner at the top */}
        <Pressable
          style={styles.emergencyBanner}
          onPress={() => setEmergencyVisible(true)}
        >
          <View>
            <Text style={styles.emergencyBannerEyebrow}>Emergency access</Text>
            <Text style={styles.emergencyBannerTitle}>Emergency Button</Text>
            <Text style={styles.emergencyBannerText}>
              Call emergency services or share your live location quickly.
            </Text>
          </View>
          <Text style={styles.emergencyBannerAction}>Open</Text>
        </Pressable>

        {/* Main dashboard hero section */}
        <View style={styles.heroShell}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <Text style={styles.eyebrow}>Personal safety dashboard</Text>
          <Text style={styles.title}>SafeReady</Text>
          <Text style={styles.subtitle}>
            Build your disaster preparedness step by step and stay ready with a
            calmer, smarter plan.
          </Text>

          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroLabel}>Preparedness Score</Text>
                <Text style={styles.heroScore}>{score}%</Text>
              </View>

              <View style={styles.alertPill}>
                <Text style={styles.alertPillNumber}>{unreadAlerts}</Text>
                <Text style={styles.alertPillText}>Unread alerts</Text>
              </View>
            </View>

            <View style={styles.progressBarBg}>
              <View
                style={[styles.progressBarFill, { width: `${score}%` }]}
              />
            </View>

            <Text style={styles.heroSubtext}>
              Your readiness score updates as you complete tasks, quiz steps,
              and checklist items.
            </Text>
          </View>
        </View>

        {/* Small summary cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCardPrimary}>
            <Text style={styles.statLabelLight}>Total Points</Text>
            <Text style={styles.statValueLight}>{points}</Text>
            <Text style={styles.statHintLight}>
              Earn more by finishing modules
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={styles.statValue}>
              {score >= 70 ? "Strong" : score >= 40 ? "Growing" : "Starting"}
            </Text>
            <Text style={styles.statHint}>Based on your current progress</Text>
          </View>
        </View>

        {/* Suggested next step card */}
        <View style={styles.recommendationCard}>
          <Text style={styles.sectionEyebrow}>Recommended next step</Text>
          <Text style={styles.recommendationText}>{nextAction}</Text>
        </View>

        {/* Quick action links */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSubtitle}>
            Jump into the most important parts of your preparedness plan.
          </Text>
        </View>

        <View style={styles.actionsGrid}>
          <ActionItem
            href="/safety-kit"
            title="Safety Kit"
            text="Complete your emergency kit checklist."
          />
          <ActionItem
            href="/evacuation-plan"
            title="Evacuation Plan"
            text="Review routes and response decisions."
          />
          <ActionItem
            href="/emergency-contacts"
            title="Contacts"
            text="Save important numbers and meeting details."
          />
          <ActionItem
            href="/checklist"
            title="Checklist"
            text="Build and manage your custom preparedness list."
          />
          <ActionItem
            href="/quiz"
            title="Quiz"
            text="Test your disaster readiness knowledge."
          />
          <ActionItem
            href="/alerts"
            title="Alerts"
            text="View simulated warnings and alert history."
            alert
          />
        </View>

        {/* Small reminder card at the bottom */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Preparedness Reminder</Text>
          <Text style={styles.tipText}>
            Small actions add up. Completing even one extra task today can
            improve your readiness and strengthen your emergency plan.
          </Text>
        </View>
      </ScrollView>

      {/* Emergency modal for fast access tools */}
      <Modal
        visible={emergencyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEmergencyVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <Text style={styles.modalEyebrow}>Emergency tools</Text>
                  <Text style={styles.modalTitle}>Get help quickly</Text>
                  <Text style={styles.modalSubtitle}>
                    Use these actions when you need immediate support.
                  </Text>
                </View>

                <Pressable
                  style={styles.closeButton}
                  onPress={() => setEmergencyVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalSectionTitle}>Call authorities</Text>

                {EMERGENCY_SERVICES.map((service) => (
                  <Pressable
                    key={service.id}
                    style={styles.emergencyActionCard}
                    onPress={() => handleCallEmergency(service.number)}
                  >
                    <View>
                      <Text style={styles.emergencyActionTitle}>
                        {service.label}
                      </Text>
                      <Text style={styles.emergencyActionMeta}>
                        Emergency number: {service.number}
                      </Text>
                    </View>
                    <Text style={styles.emergencyActionRight}>Call</Text>
                  </Pressable>
                ))}

                <Text style={styles.modalSectionTitle}>Share your location</Text>

                <Pressable
                  style={styles.locationCard}
                  onPress={handleShareLocation}
                  disabled={locationBusy}
                >
                  <View style={styles.locationCardTextWrap}>
                    <Text style={styles.locationCardTitle}>
                      Share My Location
                    </Text>
                    <Text style={styles.locationCardText}>
                      Create a message with your current coordinates and a map
                      link so someone can find you faster.
                    </Text>
                  </View>
                  <Text style={styles.locationCardAction}>
                    {locationBusy ? "Working..." : "Share"}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F1F2",
  },
  container: {
    flex: 1,
    backgroundColor: "#F7F1F2",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 88,
  },
  loadingSafeArea: {
    flex: 1,
    backgroundColor: "#F7F1F2",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F7F1F2",
  },
  loadingCard: {
    backgroundColor: "#4A101B",
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 180,
  },
  loadingText: {
    marginTop: 10,
    color: "#F8E9EC",
    fontSize: 14,
    fontWeight: "600",
  },
  emergencyBanner: {
    backgroundColor: "#7A1628",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emergencyBannerEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F3D7DC",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  emergencyBannerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF7F8",
    marginBottom: 6,
  },
  emergencyBannerText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#F7E7EA",
    maxWidth: "92%",
  },
  emergencyBannerAction: {
    color: "#FFF7F8",
    fontSize: 14,
    fontWeight: "800",
  },
  heroShell: {
    backgroundColor: "#4A101B",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
  },
  heroGlowOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255, 180, 192, 0.10)",
    top: -40,
    right: -20,
  },
  heroGlowTwo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 218, 224, 0.08)",
    bottom: -20,
    left: -10,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E8B8C0",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFF6F7",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#F2D7DB",
    marginBottom: 18,
    maxWidth: "95%",
  },
  heroCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 12,
  },
  heroLabel: {
    fontSize: 14,
    color: "#E8B8C0",
    marginBottom: 6,
  },
  heroScore: {
    fontSize: 38,
    fontWeight: "800",
    color: "#FFF6F7",
  },
  alertPill: {
    backgroundColor: "#FFF1F3",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    minWidth: 96,
  },
  alertPillNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#7A1628",
    marginBottom: 2,
  },
  alertPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9F3044",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#F3C8CF",
    borderRadius: 999,
  },
  heroSubtext: {
    fontSize: 13,
    lineHeight: 20,
    color: "#F2D7DB",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCardPrimary: {
    flex: 1,
    backgroundColor: "#6C1827",
    borderRadius: 20,
    padding: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF8F8",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0D9DD",
  },
  statLabelLight: {
    fontSize: 13,
    color: "#F3D7DC",
    marginBottom: 8,
  },
  statValueLight: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF7F8",
    marginBottom: 6,
  },
  statHintLight: {
    fontSize: 12,
    lineHeight: 18,
    color: "#E9BDC5",
  },
  statLabel: {
    fontSize: 13,
    color: "#7C5960",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#341118",
    marginBottom: 6,
  },
  statHint: {
    fontSize: 12,
    lineHeight: 18,
    color: "#8B6A70",
  },
  recommendationCard: {
    backgroundColor: "#FBE7EA",
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F2CDD3",
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9F3044",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4A101B",
    fontWeight: "600",
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#341118",
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#7D5C63",
  },
  actionsGrid: {
    marginBottom: 18,
  },
  actionCard: {
    backgroundColor: "#FFF8F8",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0D9DD",
  },
  actionCardAlert: {
    backgroundColor: "#4A101B",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  actionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#8F2A3C",
    marginRight: 10,
  },
  actionDotAlert: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F3C8CF",
    marginRight: 10,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#341118",
  },
  actionText: {
    fontSize: 14,
    color: "#7C5960",
    lineHeight: 21,
    paddingLeft: 18,
  },
  actionTitleAlert: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFF6F7",
  },
  actionTextAlert: {
    fontSize: 14,
    color: "#F2D7DB",
    lineHeight: 21,
    paddingLeft: 18,
  },
  tipCard: {
    backgroundColor: "#FFF1F3",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F2CDD3",
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#4A101B",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#7C5960",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20, 12, 14, 0.35)",
  },
  modalSafeArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#F7F1F2",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: "62%",
    maxHeight: "78%",
    overflow: "hidden",
  },
  modalHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EADFE2",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  modalHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  modalEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#7A1628",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#23181B",
    lineHeight: 32,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6D5B61",
  },
  closeButton: {
    backgroundColor: "#EFE6E8",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3B2C31",
  },
  modalContent: {
    padding: 18,
    paddingBottom: 34,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#23181B",
    marginBottom: 12,
  },
  emergencyActionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EADFE2",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emergencyActionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#23181B",
    marginBottom: 6,
  },
  emergencyActionMeta: {
    fontSize: 14,
    color: "#6D5B61",
  },
  emergencyActionRight: {
    fontSize: 14,
    fontWeight: "800",
    color: "#7A1628",
  },
  locationCard: {
    backgroundColor: "#FFF6F7",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECD6DB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  locationCardTextWrap: {
    flex: 1,
  },
  locationCardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#23181B",
    marginBottom: 6,
  },
  locationCardText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6D5B61",
  },
  locationCardAction: {
    fontSize: 14,
    fontWeight: "800",
    color: "#7A1628",
  },
});