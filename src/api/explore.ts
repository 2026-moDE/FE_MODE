import {apiClient} from './client';
import {CongestionLevel} from '../types/place';

export type ExploreReview = {
    id: number;
    image_url: string;
    thumbnail_url: string | null;
    thumbnail_small_url: string | null;
    congestion_level: CongestionLevel;
    comment: string;
    distance: number;
    place: {
        id: number;
        name: string;
        address: string;
    };
    user: {
        user_id: number;
        nickname: string;
        profile_image_url: string | null;
        profile_url: string | null;
    };
    created_at: string;
};

export type ExploreReviewsResponse = {
    seed: number;
    center: {
        latitude: number;
        longitude: number;
        radius: number;
    };
    total: number;
    next_offset: number | null;
    reviews: ExploreReview[];
};

type FetchExploreReviewsParams = {
    latitude: number;
    longitude: number;
    seed?: number;
    offset?: number;
    limit?: number;
};

type ExploreReviewsApiResponse = {
    success: boolean;
    message: string;
    data: ExploreReviewsResponse;
};

export async function fetchExploreReviews(
    params: FetchExploreReviewsParams,
): Promise<ExploreReviewsResponse> {
    const response = await apiClient.get<ExploreReviewsApiResponse>('/api/explore/reviews', {
        params,
    });
    return response.data.data;
}
