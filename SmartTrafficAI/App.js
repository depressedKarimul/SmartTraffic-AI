import "react-native-gesture-handler";

import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ChatBot from "./src/components/ChatBot";
import AppNavigator from "./src/navigation/AppNavigator";
import { styles } from "./src/constants/theme";

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppNavigator />
        <ChatBot />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
