import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { router } from "expo-router";
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
const ONBOARDING_STORAGE_KEY = "preparedness:onboarding";

const SAFETY_KIT_TOTAL_ITEMS = 7;
const EVACUATION_PLAN_TOTAL_ITEMS = 6;
const EMERGENCY_CONTACTS_TOTAL_FIELDS = 4;

type DisasterType = "Flood" | "Storm" | "Earthquake" | "Wildfire";

type QuizQuestion = {
  id: string;
  disaster: DisasterType;
  correctIndex: number;
};

type EmergencyService = {
  id: string;
  label: string;
  number: string;
};

// Quiz answer key used for profile scoring and disaster-specific quiz breakdown
const QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: "q1", disaster: "Flood", correctIndex: 1 },
  { id: "q2", disaster: "Flood", correctIndex: 1 },
  { id: "q3", disaster: "Storm", correctIndex: 2 },
  { id: "q4", disaster: "Storm", correctIndex: 2 },
  { id: "q5", disaster: "Earthquake", correctIndex: 1 },
];

// Emergency call shortcuts
const EMERGENCY_SERVICES: EmergencyService[] = [
  { id: "police", label: "Call Police", number: "17" },
  { id: "fire", label: "Call Fire Department", number: "18" },
  { id: "medical", label: "Call Medical Emergency", number: "17" },
];

type SafetyKitData = {
  checked?: Record<string, boolean>;
  badge?: boolean;
  confidence?: number | null;
  mode?: string | null;
};

type EvacuationPlanData = {
  checked?: Record<string, boolean>;
  badge?: boolean;
  confidence?: number | null;
  decisionReady?: string | null;
};

type EmergencyContactsData = {
  primaryContact?: string;
  backupContact?: string;
  meetingPoint?: string;
  communicationMethod?: string | null;
  badge?: boolean;
  confidence?: number | null;
};

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

type QuizData = {
  selectedAnswers?: Record<string, number>;
  submitted?: boolean;
};

type Reward = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
};

type OnboardingData = {
  name?: string;
  disasterFocus?: string;
  selectedDisasters?: string[];
  completed?: boolean;
};

// Helps screen still read checklist data
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

// Converts quiz performance into points
function getQuizPoints(correctCount: number, percentage: number) {
  let points = correctCount * 10;

  if (percentage >= 75) {
    points += 20;
  } else if (percentage >= 50) {
    points += 10;
  }

  return points;
}

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("SafeReady User");
  const [disasterFocusLabel, setDisasterFocusLabel] =
    useState("Preparedness Focus");

  const [totalPoints, setTotalPoints] = useState(0);
  const [preparednessScore, setPreparednessScore] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [level, setLevel] = useState("Getting Started");

  const [safetyKitPoints, setSafetyKitPoints] = useState(0);
  const [evacuationPoints, setEvacuationPoints] = useState(0);
  const [contactsPoints, setContactsPoints] = useState(0);
  const [checklistPoints, setChecklistPoints] = useState(0);
  const [quizPoints, setQuizPoints] = useState(0);

  const [completedModules, setCompletedModules] = useState(0);
  const [nextGoal, setNextGoal] = useState(
    "Complete your first preparedness task."
  );

  const [floodScore, setFloodScore] = useState(0);
  const [stormScore, setStormScore] = useState(0);
  const [earthquakeScore, setEarthquakeScore] = useState(0);
  const [wildfireScore, setWildfireScore] = useState(0);

  const [safetyKitCompleted, setSafetyKitCompleted] = useState(0);
  const [badgeEarned, setBadgeEarned] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [mode, setMode] = useState<string | null>(null);

  const [evacuationCompleted, setEvacuationCompleted] = useState(0);
  const [evacuationBadgeEarned, setEvacuationBadgeEarned] = useState(false);
  const [evacuationConfidence, setEvacuationConfidence] = useState<number | null>(
    null
  );
  const [evacuationDecision, setEvacuationDecision] = useState<string | null>(
    null
  );

  const [contactsCompleted, setContactsCompleted] = useState(0);
  const [contactsBadgeEarned, setContactsBadgeEarned] = useState(false);
  const [contactsConfidence, setContactsConfidence] = useState<number | null>(
    null
  );
  const [communicationMethod, setCommunicationMethod] = useState<string | null>(
    null
  );

  const [checklistCount, setChecklistCount] = useState(0);
  const [checklistCompleted, setChecklistCompleted] = useState(0);
  const [checklistTotal, setChecklistTotal] = useState(0);

  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizPercentage, setQuizPercentage] = useState(0);

  const [floodQuizScore, setFloodQuizScore] = useState(0);
  const [stormQuizScore, setStormQuizScore] = useState(0);
  const [earthquakeQuizScore, setEarthquakeQuizScore] = useState(0);
  const [wildfireQuizScore, setWildfireQuizScore] = useState(0);

  const [emergencyVisible, setEmergencyVisible] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);

  // Load all profile-related progress and summary data
  const loadProfileData = async () => {
    try {
      setLoading(true);

      const [
        onboardingRaw,
        safetyKitRaw,
        evacuationRaw,
        contactsRaw,
        checklistRaw,
        quizRaw,
      ] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
        AsyncStorage.getItem(SAFETY_KIT_STORAGE_KEY),
        AsyncStorage.getItem(EVACUATION_PLAN_STORAGE_KEY),
        AsyncStorage.getItem(EMERGENCY_CONTACTS_STORAGE_KEY),
        AsyncStorage.getItem(CHECKLIST_STORAGE_KEY),
        AsyncStorage.getItem(QUIZ_STORAGE_KEY),
      ]);

      // Load user name and focus from onboarding data
      if (onboardingRaw) {
        const parsedOnboarding: OnboardingData = JSON.parse(onboardingRaw);

        const focusValue =
          parsedOnboarding.disasterFocus ||
          (Array.isArray(parsedOnboarding.selectedDisasters) &&
          parsedOnboarding.selectedDisasters.length > 0
            ? parsedOnboarding.selectedDisasters[0]
            : "");

        setUserName(parsedOnboarding.name?.trim() || "SafeReady User");
        setDisasterFocusLabel(
          focusValue ? `${focusValue} Focus` : "Preparedness Focus"
        );
      } else {
        setUserName("SafeReady User");
        setDisasterFocusLabel("Preparedness Focus");
      }

      let points = 0;
      let safetyPoints = 0;
      let evacPoints = 0;
      let contactPoints = 0;
      let customChecklistPoints = 0;
      let qPoints = 0;

      let unlockedBadges: string[] = [];
      let modulesDone = 0;
      let startedAnyModule = false;

      let safetyRatio = 0;
      let evacuationRatio = 0;
      let contactsRatio = 0;
      let checklistRatio = 0;

      let floodQuizRatio = 0;
      let stormQuizRatio = 0;
      let earthquakeQuizRatio = 0;
      let wildfireQuizRatio = 0;

      // Safety kit module
      if (safetyKitRaw) {
        const parsed: SafetyKitData = JSON.parse(safetyKitRaw);
        const checkedItems = parsed.checked || {};
        const completedCount = Object.values(checkedItems).filter(Boolean).length;

        safetyRatio = completedCount / SAFETY_KIT_TOTAL_ITEMS;

        if (completedCount > 0) startedAnyModule = true;

        safetyPoints += completedCount * 10;

        if (parsed.badge) {
          safetyPoints += 50;
          unlockedBadges.push("Safety Kit Starter");
          modulesDone += 1;
        }

        points += safetyPoints;

        setSafetyKitCompleted(completedCount);
        setBadgeEarned(parsed.badge || false);
        setConfidence(parsed.confidence ?? null);
        setMode(parsed.mode ?? null);
      } else {
        setSafetyKitCompleted(0);
        setBadgeEarned(false);
        setConfidence(null);
        setMode(null);
      }

      // Evacuation module
      if (evacuationRaw) {
        const parsed: EvacuationPlanData = JSON.parse(evacuationRaw);
        const checkedItems = parsed.checked || {};
        const completedCount = Object.values(checkedItems).filter(Boolean).length;

        evacuationRatio = completedCount / EVACUATION_PLAN_TOTAL_ITEMS;

        if (completedCount > 0) startedAnyModule = true;

        evacPoints += completedCount * 10;

        if (parsed.badge) {
          evacPoints += 60;
          unlockedBadges.push("Evacuation Ready");
          modulesDone += 1;
        }

        points += evacPoints;

        setEvacuationCompleted(completedCount);
        setEvacuationBadgeEarned(parsed.badge || false);
        setEvacuationConfidence(parsed.confidence ?? null);
        setEvacuationDecision(parsed.decisionReady ?? null);
      } else {
        setEvacuationCompleted(0);
        setEvacuationBadgeEarned(false);
        setEvacuationConfidence(null);
        setEvacuationDecision(null);
      }

      // Emergency contacts module
      if (contactsRaw) {
        const parsed: EmergencyContactsData = JSON.parse(contactsRaw);

        const completedFields = [
          (parsed.primaryContact || "").trim().length > 0,
          (parsed.backupContact || "").trim().length > 0,
          (parsed.meetingPoint || "").trim().length > 0,
          parsed.communicationMethod !== null &&
            parsed.communicationMethod !== undefined,
        ].filter(Boolean).length;

        contactsRatio = completedFields / EMERGENCY_CONTACTS_TOTAL_FIELDS;

        if (completedFields > 0) startedAnyModule = true;

        contactPoints += completedFields * 15;

        if (parsed.badge) {
          contactPoints += 50;
          unlockedBadges.push("Emergency Contacts Ready");
          modulesDone += 1;
        }

        points += contactPoints;

        setContactsCompleted(completedFields);
        setContactsBadgeEarned(parsed.badge || false);
        setContactsConfidence(parsed.confidence ?? null);
        setCommunicationMethod(parsed.communicationMethod ?? null);
      } else {
        setContactsCompleted(0);
        setContactsBadgeEarned(false);
        setContactsConfidence(null);
        setCommunicationMethod(null);
      }

      // Custom checklist module
      if (checklistRaw) {
        const parsedChecklists = normalizeChecklistData(checklistRaw);
        const allItems = parsedChecklists.flatMap((checklist) =>
          Array.isArray(checklist.items) ? checklist.items : []
        );
        const completedCount = allItems.filter((item) => item.completed).length;
        const totalItems = allItems.length;
        const totalLists = parsedChecklists.length;

        checklistRatio = totalItems > 0 ? completedCount / totalItems : 0;

        if (totalItems > 0) {
          startedAnyModule = true;
          modulesDone += 1;
          unlockedBadges.push("Checklist Creator");
        }

        customChecklistPoints += completedCount * 8;

        if (totalItems > 0 && completedCount === totalItems) {
          customChecklistPoints += 40;
          unlockedBadges.push("Checklist Completed");
        }

        points += customChecklistPoints;

        setChecklistCount(totalLists);
        setChecklistCompleted(completedCount);
        setChecklistTotal(totalItems);
      } else {
        setChecklistCount(0);
        setChecklistCompleted(0);
        setChecklistTotal(0);
      }

      // Quiz module
      if (quizRaw) {
        const parsed: QuizData = JSON.parse(quizRaw);
        const answers = parsed.selectedAnswers || {};
        const submitted = parsed.submitted || false;

        const totalCorrect = QUIZ_QUESTIONS.reduce((total, question) => {
          return total + (answers[question.id] === question.correctIndex ? 1 : 0);
        }, 0);

        const percentage = QUIZ_QUESTIONS.length
          ? Math.round((totalCorrect / QUIZ_QUESTIONS.length) * 100)
          : 0;

        const floodQuestions = QUIZ_QUESTIONS.filter((item) => item.disaster === "Flood");
        const stormQuestions = QUIZ_QUESTIONS.filter((item) => item.disaster === "Storm");
        const earthquakeQuestions = QUIZ_QUESTIONS.filter(
          (item) => item.disaster === "Earthquake"
        );
        const wildfireQuestions = QUIZ_QUESTIONS.filter(
          (item) => item.disaster === "Wildfire"
        );

        const floodCorrect = floodQuestions.reduce((total, question) => {
          return total + (answers[question.id] === question.correctIndex ? 1 : 0);
        }, 0);
        const stormCorrect = stormQuestions.reduce((total, question) => {
          return total + (answers[question.id] === question.correctIndex ? 1 : 0);
        }, 0);
        const earthquakeCorrect = earthquakeQuestions.reduce((total, question) => {
          return total + (answers[question.id] === question.correctIndex ? 1 : 0);
        }, 0);
        const wildfireCorrect = wildfireQuestions.reduce((total, question) => {
          return total + (answers[question.id] === question.correctIndex ? 1 : 0);
        }, 0);

        floodQuizRatio = submitted && floodQuestions.length
          ? floodCorrect / floodQuestions.length
          : 0;
        stormQuizRatio = submitted && stormQuestions.length
          ? stormCorrect / stormQuestions.length
          : 0;
        earthquakeQuizRatio = submitted && earthquakeQuestions.length
          ? earthquakeCorrect / earthquakeQuestions.length
          : 0;
        wildfireQuizRatio = submitted && wildfireQuestions.length
          ? wildfireCorrect / wildfireQuestions.length
          : 0;

        if (submitted) {
          startedAnyModule = true;
          qPoints += getQuizPoints(totalCorrect, percentage);
          unlockedBadges.push("Quiz Completed");
          modulesDone += 1;
        }

        points += qPoints;

        setQuizSubmitted(submitted);
        setQuizScore(totalCorrect);
        setQuizPercentage(submitted ? percentage : 0);

        setFloodQuizScore(submitted ? Math.round(floodQuizRatio * 100) : 0);
        setStormQuizScore(submitted ? Math.round(stormQuizRatio * 100) : 0);
        setEarthquakeQuizScore(submitted ? Math.round(earthquakeQuizRatio * 100) : 0);
        setWildfireQuizScore(submitted ? Math.round(wildfireQuizRatio * 100) : 0);
      } else {
        setQuizSubmitted(false);
        setQuizScore(0);
        setQuizPercentage(0);
        setFloodQuizScore(0);
        setStormQuizScore(0);
        setEarthquakeQuizScore(0);
        setWildfireQuizScore(0);
      }

      // Disaster-specific score mix
      const score = Math.min(100, Math.round((points / 450) * 100));

      const flood = Math.round(
        (evacuationRatio * 0.4 +
          contactsRatio * 0.15 +
          checklistRatio * 0.1 +
          floodQuizRatio * 0.35) *
          100
      );

      const storm = Math.round(
        (safetyRatio * 0.35 +
          contactsRatio * 0.15 +
          checklistRatio * 0.1 +
          stormQuizRatio * 0.4) *
          100
      );

      const earthquake = Math.round(
        (safetyRatio * 0.25 +
          contactsRatio * 0.1 +
          checklistRatio * 0.15 +
          earthquakeQuizRatio * 0.5) *
          100
      );

      const wildfire = Math.round(
        (evacuationRatio * 0.3 +
          safetyRatio * 0.1 +
          contactsRatio * 0.15 +
          checklistRatio * 0.1 +
          wildfireQuizRatio * 0.35) *
          100
      );

      // User level based on total points
      let userLevel = "Getting Started";

      if (points >= 320) {
        userLevel = "Preparedness Champion";
      } else if (points >= 230) {
        userLevel = "Well Prepared";
      } else if (points >= 130) {
        userLevel = "Building Readiness";
      }

      // Reward summary list
      const rewardList: Reward[] = [
        {
          id: "reward-1",
          title: "First Step",
          description: "Started at least one preparedness activity",
          unlocked: startedAnyModule,
        },
        {
          id: "reward-2",
          title: "Safety Kit Reward",
          description: "Completed the Safety Kit module",
          unlocked: unlockedBadges.includes("Safety Kit Starter"),
        },
        {
          id: "reward-3",
          title: "Evacuation Reward",
          description: "Completed the Evacuation Plan module",
          unlocked: unlockedBadges.includes("Evacuation Ready"),
        },
        {
          id: "reward-4",
          title: "Contacts Reward",
          description: "Completed the Emergency Contacts module",
          unlocked: unlockedBadges.includes("Emergency Contacts Ready"),
        },
        {
          id: "reward-5",
          title: "Checklist Reward",
          description: "Created and used a custom checklist",
          unlocked: unlockedBadges.includes("Checklist Creator"),
        },
        {
          id: "reward-6",
          title: "Knowledge Reward",
          description: "Completed the preparedness quiz",
          unlocked: unlockedBadges.includes("Quiz Completed"),
        },
        {
          id: "reward-7",
          title: "Preparedness Champion",
          description: "Reached a high preparedness score",
          unlocked: points >= 320,
        },
      ];

      // Next goal text based on progress
      let goalText = "Complete your first preparedness task.";

      if (modulesDone === 1) {
        goalText = "Complete another module to build your readiness.";
      } else if (modulesDone === 2) {
        goalText = "You are doing well. Finish one more module to level up.";
      } else if (modulesDone === 3) {
        goalText = "Keep going. Try your checklist or quiz next.";
      } else if (modulesDone === 4) {
        goalText =
          "Almost there. Complete all features to maximize your score.";
      } else if (modulesDone >= 5) {
        goalText = "Excellent work. Keep reviewing your plans regularly.";
      }

      setTotalPoints(points);
      setPreparednessScore(score);
      setBadges(unlockedBadges);
      setRewards(rewardList);
      setLevel(userLevel);
      setSafetyKitPoints(safetyPoints);
      setEvacuationPoints(evacPoints);
      setContactsPoints(contactPoints);
      setChecklistPoints(customChecklistPoints);
      setQuizPoints(qPoints);
      setCompletedModules(modulesDone);
      setNextGoal(goalText);
      setFloodScore(flood);
      setStormScore(storm);
      setEarthquakeScore(earthquake);
      setWildfireScore(wildfire);
    } catch (error) {
      console.log("Error loading profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reload profile whenever the tab is opened again
  useFocusEffect(
    useCallback(() => {
      loadProfileData();
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

  // Gets current location and opens the share sheet
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

  // Simple overall module completion summary
  const modulesCompletedForProgress =
    (badgeEarned ? 1 : 0) +
    (evacuationBadgeEarned ? 1 : 0) +
    (contactsBadgeEarned ? 1 : 0) +
    (checklistTotal > 0 ? 1 : 0) +
    (quizSubmitted ? 1 : 0);

  const totalModules = 5;
  const overallProgress = Math.round(
    (modulesCompletedForProgress / totalModules) * 100
  );

  // Avatar initials
  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SR";

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingSafeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#7A1628" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Small stat card
  const InfoCard = ({
    title,
    value,
    subtitle,
  }: {
    title: string;
    value: string | number;
    subtitle: string;
  }) => (
    <View style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>{title}</Text>
      <Text style={styles.infoCardValue}>{value}</Text>
      <Text style={styles.infoCardSubtitle}>{subtitle}</Text>
    </View>
  );

  // Detailed module status card
  const DetailCard = ({
    title,
    lineOne,
    lineTwo,
    lineThree,
    lineFour,
  }: {
    title: string;
    lineOne: string;
    lineTwo?: string;
    lineThree?: string;
    lineFour?: string;
  }) => (
    <View style={styles.detailCard}>
      <Text style={styles.detailTitle}>{title}</Text>
      <Text style={styles.detailText}>{lineOne}</Text>
      {lineTwo ? <Text style={styles.detailText}>{lineTwo}</Text> : null}
      {lineThree ? <Text style={styles.detailText}>{lineThree}</Text> : null}
      {lineFour ? <Text style={styles.detailText}>{lineFour}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergency shortcut banner */}
        <Pressable
          style={styles.emergencyBanner}
          onPress={() => setEmergencyVisible(true)}
        >
          <View>
            <Text style={styles.emergencyBannerEyebrow}>Emergency access</Text>
            <Text style={styles.emergencyBannerTitle}>Emergency Button</Text>
            <Text style={styles.emergencyBannerText}>
              One place to call emergency services or share your live location.
            </Text>
          </View>
          <Text style={styles.emergencyBannerAction}>Open</Text>
        </Pressable>

        {/* Main profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.profileTextWrap}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userLevel}>{level}</Text>

            <View style={styles.focusChip}>
              <Text style={styles.focusChipText}>{disasterFocusLabel}</Text>
            </View>
          </View>

          <Pressable
            style={styles.settingsButton}
            onPress={() => router.push("/settings")}
          >
            <Text style={styles.settingsButtonText}>Settings</Text>
          </Pressable>
        </View>

        {/* Main preparedness score panel */}
        <View style={styles.scorePanel}>
          <View style={styles.scoreRowTop}>
            <View>
              <Text style={styles.scoreLabel}>Preparedness Score</Text>
              <Text style={styles.scoreValue}>{preparednessScore}%</Text>
            </View>

            <View style={styles.scoreSideStat}>
              <Text style={styles.scoreSideStatValue}>{completedModules}</Text>
              <Text style={styles.scoreSideStatLabel}>Modules done</Text>
            </View>
          </View>

          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${preparednessScore}%` }]}
            />
          </View>

          <Text style={styles.scoreDescription}>
            Your score reflects your current completion across key preparedness
            activities.
          </Text>
        </View>

        {/* Small top summary cards */}
        <View style={styles.topStatsRow}>
          <InfoCard
            title="Points"
            value={totalPoints}
            subtitle="Total earned across modules"
          />
          <InfoCard
            title="Badges"
            value={badges.length}
            subtitle="Milestones unlocked so far"
          />
        </View>

        {/* Next goal card */}
        <View style={styles.nextGoalCard}>
          <Text style={styles.sectionMiniTitle}>Next Goal</Text>
          <Text style={styles.nextGoalText}>{nextGoal}</Text>
        </View>

        {/* Disaster scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disaster Scores</Text>
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Flood</Text>
              <Text style={styles.metricValue}>{floodScore}%</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Storm</Text>
              <Text style={styles.metricValue}>{stormScore}%</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Earthquake</Text>
              <Text style={styles.metricValue}>{earthquakeScore}%</Text>
            </View>
            <View style={styles.metricRowLast}>
              <Text style={styles.metricLabel}>Wildfire</Text>
              <Text style={styles.metricValue}>{wildfireScore}%</Text>
            </View>
          </View>
        </View>

        {/* Overall progress and points breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Overview</Text>

          <View style={styles.topStatsRow}>
            <InfoCard
              title="Overall Progress"
              value={`${overallProgress}%`}
              subtitle={`${modulesCompletedForProgress}/${totalModules} modules completed`}
            />
            <InfoCard
              title="Quiz"
              value={quizSubmitted ? `${quizScore}/${QUIZ_QUESTIONS.length}` : "Not done"}
              subtitle={
                quizSubmitted
                  ? `${quizPercentage}% score`
                  : "Complete it to improve readiness"
              }
            />
          </View>

          <View style={styles.card}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Safety Kit</Text>
              <Text style={styles.metricValue}>{safetyKitPoints} pts</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Evacuation Plan</Text>
              <Text style={styles.metricValue}>{evacuationPoints} pts</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Emergency Contacts</Text>
              <Text style={styles.metricValue}>{contactsPoints} pts</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Checklist</Text>
              <Text style={styles.metricValue}>{checklistPoints} pts</Text>
            </View>
            <View style={styles.metricRowLast}>
              <Text style={styles.metricLabel}>Quiz</Text>
              <Text style={styles.metricValue}>{quizPoints} pts</Text>
            </View>
          </View>
        </View>

        {/* Quiz breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiz Breakdown</Text>
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Flood Quiz Score</Text>
              <Text style={styles.metricValue}>{floodQuizScore}%</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Storm Quiz Score</Text>
              <Text style={styles.metricValue}>{stormQuizScore}%</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Earthquake Quiz Score</Text>
              <Text style={styles.metricValue}>{earthquakeQuizScore}%</Text>
            </View>
            <View style={styles.metricRowLast}>
              <Text style={styles.metricLabel}>Wildfire Quiz Score</Text>
              <Text style={styles.metricValue}>{wildfireQuizScore}%</Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.card}>
            {badges.length > 0 ? (
              <View style={styles.badgesWrap}>
                {badges.map((badge, index) => (
                  <View key={`${badge}-${index}`} style={styles.badgeChip}>
                    <Text style={styles.badgeChipText}>{badge}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No badges earned yet.</Text>
            )}
          </View>
        </View>

        {/* Rewards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rewards</Text>
          <View style={styles.card}>
            {rewards.map((reward) => (
              <View key={reward.id} style={styles.rewardRow}>
                <View style={styles.rewardTextWrap}>
                  <Text style={styles.rewardTitle}>{reward.title}</Text>
                  <Text style={styles.rewardDescription}>
                    {reward.description}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.rewardStatus,
                    reward.unlocked
                      ? styles.rewardStatusUnlocked
                      : styles.rewardStatusLocked,
                  ]}
                >
                  {reward.unlocked ? "Unlocked" : "Locked"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Detailed readiness summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Readiness</Text>

          <DetailCard
            title="Safety Kit"
            lineOne={`${safetyKitCompleted} of ${SAFETY_KIT_TOTAL_ITEMS} checklist items completed`}
            lineTwo={`Badge: ${badgeEarned ? "Earned" : "Not yet earned"}`}
            lineThree={`Confidence: ${
              confidence !== null ? `${confidence} / 5` : "Not recorded yet"
            }`}
            lineFour={`Response mode: ${mode ?? "Not selected yet"}`}
          />

          <DetailCard
            title="Evacuation Plan"
            lineOne={`${evacuationCompleted} of ${EVACUATION_PLAN_TOTAL_ITEMS} steps completed`}
            lineTwo={`Badge: ${
              evacuationBadgeEarned ? "Earned" : "Not yet earned"
            }`}
            lineThree={`Confidence: ${
              evacuationConfidence !== null
                ? `${evacuationConfidence} / 5`
                : "Not recorded yet"
            }`}
            lineFour={`Strategy: ${evacuationDecision ?? "Not selected yet"}`}
          />

          <DetailCard
            title="Emergency Contacts"
            lineOne={`${contactsCompleted} of ${EMERGENCY_CONTACTS_TOTAL_FIELDS} fields completed`}
            lineTwo={`Badge: ${
              contactsBadgeEarned ? "Earned" : "Not yet earned"
            }`}
            lineThree={`Confidence: ${
              contactsConfidence !== null
                ? `${contactsConfidence} / 5`
                : "Not recorded yet"
            }`}
            lineFour={`Communication method: ${
              communicationMethod ?? "Not selected yet"
            }`}
          />

          <DetailCard
            title="Custom Checklists"
            lineOne={`${checklistCompleted} of ${checklistTotal} items completed across ${checklistCount} saved ${
              checklistCount === 1 ? "checklist" : "checklists"
            }`}
            lineTwo={
              checklistCount > 0
                ? "Checklist system has been created and is being tracked"
                : "No checklist created yet"
            }
            lineThree={
              checklistCount > 0
                ? `Completion status: ${
                    checklistTotal > 0 && checklistCompleted === checklistTotal
                      ? "All checklist items completed"
                      : "Still in progress"
                  }`
                : undefined
            }
          />

          <DetailCard
            title="Preparedness Quiz"
            lineOne={
              quizSubmitted
                ? `Score: ${quizScore} / ${QUIZ_QUESTIONS.length} (${quizPercentage}%)`
                : "Quiz not submitted yet"
            }
            lineTwo={`Status: ${
              quizSubmitted ? "Completed" : "In progress / not started"
            }`}
            lineThree={`Points earned: ${quizPoints}`}
            lineFour={
              quizSubmitted
                ? `Disaster breakdown — Flood ${floodQuizScore}%, Storm ${stormQuizScore}%, Earthquake ${earthquakeQuizScore}%, Wildfire ${wildfireQuizScore}%`
                : undefined
            }
          />
        </View>
      </ScrollView>

      {/* Emergency modal */}
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
                    Call emergency services or share your current location with
                    someone you trust.
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
                      Sends your current coordinates and a map link using your
                      phone’s share options.
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
    backgroundColor: "#F7F3F4",
  },
  container: {
    flex: 1,
    backgroundColor: "#F7F3F4",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 88,
  },
  loadingSafeArea: {
    flex: 1,
    backgroundColor: "#F7F3F4",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F3F4",
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#7B5C63",
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
  profileHeader: {
    backgroundColor: "#FFFDFD",
    borderWidth: 1,
    borderColor: "#EADADF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: "#4A101B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#FFF6F7",
    fontSize: 24,
    fontWeight: "800",
  },
  profileTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#261215",
    marginBottom: 4,
  },
  userLevel: {
    fontSize: 14,
    color: "#7D5C63",
    fontWeight: "600",
    marginBottom: 10,
  },
  focusChip: {
    alignSelf: "flex-start",
    backgroundColor: "#FBE7EA",
    borderColor: "#F0CCD3",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  focusChipText: {
    color: "#8E2C3E",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  settingsButton: {
    backgroundColor: "#F4ECEE",
    borderWidth: 1,
    borderColor: "#E6D8DC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  settingsButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#5B1B28",
  },
  scorePanel: {
    backgroundColor: "#4A101B",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  scoreRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 12,
  },
  scoreLabel: {
    fontSize: 13,
    color: "#E7BCC3",
    marginBottom: 6,
  },
  scoreValue: {
    fontSize: 38,
    fontWeight: "800",
    color: "#FFF7F8",
  },
  scoreSideStat: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 92,
    alignItems: "center",
  },
  scoreSideStatValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF7F8",
    marginBottom: 2,
  },
  scoreSideStatLabel: {
    fontSize: 11,
    color: "#E7BCC3",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
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
  scoreDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: "#F2D7DB",
  },
  topStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#FFFDFD",
    borderWidth: 1,
    borderColor: "#EADADF",
    borderRadius: 20,
    padding: 16,
  },
  infoCardTitle: {
    fontSize: 13,
    color: "#7D5C63",
    marginBottom: 8,
  },
  infoCardValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2E1418",
    marginBottom: 6,
  },
  infoCardSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#8A6A71",
  },
  nextGoalCard: {
    backgroundColor: "#FFF1F3",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#F0D3D9",
    padding: 18,
    marginBottom: 18,
  },
  sectionMiniTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9F3044",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  nextGoalText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#42161E",
    fontWeight: "600",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2E1418",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#FFFDFD",
    borderWidth: 1,
    borderColor: "#EADADF",
    borderRadius: 22,
    padding: 16,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F1E4E7",
  },
  metricRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 13,
  },
  metricLabel: {
    fontSize: 15,
    color: "#412026",
    fontWeight: "600",
  },
  metricValue: {
    fontSize: 15,
    color: "#7A1628",
    fontWeight: "800",
  },
  badgesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeChip: {
    backgroundColor: "#4A101B",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeChipText: {
    color: "#FFF7F8",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    color: "#7D5C63",
    lineHeight: 21,
  },
  rewardRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1E4E7",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  rewardTextWrap: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2E1418",
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: "#7D5C63",
  },
  rewardStatus: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  rewardStatusUnlocked: {
    color: "#7A1628",
  },
  rewardStatusLocked: {
    color: "#A38B90",
  },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EADADF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#2E1418",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#6F555B",
    marginBottom: 4,
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
    backgroundColor: "#F7F3F4",
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