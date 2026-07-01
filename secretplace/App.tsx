import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { StudySessionScreen } from "./src/screens/StudySessionScreen";

export default function App() {
  const [studyMinutes, setStudyMinutes] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      <View style={styles.background}>
        <ScrollView contentContainerStyle={styles.content}>
          {studyMinutes === null ? (
            <TimingScreen onStart={setStudyMinutes} />
          ) : (
            <StudySessionScreen selectedMinutes={studyMinutes} onChangeTime={() => setStudyMinutes(null)} />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const QUICK_OPTIONS = [15, 30, 45, 60];

function TimingScreen({ onStart }: { onStart: (minutes: number) => void }) {
  const [minutesText, setMinutesText] = useState("30");
  const parsedMinutes = Number.parseInt(minutesText, 10);
  const isValid = Number.isFinite(parsedMinutes) && parsedMinutes > 0;

  function handleStart() {
    if (!isValid) {
      return;
    }

    onStart(parsedMinutes);
  }

  return (
    <View style={styles.timingPage}>
      <View style={styles.mark}>
        <Text style={styles.markText}>SP</Text>
      </View>
      <Text style={styles.brand}>secretplace</Text>
      <Text style={styles.title}>How long are you setting aside?</Text>
      <Text style={styles.subtitle}>Choose your quiet study time first. The Scripture deep dive opens next.</Text>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Study time</Text>
        <TextInput
          accessibilityLabel="Study time in minutes"
          inputMode="numeric"
          keyboardType="number-pad"
          onChangeText={setMinutesText}
          placeholder="30"
          placeholderTextColor="#7c7569"
          style={styles.input}
          value={minutesText}
        />
        <View style={styles.timeGrid}>
          {QUICK_OPTIONS.map((minutes) => {
            const isSelected = minutesText === String(minutes);
            return (
              <Pressable
                accessibilityRole="button"
                key={minutes}
                onPress={() => setMinutesText(String(minutes))}
                style={[styles.timeButton, isSelected && styles.timeButtonSelected]}
              >
                <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>{minutes}m</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!isValid}
          onPress={handleStart}
          style={[styles.primaryButton, !isValid && styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>Continue to Scripture</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#f7f3ea"
  },
  background: {
    flex: 1,
    backgroundColor: "#f7f3ea"
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingBottom: 32
  },
  timingPage: {
    alignSelf: "center",
    gap: 14,
    maxWidth: 620,
    paddingTop: 52,
    width: "100%"
  },
  mark: {
    alignItems: "center",
    backgroundColor: "#26352a",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  markText: {
    color: "#fbf7ed",
    fontSize: 16,
    fontWeight: "900"
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
    maxWidth: 520
  },
  panel: {
    backgroundColor: "#fffdf7",
    borderColor: "#ded5c4",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    marginTop: 10,
    padding: 16
  },
  panelTitle: {
    color: "#1f2b23",
    fontSize: 18,
    fontWeight: "800"
  },
  input: {
    backgroundColor: "#f7f3ea",
    borderColor: "#d6caba",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f2b23",
    fontSize: 22,
    fontWeight: "800",
    minHeight: 56,
    paddingHorizontal: 14
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  timeButton: {
    alignItems: "center",
    backgroundColor: "#f2ece0",
    borderColor: "#d6caba",
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 72
  },
  timeButtonSelected: {
    backgroundColor: "#26352a",
    borderColor: "#26352a"
  },
  timeText: {
    color: "#26352a",
    fontSize: 16,
    fontWeight: "800"
  },
  timeTextSelected: {
    color: "#ffffff"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2f5e47",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16
  },
  primaryButtonDisabled: {
    opacity: 0.45
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800"
  }
});
