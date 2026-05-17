import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadow, spacing, typography } from "../constants/theme";
import TrafficBadge from "./TrafficBadge";

const MAX_VOLUME = 7280;

export default function PredictionCard({ prediction, onSave, saved }) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true
      }),
      Animated.timing(barAnim, {
        toValue: Math.min(prediction.predicted_volume / MAX_VOLUME, 1),
        duration: 700,
        useNativeDriver: false
      })
    ]).start();
  }, [barAnim, opacityAnim, prediction.predicted_volume, slideAnim]);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"]
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={styles.title}>Prediction Result</Text>
      <Text style={styles.number}>{prediction.predicted_volume}</Text>
      <TrafficBadge level={prediction.traffic_level} emoji={prediction.traffic_emoji} />
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: barWidth }]} />
      </View>
      <Text style={styles.timestamp}>{prediction.timestampLabel}</Text>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={saved}
        onPress={onSave}
        style={[styles.saveButton, saved && styles.saveButtonDisabled]}
      >
        <Ionicons name={saved ? "checkmark-circle" : "save"} size={18} color={colors.background} />
        <Text style={styles.saveText}>{saved ? "Saved" : "Save to History"}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  barFill: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: "100%"
  },
  barTrack: {
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    height: 12,
    marginTop: spacing.lg,
    overflow: "hidden",
    width: "100%"
  },
  card: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.lg
  },
  number: {
    ...typography.predictionNumber,
    marginBottom: spacing.sm
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.lg,
    paddingVertical: spacing.md
  },
  saveButtonDisabled: {
    backgroundColor: colors.success
  },
  saveText: {
    ...typography.body,
    color: colors.background,
    fontWeight: "700"
  },
  timestamp: {
    ...typography.caption,
    marginTop: spacing.sm
  },
  title: {
    ...typography.headerMed,
    marginBottom: spacing.sm
  }
});
