import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

// Storage key for saving the emergency contacts plan locally
const STORAGE_KEY = "preparedness:emergency-contacts";

type ContactsData = {
  primaryContact: string;
  backupContact: string;
  meetingPoint: string;
  communicationMethod: string | null;
  badge: boolean;
  confidence: number | null;
};

const defaultData: ContactsData = {
  primaryContact: "",
  backupContact: "",
  meetingPoint: "",
  communicationMethod: null,
  badge: false,
  confidence: null,
};

export default function EmergencyContactsScreen() {
  const [savedPlan, setSavedPlan] = useState<ContactsData>(defaultData);
  const [draftForm, setDraftForm] = useState<ContactsData>(defaultData);
  const [showEditor, setShowEditor] = useState(false);

  // Load saved data when the screen opens
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const loadedData: ContactsData = {
          primaryContact: parsed.primaryContact || "",
          backupContact: parsed.backupContact || "",
          meetingPoint: parsed.meetingPoint || "",
          communicationMethod: parsed.communicationMethod ?? null,
          badge: parsed.badge || false,
          confidence: parsed.confidence ?? null,
        };

        setSavedPlan(loadedData);
        setDraftForm(loadedData);
      } else {
        setSavedPlan(defaultData);
        setDraftForm(defaultData);
      }
    } catch (error) {
      console.log("Error loading emergency contacts data:", error);
    }
  };

  // Count how many main plan fields have been filled in
  const filledCount = useMemo(() => {
    return [
      savedPlan.primaryContact.trim().length > 0,
      savedPlan.backupContact.trim().length > 0,
      savedPlan.meetingPoint.trim().length > 0,
      savedPlan.communicationMethod !== null,
    ].filter(Boolean).length;
  }, [savedPlan]);

  const hasPlan = filledCount > 0;

  const updateDraftField = (
    key: keyof ContactsData,
    value: string | boolean | null | number
  ) => {
    setDraftForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Open the editor with the current saved values
  const startEditing = () => {
    setDraftForm(savedPlan);
    setShowEditor(true);
  };

  // Close the editor without saving changes
  const cancelEditing = () => {
    setDraftForm(savedPlan);
    setShowEditor(false);
  };

  const savePlan = async () => {
    const completedFields = [
      draftForm.primaryContact.trim().length > 0,
      draftForm.backupContact.trim().length > 0,
      draftForm.meetingPoint.trim().length > 0,
      draftForm.communicationMethod !== null,
    ].filter(Boolean).length;

    // Unlock the badge once all main fields are completed
    const updatedPlan: ContactsData = {
      ...draftForm,
      badge: completedFields === 4 ? true : draftForm.badge || false,
    };

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlan));
      setSavedPlan(updatedPlan);
      setDraftForm(updatedPlan);
      setShowEditor(false);

      if (!savedPlan.badge && updatedPlan.badge) {
        Alert.alert(
          "Badge Unlocked",
          "You completed the Emergency Contacts Ready task."
        );
      }
    } catch (error) {
      console.log("Error saving emergency contacts data:", error);
    }
  };

  // Save the user's confidence rating separately
  const saveConfidence = async (value: number) => {
    const updatedPlan = {
      ...savedPlan,
      confidence: value,
    };

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlan));
      setSavedPlan(updatedPlan);
      setDraftForm(updatedPlan);
    } catch (error) {
      console.log("Error saving confidence:", error);
    }
  };

  // Reset everything for this task
  const resetTask = () => {
    Alert.alert("Reset plan?", "This will clear your emergency contacts plan.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          setSavedPlan(defaultData);
          setDraftForm(defaultData);
          setShowEditor(false);
          await AsyncStorage.removeItem(STORAGE_KEY);
        },
      },
    ]);
  };

  // Simple status label based on how complete the plan is
  const completionLabel =
    filledCount === 4
      ? "Complete"
      : filledCount >= 2
      ? "Partially ready"
      : filledCount === 1
      ? "Started"
      : "Not set up";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Page intro */}
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>Emergency communication</Text>
          <Text style={styles.title}>Emergency Contacts</Text>
          <Text style={styles.desc}>
            Keep your emergency communication plan clear, visible, and easy to
            update.
          </Text>
        </View>

        {/* Main saved plan card */}
        <View style={styles.sheetCard}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>My Emergency Sheet</Text>
              <Text style={styles.sheetStatus}>{completionLabel}</Text>
            </View>

            <Pressable style={styles.editButton} onPress={startEditing}>
              <Text style={styles.editButtonText}>
                {hasPlan ? "Edit" : "Create"}
              </Text>
            </Pressable>
          </View>

          {!hasPlan ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No emergency plan saved</Text>
              <Text style={styles.emptyText}>
                Add your key contact details, meeting point, and communication
                method so they are easy to review when needed.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.infoBlock}>
                <Text style={styles.infoHeading}>Primary contact</Text>
                <Text style={styles.infoValue}>
                  {savedPlan.primaryContact || "Not set"}
                </Text>
              </View>

              <View style={styles.infoBlock}>
                <Text style={styles.infoHeading}>Backup contact</Text>
                <Text style={styles.infoValue}>
                  {savedPlan.backupContact || "Not set"}
                </Text>
              </View>

              <View style={styles.infoBlock}>
                <Text style={styles.infoHeading}>Meeting point</Text>
                <Text style={styles.infoValue}>
                  {savedPlan.meetingPoint || "Not set"}
                </Text>
              </View>

              <View style={styles.infoBlockLast}>
                <Text style={styles.infoHeading}>Communication method</Text>
                <Text style={styles.infoValue}>
                  {savedPlan.communicationMethod || "Not selected"}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Quick action buttons */}
        <View style={styles.utilityRow}>
          <Link href="/resources" style={styles.utilityButtonDark}>
            <Text style={styles.utilityButtonDarkText}>Open Emergency Resources</Text>
          </Link>

          <Pressable style={styles.utilityButtonLight} onPress={resetTask}>
            <Text style={styles.utilityButtonLightText}>Reset Plan</Text>
          </Pressable>
        </View>

        {/* Edit form */}
        {showEditor && (
          <View style={styles.editorPanel}>
            <Text style={styles.editorTitle}>Edit Emergency Plan</Text>

            <Text style={styles.label}>Primary emergency contact</Text>
            <TextInput
              value={draftForm.primaryContact}
              onChangeText={(text) => updateDraftField("primaryContact", text)}
              placeholder="Enter a main contact name or number"
              placeholderTextColor="#7A7A7A"
              style={styles.input}
            />

            <Text style={styles.label}>Backup emergency contact</Text>
            <TextInput
              value={draftForm.backupContact}
              onChangeText={(text) => updateDraftField("backupContact", text)}
              placeholder="Enter a backup contact"
              placeholderTextColor="#7A7A7A"
              style={styles.input}
            />

            <Text style={styles.label}>Meeting point</Text>
            <TextInput
              value={draftForm.meetingPoint}
              onChangeText={(text) => updateDraftField("meetingPoint", text)}
              placeholder="Enter a safe meeting location"
              placeholderTextColor="#7A7A7A"
              style={styles.input}
            />

            <Text style={styles.label}>Preferred communication method</Text>

            <View style={styles.methodList}>
              {["Phone call", "Text message", "Messaging app"].map((method) => {
                const selected = draftForm.communicationMethod === method;

                return (
                  <Pressable
                    key={method}
                    style={[
                      styles.methodRow,
                      selected && styles.methodRowSelected,
                    ]}
                    onPress={() => updateDraftField("communicationMethod", method)}
                  >
                    <Text
                      style={[
                        styles.methodText,
                        selected && styles.methodTextSelected,
                      ]}
                    >
                      {method}
                    </Text>
                    {selected && <Text style={styles.methodCheck}>Selected</Text>}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.editorActions}>
              <Pressable style={styles.cancelButton} onPress={cancelEditing}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.saveButton} onPress={savePlan}>
                <Text style={styles.saveButtonText}>Save Plan</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Confidence rating only appears after the task badge is unlocked */}
        {savedPlan.badge && (
          <View style={styles.confidencePanel}>
            <Text style={styles.confidenceTitle}>Communication Confidence</Text>
            <Text style={styles.confidenceText}>
              How confident do you feel about contacting the right people during
              an emergency?
            </Text>

            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((n) => {
                const selected = savedPlan.confidence === n;

                return (
                  <Pressable
                    key={n}
                    style={[
                      styles.ratingButton,
                      selected && styles.ratingButtonSelected,
                    ]}
                    onPress={() => saveConfidence(n)}
                  >
                    <Text
                      style={[
                        styles.ratingButtonText,
                        selected && styles.ratingButtonTextSelected,
                      ]}
                    >
                      {n}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {savedPlan.confidence !== null && (
              <Text style={styles.savedConfidenceText}>
                Saved confidence: {savedPlan.confidence} / 5
              </Text>
            )}
          </View>
        )}
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
  sheetCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 4,
  },
  sheetStatus: {
    fontSize: 13,
    color: "#6B6B6B",
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: "#8B1020",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  emptyState: {
    paddingTop: 4,
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
    color: "#5E5E5E",
  },
  infoBlock: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  infoBlockLast: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  infoHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    lineHeight: 22,
    color: "#111111",
    fontWeight: "600",
  },
  utilityRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  utilityButtonDark: {
    flex: 1,
    backgroundColor: "#111111",
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: "center",
    borderRadius: 8,
  },
  utilityButtonDarkText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
  utilityButtonLight: {
    backgroundColor: "#ECECEC",
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: "center",
    borderRadius: 8,
  },
  utilityButtonLightText: {
    color: "#111111",
    fontWeight: "700",
    fontSize: 13,
  },
  editorPanel: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
  },
  editorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111111",
    marginBottom: 14,
    borderRadius: 8,
  },
  methodList: {
    marginTop: 2,
    marginBottom: 8,
  },
  methodRow: {
    backgroundColor: "#F7F7F7",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  methodRowSelected: {
    borderColor: "#8B1020",
    backgroundColor: "#F8EEF0",
  },
  methodText: {
    fontSize: 14,
    color: "#111111",
    fontWeight: "600",
  },
  methodTextSelected: {
    color: "#8B1020",
  },
  methodCheck: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B1020",
  },
  editorActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: "#E9E1E3",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#222222",
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: "#8B1020",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  confidencePanel: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 10,
    padding: 16,
  },
  confidenceTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5E5E5E",
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
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
  ratingButtonSelected: {
    backgroundColor: "#8B1020",
    borderColor: "#8B1020",
  },
  ratingButtonText: {
    fontWeight: "700",
    color: "#111111",
  },
  ratingButtonTextSelected: {
    color: "#FFFFFF",
  },
  savedConfidenceText: {
    fontSize: 14,
    color: "#5E5E5E",
  },
});