import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import CustomSlider from "../components/CustomSlider";
import PredictionCard from "../components/PredictionCard";
import { colors, radii, shadow, spacing, typography } from "../constants/theme";
import { predictTraffic } from "../services/api";
import { savePrediction } from "../utils/storage";

const weatherOptions = [
  "Clear",
  "Clouds",
  "Rain",
  "Drizzle",
  "Thunderstorm",
  "Snow",
  "Mist",
  "Fog",
  "Haze"
];

const pad = (value) => String(value).padStart(2, "0");

const formatHour = (hour) => {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${pad(displayHour)}:00 ${suffix}`;
};

const formatDate = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric"
  });

const getModelDateParts = (date) => ({
  day: date.getDate(),
  month: date.getMonth() + 1,
  day_of_week: date.getDay() === 0 ? 6 : date.getDay() - 1
});

const numericValue = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function PredictScreen({ route }) {
  const today = useMemo(() => new Date(), []);
  const [hour, setHour] = useState(today.getHours());
  const [temp, setTemp] = useState("25");
  const [rain, setRain] = useState(0);
  const [snow, setSnow] = useState(0);
  const [clouds, setClouds] = useState(30);
  const [weather, setWeather] = useState("Clouds");
  const [selectedDate, setSelectedDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [saved, setSaved] = useState(false);

  const selectedDateLabel = useMemo(() => formatDate(selectedDate), [selectedDate]);

  useEffect(() => {
    const liveWeather = route?.params?.liveWeather;

    if (!liveWeather) {
      return;
    }

    setTemp(liveWeather.temp);
    setRain(liveWeather.rain);
    setSnow(liveWeather.snow);
    setClouds(liveWeather.clouds);
    setWeather(liveWeather.weather);
  }, [route?.params?.liveWeather]);

  const buildPayload = () => {
    const dateParts = getModelDateParts(selectedDate);

    return {
      hour,
      temp: numericValue(temp, 0),
      rain_1h: rain,
      snow_1h: snow,
      clouds_all: clouds,
      weather_condition: weather,
      ...dateParts
    };
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event.type === "dismissed" || !date) {
      return;
    }

    setSelectedDate(date);
  };

  const handlePredict = async () => {
    setLoading(true);
    setError("");
    setPrediction(null);
    setSaved(false);

    const inputs = buildPayload();
    const result = await predictTraffic(inputs);
    setLoading(false);

    if (result.error) {
      setError(result.message || "Could not reach API. Check your backend URL in config.js");
      return;
    }

    const timestamp = new Date();
    setPrediction({
      ...result,
      inputs,
      id: `${timestamp.getTime()}`,
      timestamp: timestamp.toISOString(),
      timestampLabel: timestamp.toLocaleString()
    });
  };

  const handleSave = async () => {
    if (!prediction || saved) {
      return;
    }

    await savePrediction(prediction);
    setSaved(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboard}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Enter Conditions</Text>

        <View style={styles.card}>
          <CustomSlider
            label="Hour"
            value={hour}
            minimumValue={0}
            maximumValue={23}
            step={1}
            onValueChange={setHour}
            displayValue={formatHour(hour)}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Temperature</Text>
            <View style={styles.inputWrap}>
              <TextInput
                keyboardType="numeric"
                onChangeText={setTemp}
                placeholder="25"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={temp}
              />
              <Text style={styles.suffix}>°C</Text>
            </View>
          </View>

          <CustomSlider
            label="Rain"
            value={rain}
            minimumValue={0}
            maximumValue={10}
            step={0.1}
            onValueChange={setRain}
            displayValue={`${rain.toFixed(1)} mm`}
          />

          <CustomSlider
            label="Snow"
            value={snow}
            minimumValue={0}
            maximumValue={5}
            step={0.1}
            onValueChange={setSnow}
            displayValue={`${snow.toFixed(1)} mm`}
          />

          <CustomSlider
            label="Cloud Coverage"
            value={clouds}
            minimumValue={0}
            maximumValue={100}
            step={1}
            onValueChange={setClouds}
            displayValue={`${clouds}%`}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weather</Text>
            <View style={styles.pickerWrap}>
              <Picker
                dropdownIconColor={colors.primary}
                onValueChange={setWeather}
                selectedValue={weather}
                style={styles.picker}
              >
                {weatherOptions.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              <Text style={styles.dateButtonText}>📅 {selectedDateLabel}</Text>
            </TouchableOpacity>
            {showDatePicker ? (
              <DateTimePicker
                display={Platform.OS === "ios" ? "spinner" : "default"}
                mode="date"
                onChange={handleDateChange}
                value={selectedDate}
              />
            ) : null}
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.86} disabled={loading} onPress={handlePredict}>
          <LinearGradient
            colors={loading ? [colors.cardAlt, colors.cardAlt] : [colors.primary, "#63EAFF"]}
            style={styles.predictButton}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.predictText}>🔍 Predict Traffic</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {prediction ? (
          <PredictionCard prediction={prediction} saved={saved} onSave={handleSave} />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.lg
  },
  content: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl
  },
  errorCard: {
    backgroundColor: colors.card,
    borderColor: colors.danger,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md
  },
  errorText: {
    ...typography.body,
    color: colors.danger
  },
  header: {
    ...typography.headerLarge,
    marginBottom: spacing.md
  },
  input: {
    ...typography.body,
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderRadius: radii.button,
    borderWidth: 1,
    color: colors.text,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  inputGroup: {
    marginBottom: spacing.md
  },
  dateButton: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderRadius: radii.button,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  dateButtonText: {
    ...typography.body,
    color: colors.text
  },
  inputLabel: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xs
  },
  inputWrap: {
    position: "relative"
  },
  keyboard: {
    backgroundColor: colors.background,
    flex: 1
  },
  picker: {
    color: colors.text
  },
  pickerWrap: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderRadius: radii.button,
    borderWidth: 1,
    overflow: "hidden"
  },
  predictButton: {
    alignItems: "center",
    borderRadius: radii.button,
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: 54
  },
  predictText: {
    ...typography.body,
    color: colors.background,
    fontWeight: "700"
  },
  suffix: {
    ...typography.body,
    color: colors.textMuted,
    position: "absolute",
    right: spacing.md,
    top: 14
  }
});
