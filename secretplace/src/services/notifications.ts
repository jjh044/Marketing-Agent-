import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function scheduleSessionCompleteNotification(minutes: number) {
  if (Platform.OS === "web") {
    if ("Notification" in globalThis && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    return;
  }

  await Notifications.requestPermissionsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      body: "Your quiet Scripture study session is complete.",
      title: "secretplace"
    },
    trigger: {
      seconds: minutes * 60,
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL
    }
  });
}
