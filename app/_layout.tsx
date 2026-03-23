import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  // Detect whether the device is using light or dark mode
  const colorScheme = useColorScheme();

  return (
    // Apply theme based on the user's system preference
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          // Set a consistent background color across all screens
          contentStyle: {
            backgroundColor: "#F8FAFC",
          },
        }}
      >
        {/* Entry screen */}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Onboarding flow for first-time users */}
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />

        {/* Main tab navigation */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Task-related screens */}
        <Stack.Screen
          name="safety-kit"
          options={{ title: "Safety Kit Task", headerShown: true }}
        />
        <Stack.Screen
          name="evacuation-plan"
          options={{ title: "Evacuation Plan", headerShown: true }}
        />
        <Stack.Screen
          name="emergency-contacts"
          options={{ title: "Emergency Contacts", headerShown: true }}
        />
        <Stack.Screen
          name="checklist"
          options={{ title: "Checklist", headerShown: true }}
        />
        <Stack.Screen
          name="quiz"
          options={{ title: "Preparedness Quiz", headerShown: true }}
        />
      </Stack>

      {/* Default status bar style */}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}