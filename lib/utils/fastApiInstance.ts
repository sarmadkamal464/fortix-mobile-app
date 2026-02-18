import axios from "axios";
import * as SecureStore from "expo-secure-store";

const getBaseURL = () => {
  const podId = SecureStore.getItemAsync("podId");
  if(podId){
    return `https://${podId}-8000.proxy.runpod.net`
  }else {
    return process.env.NEXT_PUBLIC_FAST_API_URL_HARD_HAT
  }
  
}

const fastApiAxios = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

fastApiAxios.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default fastApiAxios;
