import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
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

const DISASTER_OPTIONS = ["Flood", "Storm", "Earthquake", "Wildfire"];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [selectedDisasters, setSelectedDisasters] = useState<string[]>([]);

  // Progress bar changes based on the current onboarding step
  const progressWidth = useMemo(() => {
    if (step === 1) return "33%";
    if (step === 2) return "66%";
    return "100%";
  }, [step]);

  const toggleDisaster = (disaster: string) => {
    setSelectedDisasters((prev) =>
      prev.includes(disaster)
        ? prev.filter((item) => item !== disaster)
        : [...prev, disaster]
    );
  };

  const completeOnboarding = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter your name before continuing.");
      return;
    }

    if (selectedDisasters.length === 0) {
      Alert.alert(
        "Choose at least one",
        "Please select at least one disaster focus area."
      );
      return;
    }

    try {
      // Save onboarding completion so the user does not see this again
      await AsyncStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({
          completed: true,
          name: name.trim(),
          disasterFocus: selectedDisasters,
        })
      );

      router.replace("/(tabs)");
    } catch (error) {
      console.log("Error saving onboarding:", error);
      Alert.alert("Error", "Could not save onboarding data.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top progress indicator */}
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressText}>Step {step} of 3</Text>
        </View>

        {/* First welcome screen */}
        {step === 1 && (
          <View style={styles.heroPanel}>
            <Text style={styles.eyebrow}>Welcome</Text>
            <Text style={styles.heroTitle}>SafeReady</Text>
            <Text style={styles.heroSubtitle}>
              A simpler way to build disaster preparedness step by step.
            </Text>

            <View style={styles.infoCardDark}>
              <Text style={styles.infoCardTitleDark}>What you can do</Text>
              <Text style={styles.infoCardTextDark}>
                Complete guided preparedness tasks, track your readiness, review
                alerts, and build confidence through planning and quizzes.
              </Text>
            </View>

            <View style={styles.infoCardLight}>
              <Text style={styles.infoCardTitleLight}>Why this helps</Text>
              <Text style={styles.infoCardTextLight}>
                Instead of trying to prepare all at once, SafeReady helps you
                work through smaller actions that are easier to manage and review.
              </Text>
            </View>

            <Pressable style={styles.primaryButton} onPress={() => setStep(2)}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </Pressable>
          </View>
        )}

        {/* Step for entering the user's name */}
        {step === 2 && (
          <View style={styles.stepPanel}>
            <Text style={styles.stepTitle}>Set up your profile</Text>
            <Text style={styles.stepSubtitle}>
              Add a display name so your experience feels more personal.
            </Text>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Display name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#7A7A7A"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.navigationRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setStep(1)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </Pressable>

              <Pressable
                style={styles.primaryButton}
                onPress={() => setStep(3)}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Step for selecting disaster focus areas */}
        {step === 3 && (
          <View style={styles.stepPanel}>
            <Text style={styles.stepTitle}>Choose your focus areas</Text>
            <Text style={styles.stepSubtitle}>
              Select the disaster types you want to focus on first.
            </Text>

            <View style={styles.selectionGrid}>
              {DISASTER_OPTIONS.map((item) => {
                const selected = selectedDisasters.includes(item);

                return (
                  <Pressable
                    key={item}
                    style={[
                      styles.optionCard,
                      selected && styles.optionCardSelected,
                    ]}
                    onPress={() => toggleDisaster(item)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    <Text
                      style={[
                        styles.optionMeta,
                        selected && styles.optionMetaSelected,
                      ]}
                    >
                      {selected ? "Selected" : "Tap to select"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.navigationRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setStep(2)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </Pressable>

              <Pressable
                style={styles.primaryButton}
                onPress={completeOnboarding}
              >
                <Text style={styles.primaryButtonText}>Finish Setup</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F1F2",
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F1F2",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  progressWrap: {
    marginBottom: 22,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#E4D9DC",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#8B1020",
    borderRadius: 999,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B5B60",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroPanel: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#8B1020",
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#5E5E5E",
    marginBottom: 20,
  },
  infoCardDark: {
    backgroundColor: "#241518",
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
  },
  infoCardTitleDark: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  infoCardTextDark: {
    fontSize: 14,
    lineHeight: 21,
    color: "#DDD4D6",
  },
  infoCardLight: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#E3D9DC",
  },
  infoCardTitleLight: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 8,
  },
  infoCardTextLight: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5E5E5E",
  },
  stepPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E3D9DC",
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5E5E5E",
    marginBottom: 20,
  },
  fieldBlock: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: "#111111",
  },
  selectionGrid: {
    marginBottom: 10,
  },
  optionCard: {
    backgroundColor: "#F7F7F7",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  optionCardSelected: {
    backgroundColor: "#F7ECEF",
    borderColor: "#8B1020",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 6,
  },
  optionTextSelected: {
    color: "#8B1020",
  },
  optionMeta: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  optionMetaSelected: {
    color: "#8B1020",
    fontWeight: "700",
  },
  navigationRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#8B1020",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#E9E1E3",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#111111",
    fontWeight: "700",
    fontSize: 14,
  },
});