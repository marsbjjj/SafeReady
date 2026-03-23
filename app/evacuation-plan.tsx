import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Storage key for this task's saved progress
const STORAGE_KEY = "preparedness:evacuation-plan";

// Main evacuation planning task and checklist steps
const EVACUATION_TASK = {
  id: "evacuation-plan",
  title: "Evacuation Plan",
  description:
    "Prepare a safe evacuation plan in advance so decisions are easier during an emergency.",
  items: [
    { id: "route1", label: "Identify your main evacuation route" },
    { id: "route2", label: "Identify a backup evacuation route" },
    { id: "shelter", label: "Locate the nearest safe shelter or meeting point" },
    { id: "contacts", label: "Agree on a family contact or meeting plan" },
    { id: "bag", label: "Keep your emergency bag easy to access" },
    { id: "transport", label: "Plan how you would leave if transport is disrupted" },
  ],
};

export default function EvacuationPlanScreen() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [badge, setBadge] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [decisionReady, setDecisionReady] = useState<string | null>(null);

  // Load any previously saved progress when the screen opens
  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setChecked(parsed.checked || {});
          setBadge(parsed.badge || false);
          setConfidence(parsed.confidence ?? null);
          setDecisionReady(parsed.decisionReady ?? null);
        }
      } catch (error) {
        console.log("Error loading evacuation plan data:", error);
      }
    };

    loadData();
  }, []);

  // Save progress whenever the main task state changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            checked,
            badge,
            confidence,
            decisionReady,
          })
        );
      } catch (error) {
        console.log("Error saving evacuation plan data:", error);
      }
    };

    saveData();
  }, [checked, badge, confidence, decisionReady]);

  // Count how many checklist steps are completed
  const completed = useMemo(() => {
    return EVACUATION_TASK.items.filter((item) => checked[item.id]).length;
  }, [checked]);

  const totalSteps = EVACUATION_TASK.items.length;
  const remaining = totalSteps - completed;
  const completionLabel =
    completed === totalSteps
      ? "Plan complete"
      : completed > 0
      ? `${remaining} step${remaining !== 1 ? "s" : ""} remaining`
      : "Not started";

  // Unlock the badge once all steps are done
  useEffect(() => {
    if (!badge && completed === totalSteps) {
      setBadge(true);
      Alert.alert("Badge Unlocked", "You completed the Evacuation Ready task.");
    }
  }, [completed, badge, totalSteps]);

  const toggleItem = (id: string) => {
    setChecked((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Clear all saved progress for this task
  const resetTask = () => {
    Alert.alert(
      "Reset task?",
      "This will clear your evacuation planning progress.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setChecked({});
            setBadge(false);
            setConfidence(null);
            setDecisionReady(null);
            await AsyncStorage.removeItem(STORAGE_KEY);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Page heading and short explanation */}
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>Emergency planning</Text>
          <Text style={styles.title}>{EVACUATION_TASK.title}</Text>
          <Text style={styles.desc}>{EVACUATION_TASK.description}</Text>
        </View>

        {/* Summary card showing current progress */}
        <View style={styles.planSummary}>
          <View style={styles.planSummaryTop}>
            <View>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={styles.summaryValue}>{completionLabel}</Text>
            </View>

            {badge ? (
              <View style={styles.statusPillDone}>
                <Text style={styles.statusPillDoneText}>Evacuation Ready</Text>
              </View>
            ) : (
              <View style={styles.statusPillPending}>
                <Text style={styles.statusPillPendingText}>In Progress</Text>
              </View>
            )}
          </View>

          <Text style={styles.summarySubtext}>
            {completed} of {totalSteps} planning steps completed
          </Text>
        </View>

        {/* Main evacuation checklist */}
        <View style={styles.sheetCard}>
          <Text style={styles.sectionTitle}>Evacuation Checklist</Text>

          {EVACUATION_TASK.items.map((item, index) => {
            const done = !!checked[item.id];

            return (
              <Pressable
                key={item.id}
                onPress={() => toggleItem(item.id)}
                style={styles.taskRow}
              >
                <View style={styles.taskLeft}>
                  <Text style={styles.taskNumber}>{index + 1}</Text>
                </View>

                <View style={styles.taskMiddle}>
                  <Text
                    style={[
                      styles.taskText,
                      done && styles.taskTextDone,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>

                <View
                  style={[
                    styles.taskStatusBox,
                    done ? styles.taskStatusBoxDone : styles.taskStatusBoxPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.taskStatusText,
                      done
                        ? styles.taskStatusTextDone
                        : styles.taskStatusTextPending,
                    ]}
                  >
                    {done ? "Done" : "Check"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Reflection area appears after the full task is completed */}
        {badge && (
          <View style={styles.reflectionBlock}>
            <Text style={styles.sectionTitle}>After-Plan Reflection</Text>

            {confidence === null ? (
              <View style={styles.panelCard}>
                <Text style={styles.panelTitle}>Evacuation confidence</Text>
                <Text style={styles.panelBody}>
                  How confident do you feel about evacuating safely if needed?
                </Text>

                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable
                      key={n}
                      style={styles.ratingButton}
                      onPress={() => setConfidence(n)}
                    >
                      <Text style={styles.ratingButtonText}>{n}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Confidence saved</Text>
                <Text style={styles.infoValue}>{confidence} / 5</Text>
              </View>
            )}

            {decisionReady === null ? (
              <View style={styles.panelCard}>
                <Text style={styles.panelTitle}>Evacuation decision</Text>
                <Text style={styles.panelBody}>
                  If roads were partially blocked, what would you rely on most?
                </Text>

                <Pressable
                  style={styles.choiceButton}
                  onPress={() =>
                    setDecisionReady("Primary route and prior planning")
                  }
                >
                  <Text style={styles.choiceText}>
                    Primary route and prior planning
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.choiceButton}
                  onPress={() =>
                    setDecisionReady("Backup route and local shelter plan")
                  }
                >
                  <Text style={styles.choiceText}>
                    Backup route and local shelter plan
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Selected strategy</Text>
                <Text style={styles.infoValueText}>{decisionReady}</Text>
              </View>
            )}
          </View>
        )}

        {/* Reset button for the whole task */}
        <Pressable style={styles.resetButton} onPress={resetTask}>
          <Text style={styles.resetButtonText}>Reset Evacuation Plan</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F1F2",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 88,
  },
  headerBlock: {
    marginBottom: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2D6D9",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#8B1020",
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5E5E5E",
  },
  planSummary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
  },
  planSummaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B6B6B",
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111111",
  },
  summarySubtext: {
    fontSize: 14,
    color: "#5E5E5E",
    lineHeight: 20,
  },
  statusPillDone: {
    backgroundColor: "#E9E1E3",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusPillDoneText: {
    color: "#8B1020",
    fontWeight: "700",
    fontSize: 12,
  },
  statusPillPending: {
    backgroundColor: "#F1F1F1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusPillPendingText: {
    color: "#555555",
    fontWeight: "700",
    fontSize: 12,
  },
  sheetCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 14,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  taskLeft: {
    width: 34,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  taskNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: "#8B1020",
  },
  taskMiddle: {
    flex: 1,
    paddingRight: 12,
  },
  taskText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#111111",
  },
  taskTextDone: {
    color: "#7A7A7A",
    textDecorationLine: "line-through",
  },
  taskStatusBox: {
    minWidth: 64,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  taskStatusBoxDone: {
    backgroundColor: "#8B1020",
  },
  taskStatusBoxPending: {
    backgroundColor: "#F1F1F1",
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  taskStatusTextDone: {
    color: "#FFFFFF",
  },
  taskStatusTextPending: {
    color: "#444444",
  },
  reflectionBlock: {
    marginBottom: 18,
  },
  panelCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 8,
  },
  panelBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5E5E5E",
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 8,
  },
  ratingButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E4E4E4",
  },
  ratingButtonText: {
    fontWeight: "700",
    color: "#111111",
  },
  choiceButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  choiceText: {
    fontSize: 14,
    color: "#111111",
    lineHeight: 20,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#6B6B6B",
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111111",
  },
  infoValueText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: "#111111",
  },
  resetButton: {
    backgroundColor: "#ECECEC",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  resetButtonText: {
    fontWeight: "700",
    color: "#111111",
  },
});