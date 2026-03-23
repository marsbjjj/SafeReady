import { Link } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TasksScreen() {
  // Reusable task card used for each main activity
  const TaskCard = ({
    label,
    title,
    description,
    href,
    actionText,
  }: {
    label: string;
    title: string;
    description: string;
    href: '/safety-kit' | '/evacuation-plan' | '/emergency-contacts' | '/checklist' | '/quiz';
    actionText: string;
  }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardLabel}>{label}</Text>
        <View style={styles.cardAccentLine} />
      </View>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText}>{description}</Text>

      <Link href={href} style={styles.actionButton}>
        <Text style={styles.actionButtonText}>{actionText}</Text>
      </Link>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Page heading */}
          <View style={styles.headerBlock}>
            <Text style={styles.eyebrow}>Preparedness tasks</Text>
            <Text style={styles.title}>Task Center</Text>
            <Text style={styles.subtitle}>
              Complete guided activities to improve your readiness before an
              emergency happens.
            </Text>
          </View>

          {/* Short intro to the task list */}
          <View style={styles.sectionIntro}>
            <Text style={styles.sectionTitle}>Core Activities</Text>
            <Text style={styles.sectionSubtitle}>
              Start with the essentials, then build extra preparedness through
              your checklist and quiz.
            </Text>
          </View>

          <TaskCard
            label="ESSENTIALS"
            title="Safety Kit"
            description="Build an emergency kit step by step and unlock a preparedness badge."
            href="/safety-kit"
            actionText="Open task"
          />

          <TaskCard
            label="PLANNING"
            title="Evacuation Planning"
            description="Plan routes, shelter options, and response decisions in advance."
            href="/evacuation-plan"
            actionText="Open task"
          />

          <TaskCard
            label="COMMUNICATION"
            title="Emergency Contacts"
            description="Prepare key contacts, meeting points, and a communication method."
            href="/emergency-contacts"
            actionText="Open task"
          />

          <TaskCard
            label="CUSTOM"
            title="Custom Checklist"
            description="Create your own preparedness checklist and track your custom items."
            href="/checklist"
            actionText="Open task"
          />

          <TaskCard
            label="KNOWLEDGE"
            title="Preparedness Quiz"
            description="Test your understanding of basic disaster readiness and response actions."
            href="/quiz"
            actionText="Open quiz"
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F1F2',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F1F2',
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
    borderBottomColor: '#E2D6D9',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#8B1020',
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5E5E5E',
  },
  sectionIntro: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#666666',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8B1020',
    marginRight: 10,
  },
  cardAccentLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D8B7BD',
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5E5E5E',
    marginBottom: 16,
  },
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#8B1020',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});