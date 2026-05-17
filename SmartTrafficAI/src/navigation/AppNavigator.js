import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/theme";
import HomeScreen from "../screens/HomeScreen";
import PredictScreen from "../screens/PredictScreen";
import WeatherScreen from "../screens/WeatherScreen";
import HistoryScreen from "../screens/HistoryScreen";
import AboutScreen from "../screens/AboutScreen";

const Tab = createBottomTabNavigator();

const iconNames = {
  Home: "home",
  Predict: "analytics",
  Weather: "partly-sunny",
  History: "time",
  About: "information-circle"
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: colors.background
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: "700"
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={iconNames[route.name]} size={size} color={color} />
          )
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Predict" component={PredictScreen} />
        <Tab.Screen name="Weather" component={WeatherScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="About" component={AboutScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
