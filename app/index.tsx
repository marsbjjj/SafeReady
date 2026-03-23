import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

const ONBOARDING_STORAGE_KEY = "preparedness:onboarding";

export default function IndexScreen() {
  useEffect(() => {
    // Check if the user already finished onboarding
    const checkOnboarding = async () => {
      try {
        const saved = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);

        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.completed) {
            router.replace("/(tabs)");
            return;
          }
        }

        // If onboarding is not completed, send user there first
        router.replace("/onboarding");
      } catch (error) {
        console.log("Error checking onboarding:", error);
        router.replace("/onboarding");
      }
    };

    checkOnboarding();
  }, []);

  return (
    <View style={styles.container}>
      {/* Small loading screen while checking saved onboarding data */}
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});