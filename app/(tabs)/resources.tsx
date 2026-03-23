import React, { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type DisasterType = "All" | "Flood" | "Storm" | "Earthquake" | "Wildfire";

type ResourceItem = {
  id: string;
  type: Exclude<DisasterType, "All">;
  title: string;
  shortDescription: string;
  fullDescription: string;
  steps: string[];
};

type EmergencyContact = {
  id: string;
  service: string;
  number: string;
  note: string;
};

type VideoItem = {
  id: string;
  type: Exclude<DisasterType, "All">;
  title: string;
  source: string;
  description: string;
  url: string;
};

const FILTERS: DisasterType[] = ["All", "Flood", "Storm", "Earthquake", "Wildfire"];

// Main written safety resources shown in the help center
const RESOURCES: ResourceItem[] = [
  {
    id: "flood-1",
    type: "Flood",
    title: "Flood",
    shortDescription: "Read flood safety information and preparedness steps.",
    fullDescription:
      "Floods can happen quickly and become dangerous even in shallow water. They can block roads, damage homes, and make it difficult to move safely. It is important to prepare early, protect important belongings, and know how to move to a safer place.",
    steps: [
      "Move to higher ground as early as possible.",
      "Avoid walking or driving through flood water.",
      "Keep important documents in a waterproof bag.",
      "Prepare emergency supplies in case you need to leave quickly.",
    ],
  },
  {
    id: "storm-1",
    type: "Storm",
    title: "Storm",
    shortDescription: "Read storm preparedness and response guidance.",
    fullDescription:
      "Storms can bring strong winds, heavy rain, and power cuts. They may also cause travel disruption and damage to buildings or outdoor objects. Preparing in advance can reduce risk and make it easier to stay safe during severe weather.",
    steps: [
      "Secure loose outdoor items.",
      "Charge important devices before severe weather.",
      "Keep emergency supplies ready.",
      "Stay indoors if authorities advise it.",
    ],
  },
  {
    id: "earthquake-1",
    type: "Earthquake",
    title: "Earthquake",
    shortDescription: "Read earthquake response and safety information.",
    fullDescription:
      "Earthquakes happen suddenly, so people need to know what to do immediately. The main goal is to protect yourself during shaking and then move carefully afterwards if there are hazards nearby.",
    steps: [
      "Drop, cover, and hold on.",
      "Stay away from windows and heavy objects.",
      "After shaking stops, check for hazards before moving.",
      "Keep emergency contacts and basic supplies ready.",
    ],
  },
  {
    id: "wildfire-1",
    type: "Wildfire",
    title: "Wildfire",
    shortDescription: "Read wildfire preparedness and evacuation guidance.",
    fullDescription:
      "Wildfires can spread very quickly, especially in dry or windy conditions. It is important to prepare essential items in advance and know evacuation routes before an emergency happens.",
    steps: [
      "Know your evacuation routes in advance.",
      "Prepare a bag with essentials and important documents.",
      "Follow evacuation orders immediately if given.",
      "Keep emergency contacts easy to access.",
    ],
  },
];

// External video tutorials
const VIDEO_TUTORIALS: VideoItem[] = [
  {
    id: "video-flood-1",
    type: "Flood",
    title: "Flood preparedness basics",
    source: "American Red Cross",
    description:
      "A short practical overview of how to prepare for flooding and protect yourself early.",
    url: "https://www.youtube.com/watch?v=Glc-1f4Ez00",
  },
  {
    id: "video-flood-2",
    type: "Flood",
    title: "Be ready for floods",
    source: "PreparedBC / public preparedness video",
    description:
      "Useful for users who want another simple video explanation of flood preparation and safety actions.",
    url: "https://www.youtube.com/watch?v=xws0JO0xxho",
  },
  {
    id: "video-storm-1",
    type: "Storm",
    title: "Lightning safety tips",
    source: "National Weather Service",
    description:
      "A practical storm-safety video focused on lightning awareness and safer behavior during severe weather.",
    url: "https://www.youtube.com/watch?v=wVFqfCB_GkU",
  },
  {
    id: "video-earthquake-1",
    type: "Earthquake",
    title: "Earthquake preparedness: how to stay safe",
    source: "Preparedness tutorial",
    description:
      "A simple earthquake safety explainer covering protective actions and readiness habits.",
    url: "https://www.youtube.com/watch?v=Z4suAKDcaCU",
  },
  {
    id: "video-earthquake-2",
    type: "Earthquake",
    title: "Earthquake preparedness",
    source: "Preparedness tutorial",
    description:
      "A second earthquake tutorial option for users who prefer a different explanation style.",
    url: "https://www.youtube.com/watch?v=sqiV-fWRXQ8",
  },
  {
    id: "video-wildfire-1",
    type: "Wildfire",
    title: "How to evacuate safely from wildfires",
    source: "Wildfire safety tutorial",
    description:
      "Focused on leaving early, moving safely, and understanding practical wildfire evacuation decisions.",
    url: "https://www.youtube.com/watch?v=kb95NzvM92g",
  },
];

// Emergency contact list shown on the screen
const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: "police",
    service: "Police",
    number: "17",
    note: "Emergency police line",
  },
  {
    id: "fire",
    service: "Fire Department",
    number: "18",
    note: "Emergency fire line",
  },
  {
    id: "ambulance",
    service: "Ambulance / Medical Emergency",
    number: "17",
    note: "Emergency medical support line",
  },
];

export default function ResourcesScreen() {
  const [selectedFilter, setSelectedFilter] = useState<DisasterType>("All");
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);

  // Filter written resources based on the selected disaster type
  const filteredResources = useMemo(() => {
    return selectedFilter === "All"
      ? RESOURCES
      : RESOURCES.filter((item) => item.type === selectedFilter);
  }, [selectedFilter]);

  // Filter videos the same way as the written resources
  const filteredVideos = useMemo(() => {
    return selectedFilter === "All"
      ? VIDEO_TUTORIALS
      : VIDEO_TUTORIALS.filter((item) => item.type === selectedFilter);
  }, [selectedFilter]);

  const handleCall = async (number: string) => {
    const url = `tel:${number}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Unable to open phone app", `Could not call ${number}.`);
    }
  };

  const handleOpenVideo = async (video: VideoItem) => {
    try {
      const supported = await Linking.canOpenURL(video.url);

      if (!supported) {
        Alert.alert("Unable to open link", "This video link could not be opened.");
        return;
      }

      await Linking.openURL(video.url);
    } catch (error) {
      Alert.alert("Unable to open link", "This video link could not be opened.");
    }
  };

  // Open the selected written resource in the modal
  const openResource = (resource: ResourceItem) => {
    setSelectedResource(resource);
  };

  const closeResource = () => {
    setSelectedResource(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top intro card */}
        <View style={styles.headerCard}>
          <Text style={styles.eyebrow}>Resources & guidance</Text>
          <Text style={styles.title}>Help Center</Text>
          <Text style={styles.subtitle}>
            Read safety guidance, review disaster information, and keep emergency
            support details close by.
          </Text>
        </View>

        {/* Disaster filter buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter by disaster type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {FILTERS.map((item) => {
                const active = selectedFilter === item;

                return (
                  <Pressable
                    key={item}
                    style={[
                      styles.filterButton,
                      active && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedFilter(item)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        active && styles.filterButtonTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Written disaster guidance */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Disaster Information</Text>
            <Text style={styles.sectionMeta}>
              {filteredResources.length} topic{filteredResources.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {filteredResources.map((resource) => (
            <Pressable
              key={resource.id}
              style={styles.resourceCard}
              onPress={() => openResource(resource)}
            >
              <View style={styles.resourceCardTop}>
                <View style={styles.typeChip}>
                  <Text style={styles.typeChipText}>{resource.type}</Text>
                </View>
                <Text style={styles.openLabel}>Open</Text>
              </View>

              <Text style={styles.resourceTitle}>{resource.title}</Text>
              <Text style={styles.resourceDescription}>
                {resource.shortDescription}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Video tutorial section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Video Hub</Text>
            <Text style={styles.sectionMeta}>
              {filteredVideos.length} video{filteredVideos.length !== 1 ? "s" : ""}
            </Text>
          </View>

          <View style={styles.videoInfoCard}>
            <Text style={styles.videoInfoTitle}>Optional external tutorials</Text>
            <Text style={styles.videoInfoText}>
              These videos open on YouTube and are meant to support the written
              guidance in SafeReady, not replace it.
            </Text>
          </View>

          {filteredVideos.map((video) => (
            <Pressable
              key={video.id}
              style={styles.videoCard}
              onPress={() => handleOpenVideo(video)}
            >
              <View style={styles.videoCardTop}>
                <View style={styles.typeChip}>
                  <Text style={styles.typeChipText}>{video.type}</Text>
                </View>
                <Text style={styles.videoOpenLabel}>YouTube</Text>
              </View>

              <Text style={styles.videoTitle}>{video.title}</Text>
              <Text style={styles.videoSource}>{video.source}</Text>
              <Text style={styles.videoDescription}>{video.description}</Text>

              <View style={styles.videoFooter}>
                <Text style={styles.videoAction}>Watch tutorial</Text>
              </View>
            </Pressable>
          ))}

          {filteredVideos.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>No videos in this filter</Text>
              <Text style={styles.emptyStateText}>
                Try another disaster category to view available tutorials.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Quick emergency contact section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>

          {EMERGENCY_CONTACTS.map((contact) => (
            <Pressable
              key={contact.id}
              style={styles.contactCard}
              onPress={() => handleCall(contact.number)}
            >
              <View style={styles.contactTextWrap}>
                <Text style={styles.contactService}>{contact.service}</Text>
                <Text style={styles.contactNote}>{contact.note}</Text>
              </View>

              <View style={styles.contactRight}>
                <Text style={styles.contactNumber}>{contact.number}</Text>
                <Text style={styles.contactAction}>Call</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* General app help and reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help Center</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>How to Use the App</Text>
            <Text style={styles.infoLine}>
              Complete preparedness tasks one step at a time.
            </Text>
            <Text style={styles.infoLine}>
              Track your score, progress, badges, and rewards.
            </Text>
            <Text style={styles.infoLine}>
              Use Alerts to review simulated emergency warnings.
            </Text>
            <Text style={styles.infoLine}>
              Return here whenever you want fast safety guidance and support contacts.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Quick Tips</Text>
            <Text style={styles.infoLine}>
              Start with small actions and build gradually.
            </Text>
            <Text style={styles.infoLine}>
              Keep your emergency contacts updated.
            </Text>
            <Text style={styles.infoLine}>
              Review your plans regularly, not only during emergencies.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal for reading the full written resource */}
      <Modal
        visible={!!selectedResource}
        animationType="slide"
        transparent
        onRequestClose={closeResource}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalTypeChip}>
                    <Text style={styles.modalTypeChipText}>
                      {selectedResource?.type}
                    </Text>
                  </View>
                  <Text style={styles.modalTitle}>{selectedResource?.title}</Text>
                </View>

                <Pressable style={styles.closeButton} onPress={closeResource}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalDescription}>
                  {selectedResource?.fullDescription}
                </Text>

                <Text style={styles.modalStepsTitle}>Key Safety Steps</Text>

                {selectedResource?.steps.map((step, index) => (
                  <View key={index} style={styles.stepCard}>
                    <View style={styles.stepNumberCircle}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
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
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#EADFE2",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#7A1628",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#23181B",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6D5B61",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#23181B",
    marginBottom: 12,
  },
  sectionMeta: {
    fontSize: 13,
    color: "#7D6D73",
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 12,
  },
  filterButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#EADFE2",
  },
  filterButtonActive: {
    backgroundColor: "#6C1827",
    borderColor: "#6C1827",
  },
  filterButtonText: {
    color: "#3B2C31",
    fontWeight: "700",
  },
  filterButtonTextActive: {
    color: "#FFF7F8",
  },
  resourceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EADFE2",
  },
  resourceCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeChip: {
    backgroundColor: "#F6ECEE",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7A1628",
  },
  openLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7D6D73",
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#23181B",
    marginBottom: 8,
  },
  resourceDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6D5B61",
  },
  videoInfoCard: {
    backgroundColor: "#FFF6F7",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECD6DB",
  },
  videoInfoTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#23181B",
    marginBottom: 6,
  },
  videoInfoText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6D5B61",
  },
  videoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EADFE2",
  },
  videoCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  videoOpenLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7A1628",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#23181B",
    marginBottom: 6,
  },
  videoSource: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7A1628",
    marginBottom: 8,
  },
  videoDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6D5B61",
    marginBottom: 14,
  },
  videoFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EFE5E8",
  },
  videoAction: {
    fontSize: 14,
    fontWeight: "800",
    color: "#23181B",
  },
  emptyStateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EADFE2",
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#23181B",
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6D5B61",
  },
  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EADFE2",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  contactService: {
    fontSize: 16,
    fontWeight: "800",
    color: "#23181B",
    marginBottom: 6,
  },
  contactNote: {
    fontSize: 14,
    color: "#6D5B61",
    lineHeight: 20,
  },
  contactRight: {
    alignItems: "flex-end",
  },
  contactNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#7A1628",
    marginBottom: 4,
  },
  contactAction: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7D6D73",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EADFE2",
  },
  infoCardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#23181B",
    marginBottom: 10,
  },
  infoLine: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6D5B61",
    marginBottom: 8,
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
    minHeight: "88%",
    maxHeight: "92%",
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
  modalTypeChip: {
    alignSelf: "flex-start",
    backgroundColor: "#F6ECEE",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 10,
  },
  modalTypeChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7A1628",
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#23181B",
    lineHeight: 32,
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
  modalDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: "#4D3B40",
    marginBottom: 20,
  },
  modalStepsTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#23181B",
    marginBottom: 12,
  },
  stepCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EADFE2",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6C1827",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 1,
  },
  stepNumberText: {
    color: "#FFF7F8",
    fontWeight: "800",
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: "#4D3B40",
  },
});