# SmartTraffic AI

SmartTraffic AI is a mobile traffic prediction system that combines a React Native Expo app with a FastAPI machine learning backend. The app predicts traffic volume from weather and time inputs, shows live weather data, stores prediction history, and includes a Bangladesh traffic law chatbot powered by a local PDF reference and Groq.

## App Preview

| Home | Prediction Input | Model Prediction |
| --- | --- | --- |
| <img src="img/home%20page.jpeg" alt="SmartTraffic AI home screen" width="240"> | <img src="img/prediction%20input.jpeg" alt="Traffic prediction input screen" width="240"> | <img src="img/model%20prediction.jpeg" alt="Traffic prediction result screen" width="240"> |

| Live Weather | Weather Details | Chatbot |
| --- | --- | --- |
| <img src="img/live%20weather%201.jpeg" alt="Live weather screen" width="240"> | <img src="img/live%20weather%202.jpeg" alt="Live weather details screen" width="240"> | <img src="img/chatbot.jpeg" alt="Bangladesh traffic law chatbot screen" width="240"> |

## Features

- Traffic volume prediction using a trained Random Forest regression model.
- Traffic level classification: low, medium, and high traffic.
- Live weather lookup through OpenWeatherMap.
- One-tap use of live weather values for model prediction.
- Local prediction history with delete and clear actions.
- Bangladesh traffic law chatbot using a bundled legal PDF reference.
- FastAPI backend with health, prediction, and chatbot endpoints.
- Expo mobile app with bottom-tab navigation.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Mobile app | React Native, Expo, React Navigation |
| Backend API | FastAPI, Uvicorn, Pydantic |
| Machine learning | scikit-learn, pandas, NumPy, joblib |
| Chatbot | Groq API, pdfplumber |
| Weather | OpenWeatherMap API |
| Storage | AsyncStorage |

## Project Structure

```text
.
|-- main.py
|-- img/
|   |-- home page.jpeg
|   |-- prediction input.jpeg
|   |-- model prediction.jpeg
|   |-- live weather 1.jpeg
|   |-- live weather 2.jpeg
|   `-- chatbot.jpeg
`-- SmartTrafficAI/
    |-- App.js
    |-- package.json
    |-- src/
    |   |-- components/
    |   |-- constants/
    |   |-- navigation/
    |   |-- screens/
    |   |-- services/
    |   `-- utils/
    `-- Chatbot/
        `-- Data/
            `-- Bangladesh_Traffic_Law_Complete.pdf
```

## Machine Learning Model

The backend uses a trained Random Forest Regressor to predict traffic volume. The model was trained on the Metro Interstate Traffic Volume dataset and uses weather, time, date, and calendar features.

The trained model files and local datasets are intentionally excluded from GitHub. Place the required artifacts in the project root before running the backend locally:

```text
traffic_model.pkl
model_features.pkl
encoding_map.pkl
scaler.pkl
```

Current app metadata:

- Model: Random Forest Regressor
- Dataset: Metro Interstate Traffic Volume, 2012-2018
- Training records: 48,203
- Reported R2 score: 96.46%
- Important features: hour, day of week, temperature, weather condition, rain, snow, and cloud coverage

## Backend Setup

1. Create and activate a Python environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install backend dependencies:

```powershell
pip install fastapi uvicorn pydantic joblib pandas numpy scikit-learn groq pdfplumber python-dotenv
```

3. Add a Groq API key for the chatbot:

Copy `SmartTrafficAI/Chatbot/.env.example` to `SmartTrafficAI/Chatbot/.env` and set your key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

4. Start the FastAPI backend from the project root:

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

5. Check the backend:

```text
http://localhost:8000/health
```

## Mobile App Setup

1. Go to the Expo app folder:

```powershell
cd SmartTrafficAI
```

2. Install dependencies:

```powershell
npm install
```

3. Configure the backend URL in `SmartTrafficAI/src/constants/config.js`.

The app reads public Expo environment variables. Copy `SmartTrafficAI/.env.example` to `SmartTrafficAI/.env` and update the values:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:8000
EXPO_PUBLIC_WEATHER_API_KEY=your_openweathermap_api_key
```

For testing outside the same network, expose the backend with ngrok:

```powershell
ngrok http 8000
```

Then use the HTTPS forwarding URL:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-ngrok-url.ngrok-free.app
```

4. Start Expo:

```powershell
npx expo start
```

Scan the QR code with Expo Go on your phone.

## API Endpoints

### Health Check

```http
GET /health
```

Returns backend status, model name, R2 score, chatbot status, and chat model.

### Predict Traffic

```http
POST /predict
```

Example request:

```json
{
  "hour": 8,
  "temp": 22.0,
  "rain_1h": 0.0,
  "snow_1h": 0.0,
  "clouds_all": 40,
  "weather_condition": "Clouds",
  "day": 4,
  "month": 5,
  "day_of_week": 0
}
```

Example response:

```json
{
  "predicted_volume": 4532,
  "traffic_level": "High Traffic",
  "traffic_emoji": "<traffic indicator>",
  "confidence": "96.46%"
}
```

### Ask Chatbot

```http
POST /chat
```

Example request:

```json
{
  "message": "What is the fine for driving without a license in Bangladesh?"
}
```

Example response:

```json
{
  "reply": "Chatbot answer based on the Bangladesh traffic law reference."
}
```

## Configuration

The app configuration lives in `SmartTrafficAI/src/constants/config.js` and reads from Expo environment variables.

```js
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://YOUR_LOCAL_IP:8000";
export const API_TIMEOUT = 10000;
export const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || "";
export const WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
```

Keep API keys private before publishing the project. For a production version, move secrets out of source code and load them from environment variables or a secure backend.

## Running The Full System

Use three terminals when testing with a physical phone outside your local network:

1. Backend API:

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

2. Backend tunnel:

```powershell
ngrok http 8000
```

3. Expo app:

```powershell
cd SmartTrafficAI
npx expo start --tunnel --clear
```

## Notes

- Keep local-only `traffic_model.pkl`, `model_features.pkl`, `encoding_map.pkl`, and `scaler.pkl` in the project root when running predictions because `main.py` loads them from that location.
- Keep `Bangladesh_Traffic_Law_Complete.pdf` inside `SmartTrafficAI/Chatbot/Data/` because the chatbot loads that PDF on backend startup.
- If the app cannot connect to the backend, confirm that the backend is running, the API URL is correct, and the phone can reach that URL.
- If ngrok gives a new forwarding URL, update `API_BASE_URL` and restart the Expo app.

## License

This project was built for academic and demonstration purposes.
