import React, { useCallback, useLayoutEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import TrafficBadge from "../components/TrafficBadge";
import { colors, radii, shadow, spacing, typography } from "../constants/theme";
import { clearPredictions, deletePrediction, getPredictions } from "../utils/storage";

export default function HistoryScreen({ navigation }) {
  const [items, setItems] = useState([]);

  const loadHistory = useCallback(async () => {
    const history = await getPredictions();
    setItems(history);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleClear = useCallback(() => {
    Alert.alert("Clear History", "Remove all saved predictions?", [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          await clearPredictions();
          setItems([]);
        }
      }
    ]);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleClear} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Clear All</Text>
        </TouchableOpacity>
      )
    });
  }, [handleClear, navigation]);

  const handleDelete = async (id) => {
    const nextHistory = await deletePrediction(id);
    setItems(nextHistory);
  };

  const renderRightActions = (item) => (
    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteAction}>
      <Ionicons name="trash" size={22} color={colors.text} />
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item)}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.date}>{item.timestampLabel}</Text>
          <TrafficBadge level={item.traffic_level} emoji={item.traffic_emoji} />
        </View>
        <Text style={styles.volume}>{item.predicted_volume}</Text>
        <Text style={styles.inputs}>
          Hour {item.inputs?.hour}:00  |  Temp {item.inputs?.temp}°C  |  {item.inputs?.weather_condition}
        </Text>
      </View>
    </Swipeable>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={items.length ? styles.list : styles.emptyList}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={52} color={colors.textMuted} />
            <Text style={styles.emptyText}>No history yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md
  },
  cardHeader: {
    alignItems: "flex-start",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  date: {
    ...typography.caption
  },
  deleteAction: {
    alignItems: "center",
    backgroundColor: colors.danger,
    borderRadius: radii.card,
    justifyContent: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg
  },
  deleteText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "700",
    marginTop: spacing.xs
  },
  empty: {
    alignItems: "center",
    gap: spacing.md
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.md
  },
  emptyText: {
    ...typography.headerMed,
    color: colors.textMuted
  },
  headerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  headerButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "700"
  },
  inputs: {
    ...typography.body,
    color: colors.textMuted
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  volume: {
    ...typography.headerLarge,
    marginVertical: spacing.xs
  }
});
