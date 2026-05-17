import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import TrafficBadge from "../components/TrafficBadge";
import { colors, radii, shadow, spacing, typography } from "../constants/theme";
import { getPredictions } from "../utils/storage";

const statusStyles = {
  "Low Traffic": "statusLow",
  "Medium Traffic": "statusMedium",
  "High Traffic": "statusHigh"
};

export default function HomeScreen({ navigation }) {
  const [now, setNow] = useState(new Date());
  const [lastPrediction, setLastPrediction] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      getPredictions().then((items) => {
        if (isActive) {
          setLastPrediction(items[0] || null);
        }
      });

      return () => {
        isActive = false;
      };
    }, [])
  );

  const statusKey = lastPrediction ? statusStyles[lastPrediction.traffic_level] : "statusNeutral";

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.cardAlt, colors.background]} style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.appName}>SmartTraffic AI</Text>
            <Text style={styles.clock}>{now.toLocaleString()}</Text>
          </View>
          <View style={[styles.statusCircle, styles[statusKey]]} />
        </View>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Last Prediction</Text>
        {lastPrediction ? (
          <View>
            <Text style={styles.predictedVolume}>{lastPrediction.predicted_volume}</Text>
            <TrafficBadge
              level={lastPrediction.traffic_level}
              emoji={lastPrediction.traffic_emoji}
            />
            <Text style={styles.muted}>{lastPrediction.timestampLabel}</Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>No predictions yet - tap Predict to start</Text>
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.86}
        onPress={() => navigation.navigate("Predict")}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>Predict Now</Text>
        <Ionicons name="arrow-forward" size={22} color={colors.background} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  appName: {
    ...typography.headerLarge,
    color: colors.primary
  },
  card: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    margin: spacing.md,
    padding: spacing.lg
  },
  cardTitle: {
    ...typography.headerMed,
    marginBottom: spacing.md
  },
  clock: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted
  },
  hero: {
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
    padding: spacing.lg,
    paddingTop: spacing.xl
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  muted: {
    ...typography.caption,
    marginTop: spacing.md
  },
  predictedVolume: {
    ...typography.predictionNumber,
    fontSize: 48,
    marginBottom: spacing.sm
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  primaryButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: "700"
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  statusCircle: {
    borderRadius: 11,
    height: 22,
    width: 22
  },
  statusHigh: {
    backgroundColor: colors.danger
  },
  statusLow: {
    backgroundColor: colors.success
  },
  statusMedium: {
    backgroundColor: colors.warning
  },
  statusNeutral: {
    backgroundColor: colors.textMuted
  }
});
