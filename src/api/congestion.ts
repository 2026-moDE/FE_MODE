import {apiClient} from './client';

export type NearbyCongestionLevel = 'RELAXED' | 'MODERATE' | 'CROWDED' | 'VERY_CROWDED';

export type CongestionForecast = {
    time: string;
    congestion_level: NearbyCongestionLevel;
    population_min: number;
    population_max: number;
};

export type NearbyCongestionData = {
    area_name: string;
    congestion_level: NearbyCongestionLevel;
    congestion_message: string;
    population_min: number;
    population_max: number;
    updated_at: string;
    forecast: CongestionForecast[];
};

type NearbyCongestionApiResponse = {
    success: boolean;
    message: string;
    data: NearbyCongestionData;
};

export async function fetchNearbyCongestion(params: {
    latitude: number;
    longitude: number;
}): Promise<NearbyCongestionData> {
    const response = await apiClient.get<NearbyCongestionApiResponse>(
        '/api/congestion/nearby',
        {params},
    );
    return response.data.data;
}
