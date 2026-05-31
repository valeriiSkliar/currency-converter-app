import axios from "axios";
import Env from "env";

export const client = axios.create({
  baseURL: `${Env.EXPO_PUBLIC_API_URL}`,
  headers: {
    "X-App-Service-Key": Env.EXPO_PUBLIC_APP_SERVICE_KEY,
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
  timeout: 10_000,
});

// Request interceptor to log outgoing requests
client.interceptors.request.use((config) => {
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

// Response interceptor to log incoming responses and network errors
client.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.warn(
      `[API Error] ${error.response?.status ?? error.message} ${error.config?.url || ""}`
    );
    return Promise.reject(error);
  }
);

