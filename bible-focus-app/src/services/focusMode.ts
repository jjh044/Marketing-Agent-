import { NativeModulesProxy } from "expo-modules-core";
import { Platform } from "react-native";

type FocusResult = {
  ok: boolean;
  mode: "native-dnd" | "guided-focus" | "web";
  message: string;
};

type FocusModeModule = {
  startFocusSession(minutes: number): Promise<FocusResult>;
  endFocusSession(): Promise<FocusResult>;
};

const NativeFocusMode = NativeModulesProxy.FocusModeModule as FocusModeModule | undefined;

export async function startFocusSession(minutes: number): Promise<FocusResult> {
  if (NativeFocusMode) {
    return NativeFocusMode.startFocusSession(minutes);
  }

  if (Platform.OS === "web") {
    return {
      ok: true,
      mode: "web",
      message: "Web quiet mode started. Keep this tab open for the session timer."
    };
  }

  return {
    ok: false,
    mode: "guided-focus",
    message: "Native focus controls are not installed in this build yet."
  };
}

export async function endFocusSession(): Promise<FocusResult> {
  if (NativeFocusMode) {
    return NativeFocusMode.endFocusSession();
  }

  return {
    ok: true,
    mode: Platform.OS === "web" ? "web" : "guided-focus",
    message: "Study session ended."
  };
}
