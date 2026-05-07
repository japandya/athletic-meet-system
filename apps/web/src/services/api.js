import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api"
});

export const uploadCSV = (file, type = "athletes") => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(`/upload/${type}`, formData);
};
