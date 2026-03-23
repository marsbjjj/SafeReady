import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        // Shared styling for all bottom tabs
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: '#7A8CA5',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,

        // Screen and tab bar 
        sceneStyle: {
          paddingTop: 30,
          backgroundColor: '#F8FAFC',
        },
        tabBarStyle: {
          height: 55,
          paddingTop: 6,
          paddingBottom: 6,
          backgroundColor: theme.background,
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="checkmark.circle.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="exclamationmark.triangle.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="resources"
        options={{
          title: 'Resources',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="book.closed.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profilepage"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="person.crop.circle.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}