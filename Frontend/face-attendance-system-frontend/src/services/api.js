import axios from 'axios';

export const SOCKET_URL = 'http://localhost:5001';
// Create the API instance
const api = axios.create({
  baseURL: 'http://localhost:5001',  // Adjust to your backend URL
  withCredentials: true,
});

// Generic POST function
export const postData = async (url, data, isMultipart = false) => {
  try {
    const response = await api.post(url, data, {
      headers: isMultipart
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' },
    });
    return response.data;  // Return the response data directly
  } catch (error) {
    throw new Error(error.response?.data?.message || 'API request failed');
  }
};

// Generic GET function
export const getData = async (url) => {
  try {
    const response = await api.get(url);
    return response.data;  // Return the response data directly
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch data');
  }
};

// Generic PUT (update) function
export const updateData = async (url, data) => {
  try {
    const response = await api.put(url, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;  // Return the response data directly
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update data');
  }
};

export default api;
