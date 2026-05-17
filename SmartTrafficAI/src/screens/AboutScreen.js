import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadow, spacing, typography } from "../constants/theme";
import { checkHealth } from "../services/api";

const techStack = ["React Native", "Expo", "FastAPI", "scikit-learn", "pandas"];

export default function AboutScreen() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let isMounted = true;

    checkHealth().then((result) => {
      if (isMounted) {
        setOnline(!result.error && result.status === "ok");
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.header}>About</Text>

      <View style={styles.card}>
        <InfoRow label="Project" value="CSE299 - Junior Design (NSU)" />
        <InfoRow label="Model" value="Random Forest Regressor" />
        <InfoRow label="R² Score" value="96.46%" />
        <InfoRow label="Dataset" value="Metro Interstate Traffic Volume (2012-2018)" />
        <InfoRow label="Records trained on" value="48,203" />
        <InfoRow label="Top features" value="Hour (84%), Day of Week (11%), Temperature (2%)" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Tech Stack</Text>
        <View style={styles.badges}>
          {techStack.map((item) => (
            <View key={item} style={styles.techBadge}>
              <Text style={styles.techText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>API Status</Text>
        <View style={styles.statusRow}>
          <Ionicons
            name={online ? "checkmark-circle" : "close-circle"}
            size={22}
            color={online ? colors.success : colors.danger}
          />
          <Text style={online ? styles.connected : styles.offline}>
            {online ? "Connected" : "Offline"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  card: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg
  },
  connected: {
    ...typography.body,
    color: colors.success,
    fontWeight: "700"
  },
  content: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl
  },
  header: {
    ...typography.headerLarge,
    marginBottom: spacing.md
  },
  infoLabel: {
    ...typography.caption,
    marginBottom: spacing.xs
  },
  infoRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    marginBottom: spacing.md,
    paddingBottom: spacing.md
  },
  infoValue: {
    ...typography.body
  },
  offline: {
    ...typography.body,
    color: colors.danger,
    fontWeight: "700"
  },
  sectionTitle: {
    ...typography.headerMed,
    marginBottom: spacing.md
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  techBadge: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  techText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700"
  }
});
