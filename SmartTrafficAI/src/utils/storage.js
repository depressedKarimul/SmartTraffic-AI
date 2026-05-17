import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "SMART_TRAFFIC_AI_HISTORY";
const MAX_HISTORY = 50;

export const getPredictions = async () => {
  try {
    const stored = await AsyncStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

export const savePrediction = async (predictionObject) => {
  const current = await getPredictions();
  const nextHistory = [predictionObject, ...current].slice(0, MAX_HISTORY);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  return nextHistory;
};

export const deletePrediction = async (id) => {
  const current = await getPredictions();
  const nextHistory = current.filter((item) => item.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  return nextHistory;
};

export const clearPredictions = async () => {
  await AsyncStorage.removeItem(HISTORY_KEY);
};
