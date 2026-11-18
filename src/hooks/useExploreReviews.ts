import {useState, useCallback, useRef} from 'react';
import {CurrentReview} from '../types/place';
import {fetchExploreReviews} from '../api/explore';

type Params = {
    latitude: number;
    longitude: number;
    radiusKm?: number;
};

type State = {
    reviews: CurrentReview[];
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    error: string | null;
};

export function useExploreReviews() {
    const [state, setState] = useState<State>({
        reviews: [],
        isLoading: false,
        isLoadingMore: false,
        hasMore: true,
        error: null,
    });

    const seedRef = useRef<number | undefined>(undefined);
    const offsetRef = useRef(0);
    const isFetchingRef = useRef(false);

    const load = useCallback(async (params: Params, reset = false) => {
        if (isFetchingRef.current) {return;}
        isFetchingRef.current = true;

        if (reset) {
            seedRef.current = undefined;
            offsetRef.current = 0;
        }

        setState(prev => ({
            ...prev,
            isLoading: reset,
            isLoadingMore: !reset,
            error: null,
        }));

        try {
            const data = await fetchExploreReviews({
                latitude: params.latitude,
                longitude: params.longitude,
                radius: params.radiusKm ? params.radiusKm * 1000 : 700000,
                seed: seedRef.current,
                offset: offsetRef.current,
            });

            // seed를 첫 응답에서 저장해 이후 페이지에 재사용
            if (seedRef.current === undefined) {
                seedRef.current = data.seed;
            }
            offsetRef.current = data.next_offset ?? offsetRef.current;

            const mapped: CurrentReview[] = (data.reviews ?? []).map(r => ({
                id: r.id,
                image_url: r.image_url,
                thumbnail_url: r.thumbnail_url,
                thumbnail_small_url: r.thumbnail_small_url,
                congestion_level: r.congestion_level,
                comment: r.comment,
                is_mine: false,
                visibility: 'PUBLIC' as const,
                is_friend: false,
                user: r.user,
                created_at: r.created_at,
                comment_count: 0,
                place_name: r.place.name,
                place_id: r.place.id,
            }));

            setState(prev => ({
                reviews: reset ? mapped : [...prev.reviews, ...mapped],
                isLoading: false,
                isLoadingMore: false,
                hasMore: data.next_offset !== null,
                error: null,
            }));
        } catch (err: any) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                isLoadingMore: false,
                error: err?.message ?? '리뷰를 불러오지 못했어요',
            }));
        } finally {
            isFetchingRef.current = false;
        }
    }, []);

    const refresh = useCallback((params: Params) => {
        load(params, true);
    }, [load]);

    const loadMore = useCallback((params: Params) => {
        if (!state.hasMore || isFetchingRef.current) {return;}
        load(params, false);
    }, [state.hasMore, load]);

    return {...state, refresh, loadMore};
}
