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

// Storage key for saving this task's progress locally
const STORAGE_KEY = "preparedness:safety-kit";

// Main task content for the safety kit module
const SAFETY_KIT_TASK = {
  id: "safety-kit",
  title: "Safety Kit",
  description:
    "Build a dependable emergency kit step by step so you are better prepared when a real situation happens.",
  items: [
    { id: "water", label: "Water (enough for at least 3 days)" },
    { id: "food", label: "Non-perishable food (3 days)" },
    { id: "torch", label: "Torch and spare batteries" },
    { id: "firstaid", label: "Basic first aid supplies" },
    { id: "docs", label: "Copies of key documents (sealed bag)" },
    { id: "cash", label: "Small amount of emergency cash" },
    { id: "contacts", label: "Write down emergency contact numbers" },
  ],
};

export default function SafetyKitScreen() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [badge, setBadge] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [alertShown, setAlertShown] = useState(false);

  // Load any previously saved task data when the screen opens
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const saved = JSON.parse(data);
          setChecked(saved.checked || {});
          setBadge(saved.badge || false);
          setConfidence(saved.confidence ?? null);
          setMode(saved.mode ?? null);
          setAlertShown(saved.alertShown ?? false);
        }
      } catch (error) {
        console.log("Error loading safety kit data:", error);
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
          JSON.stringify({ checked, badge, confidence, mode, alertShown })
        );
      } catch (error) {
        console.log("Error saving safety kit data:", error);
      }
    };

    saveData();
  }, [checked, badge, confidence, mode, alertShown]);

  // Count how many kit items have been marked as completed
  const completed = useMemo(() => {
    return SAFETY_KIT_TASK.items.filter((item) => checked[item.id]).length;
  }, [checked]);

  const totalItems = SAFETY_KIT_TASK.items.length;
  const remaining = totalItems - completed;

  // Small status message shown in the top card
  const statusLabel =
    completed === totalItems
      ? "Kit complete"
      : completed > 0
      ? `${remaining} item${remaining !== 1 ? "s" : ""} remaining`
      : "Not started";

  // Unlock badge once every item is completed
  useEffect(() => {
    if (!badge && completed === totalItems) {
      setBadge(true);

      Alert.alert(
        "Badge Unlocked",
        "You completed the Safety Kit Starter task."
      );
    }
  }, [completed, badge, totalItems]);

  const toggleItem = (id: string) => {
    setChecked((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Reset all saved data for this module
  const resetAll = () => {
    Alert.alert("Reset progress?", "This will clear your task data.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          setChecked({});
          setBadge(false);
          setConfidence(null);
          setMode(null);
          setAlertShown(false);
          await AsyncStorage.removeItem(STORAGE_KEY);
        },
      },
    ]);
  };

  // Simple simulation alert shown after completing the task
  const showAlert = () => {
    setAlertShown(true);

    Alert.alert(
      "Weather Alert (Simulation)",
      "Heavy storm warning.\n\nBased on your preparation, think about whether you would evacuate or shelter in place."
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top intro card with summary stats */}
        <View style={styles.heroPanel}>
          <Text style={styles.eyebrow}>Emergency supplies</Text>
          <Text style={styles.title}>{SAFETY_KIT_TASK.title}</Text>
          <Text style={styles.desc}>{SAFETY_KIT_TASK.description}</Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaBox}>
              <Text style={styles.heroMetaLabel}>Packed</Text>
              <Text style={styles.heroMetaValue}>
                {completed}/{totalItems}
              </Text>
            </View>

            <View style={styles.heroMetaBox}>
              <Text style={styles.heroMetaLabel}>Status</Text>
              <Text style={styles.heroMetaValueSmall}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* Main checklist section */}
        <View style={styles.inventorySection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Kit Inventory</Text>
            {badge ? (
              <Text style={styles.badgeText}>Starter badge earned</Text>
            ) : (
              <Text style={styles.helperText}>Complete every item</Text>
            )}
          </View>

          {SAFETY_KIT_TASK.items.map((item, index) => {
            const done = !!checked[item.id];

            return (
              <Pressable
                key={item.id}
                onPress={() => toggleItem(item.id)}
                style={[
                  styles.itemCard,
                  done && styles.itemCardDone,
                ]}
              >
                {/* Item number */}
                <View style={styles.itemIndexWrap}>
                  <Text style={[styles.itemIndex, done && styles.itemIndexDone]}>
                    {index + 1}
                  </Text>
                </View>

                {/* Item label */}
                <View style={styles.itemContent}>
                  <Text
                    style={[
                      styles.itemLabel,
                      done && styles.itemLabelDone,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>

                {/* Small status tag on the right */}
                <View style={done ? styles.stateTagDone : styles.stateTagOpen}>
                  <Text
                    style={done ? styles.stateTagDoneText : styles.stateTagOpenText}
                  >
                    {done ? "Packed" : "Add"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Extra reflection section only shows after finishing the checklist */}
        {badge && (
          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>Readiness Review</Text>

            {/* Confidence rating */}
            {confidence === null ? (
              <View style={styles.reviewCardDark}>
                <Text style={styles.reviewCardTitleDark}>
                  Preparedness confidence
                </Text>
                <Text style={styles.reviewCardTextDark}>
                  How confident do you feel about handling an emergency with your
                  current kit?
                </Text>

                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable
                      key={n}
                      style={styles.ratingButtonDark}
                      onPress={() => setConfidence(n)}
                    >
                      <Text style={styles.ratingButtonDarkText}>{n}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.infoStrip}>
                <Text style={styles.infoStripLabel}>Confidence</Text>
                <Text style={styles.infoStripValue}>{confidence} / 5</Text>
              </View>
            )}

            {/* Choice about likely response mode */}
            {mode === null ? (
              <View style={styles.reviewCardLight}>
                <Text style={styles.reviewCardTitleLight}>
                  Preparedness context
                </Text>
                <Text style={styles.reviewCardTextLight}>
                  If an alert happened right now, what would you expect to rely on?
                </Text>

                <Pressable
                  style={styles.choiceRow}
                  onPress={() => setMode("Evacuation")}
                >
                  <Text style={styles.choiceRowText}>Evacuation</Text>
                </Pressable>

                <Pressable
                  style={styles.choiceRow}
                  onPress={() => setMode("Shelter in place")}
                >
                  <Text style={styles.choiceRowText}>Shelter in place</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.infoStrip}>
                <Text style={styles.infoStripLabel}>Response mode</Text>
                <Text style={styles.infoStripValueText}>{mode}</Text>
              </View>
            )}

            {/* Small simulation action */}
            {!alertShown ? (
              <Pressable style={styles.simulationButton} onPress={showAlert}>
                <Text style={styles.simulationButtonText}>
                  Run Weather Alert Simulation
                </Text>
              </Pressable>
            ) : (
              <View style={styles.infoStrip}>
                <Text style={styles.infoStripLabel}>Simulation</Text>
                <Text style={styles.infoStripValueText}>Scenario reviewed</Text>
              </View>
            )}
          </View>
        )}

        {/* Reset action */}
        <Pressable onPress={resetAll} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset Safety Kit</Text>
        </Pressable>

        {/* Short footer note */}
        <Text style={styles.footer}>
          This module helps you build an emergency kit through small, practical steps.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F1F2",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 88,
  },
  heroPanel: {
    backgroundColor: "#2B161A",
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#D7B6BC",
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    lineHeight: 21,
    color: "#E6D7DA",
    marginBottom: 16,
  },
  heroMetaRow: {
    flexDirection: "row",
    gap: 10,
  },
  heroMetaBox: {
    flex: 1,
    backgroundColor: "#3A1F24",
    padding: 14,
    borderRadius: 10,
  },
  heroMetaLabel: {
    fontSize: 12,
    color: "#D7B6BC",
    marginBottom: 6,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  heroMetaValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  heroMetaValueSmall: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 21,
  },
  inventorySection: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
  },
  badgeText: {
    fontSize: 13,
    color: "#8B1020",
    fontWeight: "700",
  },
  helperText: {
    fontSize: 13,
    color: "#666666",
    fontWeight: "600",
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E0E1",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  itemCardDone: {
    backgroundColor: "#F4ECEE",
    borderColor: "#D9B9BF",
  },
  itemIndexWrap: {
    width: 34,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  itemIndex: {
    fontSize: 15,
    fontWeight: "800",
    color: "#8B1020",
  },
  itemIndexDone: {
    color: "#6A1C2A",
  },
  itemContent: {
    flex: 1,
    paddingRight: 12,
  },
  itemLabel: {
    fontSize: 14,
    lineHeight: 21,
    color: "#111111",
  },
  itemLabelDone: {
    color: "#6B6B6B",
    textDecorationLine: "line-through",
  },
  stateTagOpen: {
    backgroundColor: "#EFEFEF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  stateTagDone: {
    backgroundColor: "#8B1020",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  stateTagOpenText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#444444",
  },
  stateTagDoneText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  reviewSection: {
    marginBottom: 18,
  },
  reviewCardDark: {
    backgroundColor: "#1F1F1F",
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  reviewCardTitleDark: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  reviewCardTextDark: {
    fontSize: 14,
    lineHeight: 21,
    color: "#D7D7D7",
    marginBottom: 12,
  },
  reviewCardLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  reviewCardTitleLight: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 8,
  },
  reviewCardTextLight: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5E5E5E",
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 8,
  },
  ratingButtonDark: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#353535",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingButtonDarkText: {
    fontWeight: "700",
    color: "#FFFFFF",
  },
  choiceRow: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  choiceRowText: {
    fontSize: 14,
    color: "#111111",
    lineHeight: 20,
    fontWeight: "600",
  },
  simulationButton: {
    backgroundColor: "#8B1020",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  simulationButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  infoStrip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  infoStripLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#6B6B6B",
    marginBottom: 6,
  },
  infoStripValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111111",
  },
  infoStripValueText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: "#111111",
  },
  resetButton: {
    backgroundColor: "#E7E1E2",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  resetButtonText: {
    fontWeight: "700",
    color: "#111111",
  },
  footer: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6B6B6B",
  },
});