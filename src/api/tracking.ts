import { apiClient } from './client';
import type { LivePosition } from '@/types';

export const trackingApi = {
  getLivePositions: async () => {
    const response = await apiClient.get<LivePosition[]>('/gps/live-positions/');
    return response.data;
  },

  trackLocation: async (data: {
    trip: number;
    latitude: number;
    longitude: number;
    speed: number;
    accuracy: number;
    recorded_at: string;
  }) => {
    const response = await apiClient.post('/gps/track/', data);
    return response.data;
  },

  batchTrackLocation: async (points: any[]) => {
    const response = await apiClient.post('/gps/batch/', { points });
    return response.data;
  },
};
