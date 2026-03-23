import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const ONBOARDING_STORAGE_KEY = "preparedness:onboarding";
const SAFETY_KIT_STORAGE_KEY = "preparedness:safety-kit";
const EVACUATION_PLAN_STORAGE_KEY = "preparedness:evacuation-plan";
const EMERGENCY_CONTACTS_STORAGE_KEY = "preparedness:emergency-contacts";
const CHECKLIST_STORAGE_KEY = "preparedness:custom-checklist";
const QUIZ_STORAGE_KEY = "preparedness:quiz";
const ALERTS_STORAGE_KEY = "preparedness:alerts";

const DISASTER_OPTIONS = ["Flood", "Storm", "Earthquake", "Wildfire"];

type OnboardingData = {
  name?: string;
  disasterFocus?: string;
  selectedDisasters?: string[];
  completed?: boolean;
};

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [disasterFocus, setDisasterFocus] = useState("");

  // Load the current saved profile settings from onboarding data
  const loadSettings = async () => {
    try {
      setLoading(true);

      const onboardingRaw = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);

      if (onboardingRaw) {
        const parsed: OnboardingData = JSON.parse(onboardingRaw);

        // Fallback supports either the newer or older onboarding structure
        const fallbackFocus =
          parsed.disasterFocus ||
          (Array.isArray(parsed.selectedDisasters) &&
          parsed.selectedDisasters.length > 0
            ? parsed.selectedDisasters[0]
            : "");

        setName(parsed.name || "");
        setDisasterFocus(fallbackFocus);
      }
    } catch (error) {
      console.log("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Save updated profile information back into local storage
  const saveProfile = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert("Name required", "Please enter your name before saving.");
      return;
    }

    if (!disasterFocus) {
      Alert.alert(
        "Disaster focus required",
        "Please choose a disaster focus before saving."
      );
      return;
    }

    try {
      setSaving(true);

      const existingRaw = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      const existingData: OnboardingData = existingRaw
        ? JSON.parse(existingRaw)
        : {};

      const updatedData: OnboardingData = {
        ...existingData,
        name: trimmedName,
        disasterFocus,
        selectedDisasters: [disasterFocus],
        completed: true,
      };

      await AsyncStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify(updatedData)
      );

      Alert.alert("Saved", "Your profile settings have been updated.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.log("Error saving profile settings:", error);
      Alert.alert("Error", "Something went wrong while saving your changes.");
    } finally {
      setSaving(false);
    }
  };

  // Clear only the stored alert history
  const clearAlertsOnly = async () => {
    Alert.alert(
      "Clear alert history",
      "This will remove all stored simulated alerts. Your other app data will stay unchanged.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Alerts",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(ALERTS_STORAGE_KEY);
              Alert.alert("Done", "Stored alert history was cleared.");
            } catch (error) {
              console.log("Error clearing alerts:", error);
              Alert.alert("Error", "Unable to clear alert history.");
            }
          },
        },
      ]
    );
  };

  // Full app reset for testing or starting again from scratch
  const resetAllAppData = async () => {
    Alert.alert(
      "Reset app data",
      "This will erase onboarding, tasks, contacts, checklists, quiz progress, and alerts. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                ONBOARDING_STORAGE_KEY,
                SAFETY_KIT_STORAGE_KEY,
                EVACUATION_PLAN_STORAGE_KEY,
                EMERGENCY_CONTACTS_STORAGE_KEY,
                CHECKLIST_STORAGE_KEY,
                QUIZ_STORAGE_KEY,
                ALERTS_STORAGE_KEY,
              ]);

              Alert.alert(
                "App reset complete",
                "All SafeReady data has been removed.",
                [
                  {
                    text: "OK",
                    onPress: () => router.replace("/onboarding"),
                  },
                ]
              );
            } catch (error) {
              console.log("Error resetting app data:", error);
              Alert.alert("Error", "Unable to reset app data.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar with simple back navigation */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          <Text style={styles.topBarTitle}>Settings</Text>

          <View style={styles.topBarSpacer} />
        </View>

        {/* Intro card for the settings page */}
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Profile Settings</Text>
          <Text style={styles.heroTitle}>Edit your SafeReady profile</Text>
          <Text style={styles.heroText}>
            Update your name, adjust your main disaster focus, or manage stored
            app data.
          </Text>
        </View>

        {/* Name editing section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identity</Text>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Display name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#9A858A"
              style={styles.input}
              editable={!loading && !saving}
            />

            <Text style={styles.helperText}>
              This name will appear on your profile page.
            </Text>
          </View>
        </View>

        {/* Disaster focus selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preparedness Focus</Text>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Primary disaster focus</Text>

            <View style={styles.optionsWrap}>
              {DISASTER_OPTIONS.map((option) => {
                const selected = disasterFocus === option;

                return (
                  <Pressable
                    key={option}
                    onPress={() => setDisasterFocus(option)}
                    style={[
                      styles.optionChip,
                      selected && styles.optionChipSelected,
                    ]}
                    disabled={loading || saving}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        selected && styles.optionChipTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.helperText}>
              This helps personalize the way your profile presents your current
              preparedness focus.
            </Text>
          </View>
        </View>

        {/* Data management tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Controls</Text>

          <View style={styles.card}>
            <Text style={styles.dataTitle}>Clear stored alert history</Text>
            <Text style={styles.dataText}>
              Remove simulated alerts without affecting your other progress.
            </Text>

            <Pressable
              style={styles.secondaryAction}
              onPress={clearAlertsOnly}
              disabled={saving}
            >
              <Text style={styles.secondaryActionText}>Clear Alerts</Text>
            </Pressable>
          </View>

          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Reset all SafeReady data</Text>
            <Text style={styles.dangerText}>
              This removes onboarding details, task progress, contact
              information, checklists, quiz data, and alert history.
            </Text>

            <Pressable
              style={styles.dangerAction}
              onPress={resetAllAppData}
              disabled={saving}
            >
              <Text style={styles.dangerActionText}>Reset Everything</Text>
            </Pressable>
          </View>
        </View>

        {/* Save button for profile changes */}
        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveProfile}
          disabled={saving || loading}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F2F3",
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F2F3",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 56,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7A1628",
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#251316",
  },
  topBarSpacer: {
    minWidth: 56,
  },
  heroCard: {
    backgroundColor: "#4A101B",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E7BCC3",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFF7F8",
    marginBottom: 8,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#F2D7DB",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#251316",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E7DBDE",
    padding: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#34171D",
    marginBottom: 10,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: "#E4D6DA",
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: "#FCFAFA",
    fontSize: 15,
    color: "#251316",
    marginBottom: 10,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#7A666C",
  },
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "#F6F1F2",
    borderWidth: 1,
    borderColor: "#E3D6D9",
  },
  optionChipSelected: {
    backgroundColor: "#4A101B",
    borderColor: "#4A101B",
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4D2A31",
  },
  optionChipTextSelected: {
    color: "#FFF7F8",
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#251316",
    marginBottom: 6,
  },
  dataText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#78656A",
    marginBottom: 14,
  },
  secondaryAction: {
    alignSelf: "flex-start",
    backgroundColor: "#F6EAED",
    borderWidth: 1,
    borderColor: "#E8D4D9",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#7A1628",
  },
  dangerCard: {
    backgroundColor: "#FFF6F6",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E9D4D8",
    padding: 16,
    marginTop: 12,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#5E1624",
    marginBottom: 6,
  },
  dangerText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#7A666C",
    marginBottom: 14,
  },
  dangerAction: {
    alignSelf: "flex-start",
    backgroundColor: "#7A1628",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  dangerActionText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFF7F8",
  },
  saveButton: {
    backgroundColor: "#7A1628",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFF7F8",
  },
});