import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "../constants/theme";

const levelColors = {
  "Low Traffic": colors.success,
  "Medium Traffic": colors.warning,
  "High Traffic": colors.danger
};

const levelEmoji = {
  "Low Traffic": "🟢",
  "Medium Traffic": "🟡",
  "High Traffic": "🔴"
};

export default function TrafficBadge({ level, emoji }) {
  const badgeColor = levelColors[level] || colors.textMuted;
  const badgeEmoji = emoji || levelEmoji[level] || "●";

  return (
    <View style={[styles.badge, { borderColor: badgeColor }]}>
      <Text style={styles.emoji}>{badgeEmoji}</Text>
      <Text style={[styles.text, { color: badgeColor }]}>{level || "Unknown"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  emoji: {
    fontSize: 12
  },
  text: {
    ...typography.caption,
    fontWeight: "700"
  }
});
