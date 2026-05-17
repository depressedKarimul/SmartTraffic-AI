import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadow, spacing, typography } from "../constants/theme";
import { getCurrentWeather } from "../services/api";

const DEFAULT_CITY = "Dhaka";

const weatherToModelCondition = (condition) => {
  const normalized = String(condition || "").toLowerCase();

  if (normalized.includes("thunder")) {
    return "Thunderstorm";
  }

  if (normalized.includes("drizzle")) {
    return "Drizzle";
  }

  if (normalized.includes("rain")) {
    return "Rain";
  }

  if (normalized.includes("snow")) {
    return "Snow";
  }

  if (["mist", "fog", "haze"].some((item) => normalized.includes(item))) {
    return normalized.includes("fog") ? "Fog" : normalized.includes("haze") ? "Haze" : "Mist";
  }

  if (normalized.includes("cloud")) {
    return "Clouds";
  }

  return "Clear";
};

const formatTime = (timestamp, timezoneOffset) => {
  if (!timestamp) {
    return "--";
  }

  const localMs = (timestamp + timezoneOffset) * 1000;
  return new Date(localMs).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  });
};

const getWeatherIconUrl = (icon) =>
  icon ? `https://openweathermap.org/img/wn/${icon}@4x.png` : null;

export default function WeatherScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [cityInput, setCityInput] = useState(DEFAULT_CITY);
  const [activeCity, setActiveCity] = useState(DEFAULT_CITY);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const isCompact = width < 380;

  const condition = weather?.weather?.[0];
  const iconUrl = getWeatherIconUrl(condition?.icon);
  const lastUpdated = useMemo(
    () =>
      weather
        ? new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
          })
        : "",
    [weather]
  );

  const loadWeather = async (city, options = {}) => {
    const nextCity = city.trim();

    if (!nextCity) {
      setError("Enter a city name to load weather.");
      return;
    }

    if (options.refreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    const result = await getCurrentWeather(nextCity);

    if (result.error) {
      setError(result.message);
    } else {
      setWeather(result);
      setActiveCity(nextCity);
      setCityInput(nextCity);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadWeather(DEFAULT_CITY);
  }, []);

  const handleSearch = () => {
    loadWeather(cityInput);
  };

  const handleRefresh = () => {
    loadWeather(activeCity, { refreshing: true });
  };

  const handleUseForPrediction = () => {
    if (!weather) {
      return;
    }

    navigation.navigate("Predict", {
      liveWeather: {
        clouds: weather.clouds?.all ?? 0,
        rain: weather.rain?.["1h"] ?? 0,
        snow: weather.snow?.["1h"] ?? 0,
        temp: Math.round(weather.main?.temp ?? 0).toString(),
        weather: weatherToModelCondition(condition?.main)
      }
    });
  };

  const metrics = weather
    ? [
        {
          icon: "rainy",
          label: "Rain",
          value: `${(weather.rain?.["1h"] ?? 0).toFixed(1)} mm`
        },
        {
          icon: "snow",
          label: "Snow",
          value: `${(weather.snow?.["1h"] ?? 0).toFixed(1)} mm`
        },
        {
          icon: "cloud",
          label: "Cloud Coverage",
          value: `${weather.clouds?.all ?? 0}%`
        },
        {
          icon: "water",
          label: "Humidity",
          value: `${weather.main?.humidity ?? "--"}%`
        },
        {
          icon: "speedometer",
          label: "Pressure",
          value: `${weather.main?.pressure ?? "--"} hPa`
        },
        {
          icon: "navigate",
          label: "Wind",
          value: `${Math.round(weather.wind?.speed ?? 0)} m/s`
        }
      ]
    : [];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboard}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={handleRefresh}
          />
        }
      >
        <Text style={styles.header}>Live Weather</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              onChangeText={setCityInput}
              onSubmitEditing={handleSearch}
              placeholder="Search city"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              style={styles.searchInput}
              value={cityInput}
            />
          </View>
          <TouchableOpacity activeOpacity={0.84} onPress={handleSearch} style={styles.iconButton}>
            <Ionicons name="arrow-forward" size={22} color={colors.background} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading live weather</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {weather && !loading ? (
          <>
            <LinearGradient
              colors={[colors.cardAlt, colors.card]}
              style={[styles.heroCard, isCompact && styles.heroCardCompact]}
            >
              <View style={styles.heroTop}>
                <View style={styles.placeWrap}>
                  <View style={styles.placeRow}>
                    <Ionicons name="location" size={18} color={colors.primary} />
                    <Text style={styles.cityText}>
                      {weather.name}, {weather.sys?.country}
                    </Text>
                  </View>
                  <Text style={styles.updatedText}>Updated {lastUpdated}</Text>
                </View>
                {iconUrl ? <Image source={{ uri: iconUrl }} style={styles.weatherIcon} /> : null}
              </View>

              <View style={styles.tempRow}>
                <Text style={styles.temperature}>{Math.round(weather.main?.temp ?? 0)}</Text>
                <Text style={styles.degree}>°C</Text>
              </View>
              <Text style={styles.conditionText}>{condition?.description || "Live conditions"}</Text>

              <View style={styles.feelsRow}>
              <View style={styles.feelsItem}>
                <Text style={styles.feelsLabel}>Rain</Text>
                <Text style={styles.feelsValue}>{(weather.rain?.["1h"] ?? 0).toFixed(1)} mm</Text>
              </View>
              <View style={styles.feelsItem}>
                <Text style={styles.feelsLabel}>Snow</Text>
                <Text style={styles.feelsValue}>{(weather.snow?.["1h"] ?? 0).toFixed(1)} mm</Text>
              </View>
              <View style={styles.feelsItem}>
                <Text style={styles.feelsLabel}>Clouds</Text>
                <Text style={styles.feelsValue}>{weather.clouds?.all ?? 0}%</Text>
              </View>
              <View style={styles.feelsItem}>
                <Text style={styles.feelsLabel}>Feels like</Text>
                <Text style={styles.feelsValue}>{Math.round(weather.main?.feels_like ?? 0)}°C</Text>
              </View>
            </View>
            </LinearGradient>

            <View style={styles.metricGrid}>
              {metrics.map((item) => (
                <View key={item.label} style={styles.metricCard}>
                  <Ionicons name={item.icon} size={22} color={colors.primary} />
                  <Text style={styles.metricValue}>{item.value}</Text>
                  <Text style={styles.metricLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.trafficCard}>
              <View style={styles.trafficHeader}>
                <Ionicons name="analytics" size={22} color={colors.primary} />
                <Text style={styles.trafficTitle}>Traffic-ready inputs</Text>
              </View>
              <Text style={styles.trafficText}>
                Current temperature, rain, snow, cloud coverage, and weather condition can be sent
                directly to your prediction form.
              </Text>
              <TouchableOpacity
                activeOpacity={0.86}
                onPress={handleUseForPrediction}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Use for Prediction</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.background} />
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  cityText: {
    ...typography.headerMed,
    flexShrink: 1
  },
  conditionText: {
    ...typography.body,
    color: colors.textMuted,
    textTransform: "capitalize"
  },
  content: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl
  },
  degree: {
    ...typography.headerLarge,
    color: colors.primary,
    marginTop: spacing.sm
  },
  errorCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.danger,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    flex: 1
  },
  feelsItem: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.button,
    borderWidth: 1,
    flex: 1,
    minWidth: 92,
    padding: spacing.sm
  },
  feelsLabel: {
    ...typography.caption,
    marginBottom: spacing.xs
  },
  feelsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  feelsValue: {
    ...typography.body,
    fontWeight: "700"
  },
  header: {
    ...typography.headerLarge,
    marginBottom: spacing.md
  },
  heroCard: {
    ...shadow,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: spacing.md,
    overflow: "hidden",
    padding: spacing.lg
  },
  heroCardCompact: {
    padding: spacing.md
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    height: 50,
    justifyContent: "center",
    width: 54
  },
  keyboard: {
    backgroundColor: colors.background,
    flex: 1
  },
  loadingCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.lg
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted
  },
  metricCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minWidth: 148,
    padding: spacing.md
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  metricLabel: {
    ...typography.caption,
    marginTop: spacing.xs
  },
  metricValue: {
    ...typography.headerMed,
    marginTop: spacing.sm
  },
  placeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  placeWrap: {
    flex: 1,
    paddingRight: spacing.sm
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: 50
  },
  primaryButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: "700"
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    minHeight: 50,
    paddingRight: spacing.sm
  },
  searchInputWrap: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.button,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  temperature: {
    ...typography.predictionNumber,
    fontSize: 72,
    lineHeight: 78
  },
  tempRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginTop: spacing.md
  },
  trafficCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.lg
  },
  trafficHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  trafficText: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 22
  },
  trafficTitle: {
    ...typography.headerMed
  },
  updatedText: {
    ...typography.caption,
    marginTop: spacing.xs
  },
  weatherIcon: {
    height: 92,
    width: 92
  }
});
