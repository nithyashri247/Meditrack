import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically attach the logged-in user's token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
  "meditrack_access_token"
);

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    /*
     * IMPORTANT:
     * Do not force Content-Type to application/json.
     *
     * Axios/browser will automatically set the
     * correct Content-Type for FormData uploads,
     * including the required multipart boundary.
     */

    if (
      config.data instanceof FormData
    ) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;