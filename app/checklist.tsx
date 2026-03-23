import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
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

// Storage key used to save all custom checklist data locally
const STORAGE_KEY = "preparedness:custom-checklist";

type ChecklistItem = {
  id: string;
  label: string;
  completed: boolean;
};

type SavedChecklist = {
  id: string;
  title: string;
  items: ChecklistItem[];
  createdAt: string;
};

// Old checklist format kept here so older saved data can still be loaded
type LegacyChecklistData = {
  title: string;
  items: ChecklistItem[];
};

export default function CustomChecklistScreen() {
  const [checklists, setChecklists] = useState<SavedChecklist[]>([]);
  const [expandedChecklistId, setExpandedChecklistId] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistItemText, setNewChecklistItemText] = useState("");
  const [draftItems, setDraftItems] = useState<ChecklistItem[]>([]);

  // Load saved checklists when the screen first opens
  useEffect(() => {
    loadChecklists();
  }, []);

  // Save any checklist changes automatically
  useEffect(() => {
    saveChecklists();
  }, [checklists]);

  const loadChecklists = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);

      if (!saved) {
        setChecklists([]);
        return;
      }

      const parsed = JSON.parse(saved);

      // New format: array of saved checklists
      if (Array.isArray(parsed)) {
        setChecklists(parsed);
        return;
      }

      // Legacy format migration: single checklist object to array
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof parsed.title === "string" &&
        Array.isArray(parsed.items)
      ) {
        const legacyData = parsed as LegacyChecklistData;

        const migratedChecklist: SavedChecklist = {
          id: `${Date.now()}`,
          title: legacyData.title || "My Custom Preparedness Checklist",
          items: legacyData.items || [],
          createdAt: new Date().toISOString(),
        };

        const migratedList = [migratedChecklist];
        setChecklists(migratedList);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migratedList));
        return;
      }

      setChecklists([]);
    } catch (error) {
      console.log("Error loading custom checklists:", error);
    }
  };

  const saveChecklists = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checklists));
    } catch (error) {
      console.log("Error saving custom checklists:", error);
    }
  };

  // Start a fresh checklist form
  const startNewChecklist = () => {
    setShowCreateForm(true);
    setNewChecklistTitle("");
    setNewChecklistItemText("");
    setDraftItems([]);
  };

  // Close the form and clear temporary inputs
  const cancelNewChecklist = () => {
    setShowCreateForm(false);
    setNewChecklistTitle("");
    setNewChecklistItemText("");
    setDraftItems([]);
  };

  const addDraftItem = () => {
    const trimmed = newChecklistItemText.trim();

    if (!trimmed) {
      Alert.alert("Empty item", "Please enter a checklist item first.");
      return;
    }

    const newItem: ChecklistItem = {
      id: `${Date.now()}`,
      label: trimmed,
      completed: false,
    };

    setDraftItems((prev) => [...prev, newItem]);
    setNewChecklistItemText("");
  };

  const removeDraftItem = (id: string) => {
    setDraftItems((prev) => prev.filter((item) => item.id !== id));
  };

  const saveNewChecklist = () => {
    const trimmedTitle = newChecklistTitle.trim();

    if (!trimmedTitle) {
      Alert.alert("Missing title", "Please enter a checklist title.");
      return;
    }

    if (draftItems.length === 0) {
      Alert.alert("No items", "Please add at least one item before saving.");
      return;
    }

    const newChecklist: SavedChecklist = {
      id: `${Date.now()}`,
      title: trimmedTitle,
      items: draftItems,
      createdAt: new Date().toISOString(),
    };

    const updatedChecklists = [newChecklist, ...checklists];
    setChecklists(updatedChecklists);
    setExpandedChecklistId(newChecklist.id);
    cancelNewChecklist();
  };

  // Only one checklist is expanded at a time
  const toggleChecklistExpanded = (id: string) => {
    setExpandedChecklistId((current) => (current === id ? null : id));
  };

  const toggleChecklistItem = (checklistId: string, itemId: string) => {
    setChecklists((prev) =>
      prev.map((checklist) =>
        checklist.id === checklistId
          ? {
              ...checklist,
              items: checklist.items.map((item) =>
                item.id === itemId
                  ? { ...item, completed: !item.completed }
                  : item
              ),
            }
          : checklist
      )
    );
  };

  const deleteChecklistItem = (checklistId: string, itemId: string) => {
    setChecklists((prev) =>
      prev.map((checklist) =>
        checklist.id === checklistId
          ? {
              ...checklist,
              items: checklist.items.filter((item) => item.id !== itemId),
            }
          : checklist
      )
    );
  };

  const addItemToExistingChecklist = (checklistId: string, label: string) => {
    const trimmed = label.trim();

    if (!trimmed) {
      Alert.alert("Empty item", "Please enter a checklist item first.");
      return;
    }

    const newItem: ChecklistItem = {
      id: `${Date.now()}`,
      label: trimmed,
      completed: false,
    };

    setChecklists((prev) =>
      prev.map((checklist) =>
        checklist.id === checklistId
          ? {
              ...checklist,
              items: [...checklist.items, newItem],
            }
          : checklist
      )
    );
  };

  const deleteChecklist = (checklistId: string) => {
    Alert.alert(
      "Delete checklist?",
      "This will remove the selected checklist.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setChecklists((prev) =>
              prev.filter((checklist) => checklist.id !== checklistId)
            );
            if (expandedChecklistId === checklistId) {
              setExpandedChecklistId(null);
            }
          },
        },
      ]
    );
  };

  const clearAllChecklists = () => {
    Alert.alert(
      "Reset all checklists?",
      "This will remove every saved checklist.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setChecklists([]);
            setExpandedChecklistId(null);
            await AsyncStorage.removeItem(STORAGE_KEY);
          },
        },
      ]
    );
  };

  // Small progress display for each checklist
  const ChecklistProgress = ({ items }: { items: ChecklistItem[] }) => {
    const completedCount = items.filter((item) => item.completed).length;
    const progress =
      items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

    return (
      <View style={styles.progressWrap}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {completedCount} / {items.length} completed ({progress}%)
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top page heading */}
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>Custom planning</Text>
          <Text style={styles.title}>Checklist Center</Text>
          <Text style={styles.subtitle}>
            Review your saved checklists, track completion, and create a new one
            when you need it.
          </Text>
        </View>

        {/* Main actions */}
        <View style={styles.topActionRow}>
          <Pressable style={styles.primaryButton} onPress={startNewChecklist}>
            <Text style={styles.primaryButtonText}>Create New Checklist</Text>
          </Pressable>

          {checklists.length > 0 && (
            <Pressable style={styles.secondaryButton} onPress={clearAllChecklists}>
              <Text style={styles.secondaryButtonText}>Reset All</Text>
            </Pressable>
          )}
        </View>

        {/* Form for creating a new checklist */}
        {showCreateForm && (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Create a New Checklist</Text>

            <Text style={styles.label}>Checklist title</Text>
            <TextInput
              value={newChecklistTitle}
              onChangeText={setNewChecklistTitle}
              placeholder="Example: Flood Evacuation Bag"
              placeholderTextColor="#7A7A7A"
              style={styles.input}
            />

            <Text style={styles.label}>Add items</Text>
            <View style={styles.inlineInputRow}>
              <TextInput
                value={newChecklistItemText}
                onChangeText={setNewChecklistItemText}
                placeholder="Example: Pack important documents"
                placeholderTextColor="#7A7A7A"
                style={styles.inlineInput}
              />
              <Pressable style={styles.inlineAddButton} onPress={addDraftItem}>
                <Text style={styles.inlineAddButtonText}>Add</Text>
              </Pressable>
            </View>

            {draftItems.length > 0 && (
              <View style={styles.draftList}>
                {draftItems.map((item) => (
                  <View key={item.id} style={styles.draftItemRow}>
                    <Text style={styles.draftItemText}>{item.label}</Text>
                    <Pressable onPress={() => removeDraftItem(item.id)}>
                      <Text style={styles.deleteText}>Remove</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.formActionsRow}>
              <Pressable style={styles.cancelButton} onPress={cancelNewChecklist}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.saveButton} onPress={saveNewChecklist}>
                <Text style={styles.saveButtonText}>Save Checklist</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Checklist list heading */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My Checklists</Text>
          <Text style={styles.sectionMeta}>{checklists.length}</Text>
        </View>

        {checklists.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No checklists yet</Text>
            <Text style={styles.emptyText}>
              Create your first checklist to start tracking your own preparedness
              items.
            </Text>
          </View>
        ) : (
          checklists.map((checklist) => {
            const isExpanded = expandedChecklistId === checklist.id;
            const completedCount = checklist.items.filter((item) => item.completed).length;

            return (
              <View key={checklist.id} style={styles.checklistCard}>
                <Pressable
                  style={styles.checklistHeader}
                  onPress={() => toggleChecklistExpanded(checklist.id)}
                >
                  <View style={styles.checklistHeaderLeft}>
                    <Text style={styles.checklistTitle}>{checklist.title}</Text>
                    <Text style={styles.checklistMeta}>
                      {completedCount} of {checklist.items.length} completed
                    </Text>
                  </View>

                  <Text style={styles.expandText}>
                    {isExpanded ? "Close" : "Open"}
                  </Text>
                </Pressable>

                <ChecklistProgress items={checklist.items} />

                {isExpanded && (
                  <ExpandedChecklistSection
                    checklist={checklist}
                    onToggleItem={toggleChecklistItem}
                    onDeleteItem={deleteChecklistItem}
                    onDeleteChecklist={deleteChecklist}
                    onAddItem={addItemToExistingChecklist}
                  />
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ExpandedChecklistSection({
  checklist,
  onToggleItem,
  onDeleteItem,
  onDeleteChecklist,
  onAddItem,
}: {
  checklist: SavedChecklist;
  onToggleItem: (checklistId: string, itemId: string) => void;
  onDeleteItem: (checklistId: string, itemId: string) => void;
  onDeleteChecklist: (checklistId: string) => void;
  onAddItem: (checklistId: string, label: string) => void;
}) {
  const [newItemText, setNewItemText] = useState("");

  const submitNewItem = () => {
    onAddItem(checklist.id, newItemText);
    setNewItemText("");
  };

  return (
    <View style={styles.expandedArea}>
      {/* Quick add box for an existing checklist */}
      <View style={styles.inlineInputRow}>
        <TextInput
          value={newItemText}
          onChangeText={setNewItemText}
          placeholder="Add another item"
          placeholderTextColor="#7A7A7A"
          style={styles.inlineInput}
        />
        <Pressable style={styles.inlineAddButton} onPress={submitNewItem}>
          <Text style={styles.inlineAddButtonText}>Add</Text>
        </Pressable>
      </View>

      {checklist.items.length === 0 ? (
        <Text style={styles.emptyInnerText}>No items in this checklist yet.</Text>
      ) : (
        checklist.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Pressable
              style={[
                styles.checkbox,
                item.completed && styles.checkboxCompleted,
              ]}
              onPress={() => onToggleItem(checklist.id, item.id)}
            >
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>

            <Pressable
              style={styles.itemTextWrap}
              onPress={() => onToggleItem(checklist.id, item.id)}
            >
              <Text
                style={[
                  styles.itemText,
                  item.completed && styles.itemTextCompleted,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>

            <Pressable onPress={() => onDeleteItem(checklist.id, item.id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        ))
      )}

      {/* Delete the whole checklist */}
      <Pressable
        style={styles.deleteChecklistButton}
        onPress={() => onDeleteChecklist(checklist.id)}
      >
        <Text style={styles.deleteChecklistButtonText}>Delete Checklist</Text>
      </Pressable>
    </View>
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
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5E5E5E",
  },
  topActionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#8B1020",
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: "center",
    borderRadius: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: "#E9E1E3",
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: "center",
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: "#222222",
    fontWeight: "700",
    fontSize: 14,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 6,
  },
  sectionMeta: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8B1020",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
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
  inlineInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  inlineInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111111",
    borderRadius: 8,
  },
  inlineAddButton: {
    backgroundColor: "#111111",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  inlineAddButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  draftList: {
    marginTop: 4,
    marginBottom: 12,
  },
  draftItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  draftItemText: {
    flex: 1,
    fontSize: 14,
    color: "#222222",
    paddingRight: 10,
  },
  formActionsRow: {
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
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 12,
    padding: 18,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5E5E5E",
  },
  checklistCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  checklistHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  checklistHeaderLeft: {
    flex: 1,
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 6,
  },
  checklistMeta: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  expandText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8B1020",
  },
  progressWrap: {
    marginBottom: 8,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "#E8E8E8",
    overflow: "hidden",
    marginBottom: 8,
    borderRadius: 999,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#8B1020",
    borderRadius: 999,
  },
  progressText: {
    fontSize: 13,
    color: "#5E5E5E",
  },
  expandedArea: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#ECECEC",
  },
  emptyInnerText: {
    fontSize: 14,
    color: "#6B6B6B",
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: "#8F8F8F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderRadius: 4,
  },
  checkboxCompleted: {
    backgroundColor: "#8B1020",
    borderColor: "#8B1020",
  },
  checkmark: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
  itemTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  itemText: {
    fontSize: 14,
    color: "#111111",
    lineHeight: 20,
  },
  itemTextCompleted: {
    textDecorationLine: "line-through",
    color: "#7A7A7A",
  },
  deleteText: {
    color: "#9A1B1B",
    fontWeight: "700",
    fontSize: 13,
  },
  deleteChecklistButton: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: "#F3E6E8",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteChecklistButtonText: {
    color: "#8B1020",
    fontWeight: "700",
    fontSize: 13,
  },
});