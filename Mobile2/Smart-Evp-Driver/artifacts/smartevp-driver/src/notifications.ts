import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configureNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("dispatch-alerts", {
      name: "Dispatch Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 120, 250],
      lightColor: "#ff3b3b",
      sound: "default",
    });
  }
}

export async function registerForPushNotificationsAsync() {
  await configureNotifications();

  let finalStatus = "denied";
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (!Device.isDevice) {
    return null;
  }

  if (Constants.appOwnership === "expo") {
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

export async function sendLocalDispatchNotification(caseId: string, severity: string, location: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${severity} dispatch incoming`,
        body: `Case ${caseId} · ${location}`,
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { caseId },
      },
      trigger: null,
    });
  } catch {
    // Local notification issues should never break app startup in Expo Go.
  }
}
