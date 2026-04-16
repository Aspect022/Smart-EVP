import "react-native-gesture-handler";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { DriverProvider, useDriver } from "./src/context/DriverContext";
import { DispatchProvider } from "./src/context/DispatchContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import { colors } from "./src/theme";
import { SplashScreen } from "./src/screens/SplashScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { AlertScreen } from "./src/screens/AlertScreen";
import { ActiveCaseScreen } from "./src/screens/ActiveCaseScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Home: undefined;
  Alert: undefined;
  ActiveCase: undefined;
  Profile: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { driver } = useDriver();

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Splash">
          {(props) => <SplashScreen {...props} hasDriver={Boolean(driver)} />}
        </Stack.Screen>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Alert"
          component={AlertScreen}
          options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="ActiveCase" component={ActiveCaseScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <DriverProvider>
        <LanguageProvider>
          <DispatchProvider>
            <RootNavigator />
          </DispatchProvider>
        </LanguageProvider>
      </DriverProvider>
    </SafeAreaProvider>
  );
}
