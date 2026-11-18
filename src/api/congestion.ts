import {apiClient} from './client';

export type NearbyCongestionLevel = 'RELAXED' | 'MODERATE' | 'CROWDED' | 'VERY_CROWDED';

export type CongestionForecast = {
    time: string;
    congestion_level: NearbyCongestionLevel;
    population_min: number;
    population_max: number;
};

export type WeatherData = {
    temperature: number;
    sky_status: string;
    rain_chance: number;
    pm10_index: string;
    precipitation_type: string;
};

export type NearbyCongestionData = {
    area_name: string;
    congestion_level: NearbyCongestionLevel;
    congestion_message: string;
    population_min: number;
    population_max: number;
    updated_at: string;
    forecast: CongestionForecast[];
    weather: WeatherData | null;
};

export type CongestionArea = {
    id: number;
    area_name: string;
    category: string;
    latitude: number;
    longitude: number;
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

export async function fetchCongestionAreas(keyword?: string): Promise<CongestionArea[]> {
    const response = await apiClient.get<{success: boolean; message: string; data: {areas: CongestionArea[]}}>(
        '/api/congestion/areas',
        {params: keyword ? {keyword} : undefined},
    );
    return response.data.data.areas;
}

export async function fetchAreaCongestion(areaId: number): Promise<NearbyCongestionData> {
    const response = await apiClient.get<NearbyCongestionApiResponse>(
        `/api/congestion/areas/${areaId}`,
    );
    return response.data.data;
}
