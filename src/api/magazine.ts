import {apiClient} from './client';
import {CongestionLevel} from '../types/place';

export type Magazine = {
    id: number;
    title: string;
    cover_image_url: string;
    item_count: number;
};

export type MagazineItem = {
    review_id: number;
    image_url: string;
    thumbnail_url: string;
    comment: string;
    congestion_level: CongestionLevel;
    created_at: string;
    distance: number | null;
    place: {id: number; name: string; address: string};
    user: {user_id: number; nickname: string; profile_image_url: string};
};

export type MagazineDetail = {
    id: number;
    title: string;
    items: MagazineItem[];
};

type FetchMagazinesParams = {
    latitude: number;
    longitude: number;
    limit?: number;
};

export async function fetchMagazines(params: FetchMagazinesParams): Promise<Magazine[]> {
    const res = await apiClient.get('/api/magazines', {params});
    return res.data.data.magazines;
}

export async function fetchMagazineDetail(
    id: number,
    params?: {latitude?: number; longitude?: number},
): Promise<MagazineDetail> {
    const res = await apiClient.get(`/api/magazines/${id}`, {params});
    return res.data.data;
}
