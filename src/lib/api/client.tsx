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
