import { Feather } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { endFocusSession, startFocusSession } from "../services/focusMode";
import { scheduleSessionCompleteNotification } from "../services/notifications";
import { requestStudyGuide, StudyGuide } from "../services/studyGuide";
import { formatRemainingTime } from "../utils/time";

type StudySessionScreenProps = {
  selectedMinutes: number;
  onChangeTime: () => void;
};

export function StudySessionScreen({ selectedMinutes, onChangeTime }: StudySessionScreenProps) {
  const [passage, setPassage] = useState("");
  const [sessionEndsAt, setSessionEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [isLoadingGuide, setIsLoadingGuide] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = sessionEndsAt !== null && sessionEndsAt > now;
  const remainingMs = Math.max(0, (sessionEndsAt ?? now) - now);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    void handleStartSession();
  }, []);

  useEffect(() => {
    if (!sessionEndsAt || sessionEndsAt > now) {
      return;
    }

    void endFocusSession();
    setSessionEndsAt(null);
    if (Platform.OS === "web" && "Notification" in globalThis && Notification.permission === "granted") {
      new Notification("secretplace", {
        body: "Your quiet Scripture study session is complete."
      });
    }
    Alert.alert("Session complete", "Your study time is complete. Notifications can return.");
  }, [now, sessionEndsAt]);

  const sessionSubtitle = useMemo(() => {
    if (Platform.OS === "ios") {
      return "iPhone requires user-approved Focus or Screen Time controls.";
    }

    if (Platform.OS === "android") {
      return "Android can use Do Not Disturb after you grant access.";
    }

    return "Web mode keeps this screen quiet and sends a completion alert if allowed.";
  }, []);

  async function handleStartSession() {
    setError(null);
    const result = await startFocusSession(selectedMinutes);

    if (!result.ok) {
      setError(result.message);
      if (Platform.OS === "android") {
        Alert.alert("Permission needed", result.message);
      }
      return;
    }

    const endTime = Date.now() + selectedMinutes * 60 * 1000;
    setSessionEndsAt(endTime);
    await scheduleSessionCompleteNotification(selectedMinutes);
  }

  async function handleEndSession() {
    await endFocusSession();
    setSessionEndsAt(null);
  }

  async function handleChangeTime() {
    if (isActive) {
      await handleEndSession();
    }

    onChangeTime();
  }

  async function handleStudyPassage() {
    const trimmed = passage.trim();

    if (!trimmed) {
      setError("Enter the scripture you are studying first.");
      return;
    }

    setIsLoadingGuide(true);
    setError(null);

    try {
      setGuide(await requestStudyGuide(trimmed));
    } catch (guideError) {
      setError(guideError instanceof Error ? guideError.message : "Could not create the study guide.");
    } finally {
      setIsLoadingGuide(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <View style={styles.mark}>
          <Feather name="book-open" size={26} color="#fbf7ed" />
        </View>
        <Text style={styles.brand}>secretplace</Text>
        <Text style={styles.title}>A quiet room for Scripture.</Text>
        <Text style={styles.subtitle}>{sessionSubtitle}</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Focus Timer</Text>
          <Text style={styles.status}>{isActive ? formatRemainingTime(remainingMs) : "Ready"}</Text>
        </View>

        <Text style={styles.timerCopy}>{selectedMinutes} minutes set aside for this study.</Text>

        <Pressable
          accessibilityRole="button"
          onPress={isActive ? handleEndSession : handleStartSession}
          style={[styles.primaryButton, isActive && styles.stopButton]}
        >
          <Feather name={isActive ? "bell" : "moon"} size={18} color="#ffffff" />
          <Text style={styles.primaryButtonText}>{isActive ? "End Session" : "Begin Quiet Study"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={handleChangeTime} style={styles.ghostButton}>
          <Feather name="clock" size={17} color="#26352a" />
          <Text style={styles.ghostButtonText}>Change Time</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Scripture</Text>
        <TextInput
          autoCapitalize="words"
          onChangeText={setPassage}
          placeholder="Enter a passage, like Psalm 23 or John 15:5"
          placeholderTextColor="#7c7569"
          style={styles.input}
          value={passage}
        />
        <Pressable accessibilityRole="button" onPress={handleStudyPassage} style={styles.secondaryButton}>
          <Feather name="search" size={18} color="#26352a" />
          <Text style={styles.secondaryButtonText}>Create Study Guide</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.notice}>
          <Feather name="info" size={18} color="#8a4a18" />
          <Text style={styles.noticeText}>{error}</Text>
        </View>
      ) : null}

      {isLoadingGuide ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#26352a" />
          <Text style={styles.loadingText}>Preparing your study guide...</Text>
        </View>
      ) : null}

      {guide ? <StudyGuideView guide={guide} /> : null}
    </View>
  );
}

function StudyGuideView({ guide }: { guide: StudyGuide }) {
  return (
    <View style={styles.guide}>
      <Text style={styles.guideReference}>{guide.reference}</Text>
      <Text style={styles.verse}>{guide.verse}</Text>

      <GuideSection icon="type" title="Word Study">
        {guide.wordStudies.map((word) => (
          <View key={`${word.term}-${word.original}`} style={styles.wordRow}>
            <Text style={styles.wordTerm}>{word.term}</Text>
            <Text style={styles.wordMeta}>
              {word.original} - {word.language}
            </Text>
            <Text style={styles.bodyText}>{word.meaning}</Text>
          </View>
        ))}
      </GuideSection>

      <GuideSection icon="align-left" title="Summary">
        <Text style={styles.bodyText}>{guide.summary}</Text>
      </GuideSection>

      <GuideSection icon="message-circle" title="Reflection">
        {guide.questions.map((question) => (
          <Text key={question} style={styles.question}>
            {question}
          </Text>
        ))}
      </GuideSection>
    </View>
  );
}

function GuideSection({
  children,
  icon,
  title
}: {
  children: ReactNode;
  icon: ComponentProps<typeof Feather>["name"];
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Feather name={icon} size={18} color="#26352a" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    gap: 16,
    paddingTop: 28
  },
  header: {
    gap: 8,
    paddingVertical: 18
  },
  mark: {
    alignItems: "center",
    backgroundColor: "#26352a",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  brand: {
    color: "#526054",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: "#1e2a22",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 40
  },
  subtitle: {
    color: "#5f665f",
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 560
  },
  panel: {
    backgroundColor: "#fffdf7",
    borderColor: "#ded5c4",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  panelTitle: {
    color: "#1f2b23",
    fontSize: 18,
    fontWeight: "800"
  },
  status: {
    color: "#2f5e47",
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontWeight: "800"
  },
  timerCopy: {
    color: "#5f665f",
    fontSize: 15,
    lineHeight: 22
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2f5e47",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16
  },
  stopButton: {
    backgroundColor: "#8c3b28"
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800"
  },
  ghostButton: {
    alignItems: "center",
    borderColor: "#d6caba",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
  },
  ghostButtonText: {
    color: "#26352a",
    fontSize: 15,
    fontWeight: "800"
  },
  input: {
    backgroundColor: "#f7f3ea",
    borderColor: "#d6caba",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f2b23",
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#26352a",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 16
  },
  secondaryButtonText: {
    color: "#26352a",
    fontSize: 16,
    fontWeight: "800"
  },
  notice: {
    alignItems: "flex-start",
    backgroundColor: "#fff1dc",
    borderColor: "#e3c393",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 12
  },
  noticeText: {
    color: "#704114",
    flex: 1,
    fontSize: 14,
    lineHeight: 20
  },
  loading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingVertical: 12
  },
  loadingText: {
    color: "#526054",
    fontSize: 15,
    fontWeight: "700"
  },
  guide: {
    gap: 14
  },
  guideReference: {
    color: "#1f2b23",
    fontSize: 24,
    fontWeight: "900"
  },
  verse: {
    color: "#3d463e",
    fontSize: 18,
    fontStyle: "italic",
    lineHeight: 28
  },
  section: {
    backgroundColor: "#fffdf7",
    borderColor: "#ded5c4",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  sectionTitle: {
    color: "#1f2b23",
    fontSize: 17,
    fontWeight: "900"
  },
  wordRow: {
    gap: 4
  },
  wordTerm: {
    color: "#26352a",
    fontSize: 16,
    fontWeight: "900"
  },
  wordMeta: {
    color: "#696f68",
    fontSize: 13,
    fontWeight: "700"
  },
  bodyText: {
    color: "#3f473f",
    fontSize: 15,
    lineHeight: 22
  },
  question: {
    color: "#3f473f",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6
  }
});
