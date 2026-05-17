import axios from "axios";
import {
  API_BASE_URL,
  API_TIMEOUT,
  WEATHER_API_KEY,
  WEATHER_BASE_URL
} from "../constants/config";

const configuredBaseUrl = API_BASE_URL.trim();

const normalizedBaseUrl = configuredBaseUrl.startsWith("http")
  ? configuredBaseUrl
  : `http://${configuredBaseUrl}`;

const client = axios.create({
  baseURL: normalizedBaseUrl,
  timeout: API_TIMEOUT,
  headers: {
    "ngrok-skip-browser-warning": "true"
  }
});

const weatherClient = axios.create({
  baseURL: WEATHER_BASE_URL,
  timeout: API_TIMEOUT
});

const friendlyError = (error) => {
  if (error.response?.data?.detail) {
    return String(error.response.data.detail);
  }

  if (error.code === "ECONNABORTED") {
    return `The API request timed out. Check that ${normalizedBaseUrl} is running.`;
  }

  return `Could not reach API at ${normalizedBaseUrl}. Check config.js or use a backend tunnel.`;
};

export const predictTraffic = async (inputData) => {
  try {
    const response = await client.post("/predict", inputData);
    return response.data;
  } catch (error) {
    return {
      error: true,
      message: friendlyError(error)
    };
  }
};

export const checkHealth = async () => {
  try {
    const response = await client.get("/health");
    return response.data;
  } catch (error) {
    return {
      error: true,
      message: friendlyError(error)
    };
  }
};

export const askChatbot = async (message) => {
  try {
    const response = await axios.post(
      `${normalizedBaseUrl}/chat`,
      { message },
      {
        timeout: 15000,
        headers: {
          "ngrok-skip-browser-warning": "true"
        }
      }
    );
    return { reply: response.data.reply };
  } catch (error) {
    return {
      reply: `Sorry, I could not reach the server at ${normalizedBaseUrl}.`
    };
  }
};

export const getCurrentWeather = async (city) => {
  try {
    const response = await weatherClient.get("/weather", {
      params: {
        appid: WEATHER_API_KEY,
        q: city,
        units: "metric"
      }
    });

    return response.data;
  } catch (error) {
    return {
      error: true,
      message:
        error.response?.data?.message ||
        "Could not load live weather. Check the city name or internet connection."
    };
  }
};
