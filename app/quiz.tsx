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

const QUIZ_STORAGE_KEY = "preparedness:quiz";

type Question = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

type QuizData = {
  selectedAnswers?: Record<string, number>;
  submitted?: boolean;
};

// Quiz question list used in the preparedness knowledge check
const QUESTIONS: Question[] = [
  {
    id: "q1",
    prompt: "What should you do first during a flash flood warning?",
    options: [
      "Drive through shallow flood water",
      "Move to higher ground",
      "Wait outside to watch conditions",
      "Open all windows",
    ],
    correctIndex: 1,
  },
  {
    id: "q2",
    prompt: "Why is it useful to prepare an emergency kit before a disaster?",
    options: [
      "It reduces the need for planning",
      "It helps you respond quickly with essential supplies",
      "It replaces evacuation planning",
      "It guarantees safety in every emergency",
    ],
    correctIndex: 1,
  },
  {
    id: "q3",
    prompt: "Which item is most appropriate for a basic emergency kit?",
    options: [
      "Gaming console",
      "Decorative lights",
      "First aid supplies",
      "Glass bottles only",
    ],
    correctIndex: 2,
  },
  {
    id: "q4",
    prompt: "If authorities advise evacuation, what is the best response?",
    options: [
      "Ignore it unless neighbours leave first",
      "Delay until conditions become worse",
      "Follow the evacuation guidance promptly",
      "Stay home and search social media",
    ],
    correctIndex: 2,
  },
  {
    id: "q5",
    prompt: "What is the main purpose of emergency contact planning?",
    options: [
      "To avoid learning safety procedures",
      "To make communication easier during disruptions",
      "To replace official alerts",
      "To reduce the need for preparedness tasks",
    ],
    correctIndex: 1,
  },
];

export default function QuizScreen() {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>(
    {}
  );
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Save the user's current quiz progress locally
  const saveQuizData = async (
    answers: Record<string, number>,
    isSubmitted: boolean
  ) => {
    try {
      const payload: QuizData = {
        selectedAnswers: answers,
        submitted: isSubmitted,
      };

      await AsyncStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.log("Error saving quiz data:", error);
    }
  };

  // Load any saved quiz answers when the screen opens
  const loadQuizData = async () => {
    try {
      setLoading(true);

      const saved = await AsyncStorage.getItem(QUIZ_STORAGE_KEY);

      if (!saved) {
        setSelectedAnswers({});
        setSubmitted(false);
        return;
      }

      const parsed: QuizData = JSON.parse(saved);

      setSelectedAnswers(parsed.selectedAnswers || {});
      setSubmitted(parsed.submitted || false);
    } catch (error) {
      console.log("Error loading quiz data:", error);
      setSelectedAnswers({});
      setSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizData();
  }, []);

  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = answeredCount === QUESTIONS.length;

  // Calculate total score based on correct answers
  const score = useMemo(() => {
    return QUESTIONS.reduce((total, question) => {
      return (
        total +
        (selectedAnswers[question.id] === question.correctIndex ? 1 : 0)
      );
    }, 0);
  }, [selectedAnswers]);

  const percentage = Math.round((score / QUESTIONS.length) * 100);
  const progressPercent = Math.round((answeredCount / QUESTIONS.length) * 100);

  // Save each selected answer unless the quiz was already submitted
  const selectAnswer = async (questionId: string, optionIndex: number) => {
    if (submitted) return;

    const updatedAnswers = {
      ...selectedAnswers,
      [questionId]: optionIndex,
    };

    setSelectedAnswers(updatedAnswers);
    await saveQuizData(updatedAnswers, false);
  };

  // Small feedback message shown after submission
  const resultMessage = () => {
    if (percentage >= 80) {
      return "Excellent. You demonstrated strong preparedness knowledge.";
    }
    if (percentage >= 60) {
      return "Good work. You understand many key preparedness actions.";
    }
    return "A good start. Review the tasks and resources to strengthen your preparedness.";
  };

  const submitQuiz = async () => {
    if (!allAnswered) {
      Alert.alert(
        "Complete all questions",
        "Please answer every question before submitting the quiz."
      );
      return;
    }

    setSubmitted(true);
    await saveQuizData(selectedAnswers, true);
  };

  // Fully clear saved quiz data
  const performResetQuiz = async () => {
    try {
      const emptyQuiz: QuizData = {
        selectedAnswers: {},
        submitted: false,
      };

      await AsyncStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(emptyQuiz));
      setSelectedAnswers({});
      setSubmitted(false);
    } catch (error) {
      console.log("Error resetting quiz data:", error);
      Alert.alert("Error", "Unable to reset quiz right now.");
    }
  };

  const resetQuiz = () => {
    Alert.alert("Reset quiz?", "This will clear your saved quiz answers.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          performResetQuiz();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Page heading */}
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>Knowledge check</Text>
          <Text style={styles.title}>Preparedness Quiz</Text>
          <Text style={styles.subtitle}>
            Test your understanding of basic disaster preparedness and response
            decisions.
          </Text>
        </View>

        {/* Quiz progress overview */}
        <View style={styles.quizOverview}>
          <View style={styles.quizOverviewLeft}>
            <Text style={styles.quizOverviewLabel}>Answered</Text>
            <Text style={styles.quizOverviewValue}>
              {loading ? "..." : `${answeredCount} / ${QUESTIONS.length}`}
            </Text>
          </View>

          <View style={styles.quizOverviewRight}>
            <Text style={styles.quizOverviewStatus}>
              {submitted ? "Submitted" : "In progress"}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${loading ? 0 : progressPercent}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Question list */}
        {QUESTIONS.map((question, qIndex) => (
          <View key={question.id} style={styles.questionBlock}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>Question {qIndex + 1}</Text>
            </View>

            <Text style={styles.questionTitle}>{question.prompt}</Text>

            <View style={styles.optionsGroup}>
              {question.options.map((option, optionIndex) => {
                const isSelected = selectedAnswers[question.id] === optionIndex;
                const isCorrect = question.correctIndex === optionIndex;

                return (
                  <Pressable
                    key={option}
                    onPress={() => selectAnswer(question.id, optionIndex)}
                    style={[
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                      submitted && isCorrect && styles.optionRowCorrect,
                      submitted &&
                        isSelected &&
                        !isCorrect &&
                        styles.optionRowIncorrect,
                    ]}
                  >
                    {/* Option marker circle */}
                    <View
                      style={[
                        styles.optionMarker,
                        isSelected && styles.optionMarkerSelected,
                        submitted && isCorrect && styles.optionMarkerCorrect,
                        submitted &&
                          isSelected &&
                          !isCorrect &&
                          styles.optionMarkerIncorrect,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionMarkerText,
                          (isSelected || (submitted && isCorrect)) &&
                            styles.optionMarkerTextActive,
                        ]}
                      >
                        {String.fromCharCode(65 + optionIndex)}
                      </Text>
                    </View>

                    <Text style={styles.optionText}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Submit button before submission, result panel after */}
        {!submitted ? (
          <Pressable
            style={[
              styles.submitButton,
              !allAnswered && styles.submitButtonDisabled,
            ]}
            onPress={submitQuiz}
            disabled={!allAnswered}
          >
            <Text style={styles.submitText}>Submit Quiz</Text>
          </Pressable>
        ) : (
          <View style={styles.resultPanel}>
            <Text style={styles.resultEyebrow}>Quiz Result</Text>
            <Text style={styles.resultScore}>
              {score} / {QUESTIONS.length} ({percentage}%)
            </Text>
            <Text style={styles.resultMessage}>{resultMessage()}</Text>
          </View>
        )}

        {/* Reset button */}
        <Pressable style={styles.resetButton} onPress={resetQuiz}>
          <Text style={styles.resetText}>Reset Quiz</Text>
        </Pressable>
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
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5E5E5E",
  },
  quizOverview: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
    flexDirection: "row",
    gap: 14,
  },
  quizOverviewLeft: {
    width: 90,
  },
  quizOverviewLabel: {
    fontSize: 12,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    fontWeight: "700",
  },
  quizOverviewValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111111",
  },
  quizOverviewRight: {
    flex: 1,
    justifyContent: "center",
  },
  quizOverviewStatus: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8B1020",
    marginBottom: 10,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#E7E1E2",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#8B1020",
    borderRadius: 999,
  },
  questionBlock: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
  },
  questionHeader: {
    marginBottom: 10,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B1020",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  questionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111111",
    lineHeight: 24,
    marginBottom: 14,
  },
  optionsGroup: {
    gap: 10,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    backgroundColor: "#F8F8F8",
  },
  optionRowSelected: {
    borderColor: "#8B1020",
    backgroundColor: "#F8EEF0",
  },
  optionRowCorrect: {
    borderColor: "#2E7D32",
    backgroundColor: "#EDF7EE",
  },
  optionRowIncorrect: {
    borderColor: "#A12B2B",
    backgroundColor: "#FAECEC",
  },
  optionMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E3E3E3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 1,
  },
  optionMarkerSelected: {
    backgroundColor: "#8B1020",
  },
  optionMarkerCorrect: {
    backgroundColor: "#2E7D32",
  },
  optionMarkerIncorrect: {
    backgroundColor: "#A12B2B",
  },
  optionMarkerText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#444444",
  },
  optionMarkerTextActive: {
    color: "#FFFFFF",
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: "#111111",
  },
  submitButton: {
    backgroundColor: "#111111",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  resultPanel: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 10,
    padding: 16,
    marginTop: 4,
  },
  resultEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B1020",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 10,
  },
  resultMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5E5E5E",
  },
  resetButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#E7E1E2",
  },
  resetText: {
    fontWeight: "700",
    color: "#111111",
  },
});