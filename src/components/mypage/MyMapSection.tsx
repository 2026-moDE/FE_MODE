import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import {NaverMapViewRef} from '@mj-studio/react-native-naver-map';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import MapView from '../map/MapView';
import {getMyReviews, MyReview} from '../../api/mypage';
import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {searchPlaces} from '../../api/search';
import LiveBubble from '../home/LiveBubble';
import ClusterBubble from '../home/ClusterBubble';
import Supercluster from 'supercluster';
import type {
  NearbyPlace,
  CongestionLevel,
} from '../../types/place';
import {AppStackParamList} from '../../types/navigation';

type Props = {
  mapRef: React.RefObject<NaverMapViewRef | null>;
};

type PlaceReviewGroup = {
  placeId: number;
  placeName: string;
  address: string;
  reviews: MyReview[];
  representativeReview: MyReview;
};

type LocatedPlaceReviewGroup = PlaceReviewGroup & {
  latitude: number;
  longitude: number;
};

export default function MyMapSection({mapRef}: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [locatedGroups, setLocatedGroups] = useState<
    LocatedPlaceReviewGroup[]
  >([]);


  const myMapPlaces = useMemo<NearbyPlace[]>(() => {
    return locatedGroups.map(group => ({
        id: group.placeId,
        name: group.placeName,
        address: group.address,
        latitude: group.latitude,
        longitude: group.longitude,
        congestion_level:
        group.representativeReview.congestion_level as CongestionLevel,
        thumbnail_url:
        group.representativeReview.image_url ?? '',
    }));
    }, [locatedGroups]);

  // 클러스터링 (줌 6 고정이라 넓은 범위)
  const supercluster = useMemo(() => {
    const cluster = new Supercluster({ radius: 60, maxZoom: 14, minPoints: 2 });
    cluster.load(myMapPlaces.map(p => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
      properties: { place: p },
    })));
    return cluster;
  }, [myMapPlaces]);

  const clusters = useMemo(() => {
    return supercluster.getClusters([-180, -90, 180, 90], 6);
  }, [supercluster]);

  const groupedReviews = useMemo<PlaceReviewGroup[]>(() => {
  const groupMap = new Map<number, MyReview[]>();

    reviews.forEach(review => {
        const existingReviews = groupMap.get(review.place.id) ?? [];

        groupMap.set(review.place.id, [
        ...existingReviews,
        review,
        ]);
    });

    return Array.from(groupMap.entries()).map(([placeId, placeReviews]) => {
        const sortedReviews = [...placeReviews].sort(
        (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        );

        const representativeReview = sortedReviews[0];

        return {
        placeId,
        placeName: representativeReview.place.name,
        address: representativeReview.place.address,
        reviews: sortedReviews,
        representativeReview,
        };
    });
    }, [reviews]);


    useEffect(() => {
    if (groupedReviews.length === 0) {
        return;
    }

    console.log(
        '[마이맵 장소별 리뷰]',
        groupedReviews.map(group => ({
        placeId: group.placeId,
        placeName: group.placeName,
        reviewCount: group.reviews.length,
        representativeImage:
            group.representativeReview.image_url,
        })),
    );
    }, [groupedReviews]);


    useEffect(() => {
    if (groupedReviews.length === 0) {
        setLocatedGroups([]);
        return;
    }

    let cancelled = false;

    const loadPlaceLocations = async () => {
        try {
        const results = await Promise.all(
            groupedReviews.map(async group => {
            const searchResult = await searchPlaces(group.placeName);

            const matchedPlace = searchResult.places.find(
                place => place.id === group.placeId,
                ) as
                | {
                    id: number;
                    latitude?: number;
                    longitude?: number;
                    }
                | undefined;

            if (
                !matchedPlace ||
                matchedPlace.latitude == null ||
                matchedPlace.longitude == null
            ) {
                console.log(
                '[마이맵 장소 좌표 없음]',
                group.placeId,
                group.placeName,
                );

                return null;
            }

            return {
                ...group,
                latitude: matchedPlace.latitude,
                longitude: matchedPlace.longitude,
            };
            }),
        );

        if (cancelled) {
            return;
        }

        const validGroups = results.filter(
            (group): group is LocatedPlaceReviewGroup => group !== null,
        );

        setLocatedGroups(validGroups);

        console.log(
            '[마이맵 좌표 결합 완료]',
            validGroups.map(group => ({
            placeId: group.placeId,
            placeName: group.placeName,
            latitude: group.latitude,
            longitude: group.longitude,
            reviewCount: group.reviews.length,
            })),
        );
        } catch (error) {
        console.log('[마이맵 장소 좌표 조회 실패]', error);
        }
    };

    loadPlaceLocations();

    return () => {
        cancelled = true;
    };
    }, [groupedReviews]);

  useEffect(() => {
    loadMyReviews();
  }, []);


  const loadMyReviews = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const data = await getMyReviews({
        limit: 100,
      });

      setReviews(data.reviews);

      console.log(
        '[마이맵 내 리뷰 목록]',
        JSON.stringify(data.reviews, null, 2),
      );
    } catch (error) {
      console.log('[마이맵 내 리뷰 조회 실패]', error);
      setErrorMessage('리뷰 정보를 불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        initialCamera={{
            latitude: 37.5665,
            longitude: 126.978,
            zoom: 6,
        }}
        isShowLocationButton={false}
        showLocationMarker={false}
        isScrollGesturesEnabled={false}
        isZoomGesturesEnabled={false}
        isTiltGesturesEnabled={false}
        isRotateGesturesEnabled={false}
        isStopGesturesEnabled={false}
        onTapMap={() => navigation.navigate('MyMap')}>
        {clusters.map(cluster => {
            const [lng, lat] = cluster.geometry.coordinates;
            if (cluster.properties.cluster) {
                return (
                    <ClusterBubble
                        key={`my-map-cluster-${cluster.properties.cluster_id}`}
                        latitude={lat}
                        longitude={lng}
                        count={cluster.properties.point_count}
                        thumbnailUrl={supercluster.getLeaves(cluster.properties.cluster_id, 1)[0]?.properties.place.thumbnail_url}
                        onPress={() => navigation.navigate('MyMap')}
                    />
                );
            }
            const place = cluster.properties.place;
            return (
                <LiveBubble
                    key={`my-map-${place.id}`}
                    place={place}
                    onPress={() => navigation.navigate('MyMap')}
                    monochrome
                />
            );
        })}
      </MapView>

      {/* 지도 위 터치 오버레이 */}
      <TouchableOpacity
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        onPress={() => navigation.navigate('MyMap')}
      />

      {loading && (
        <View style={styles.statusBox}>
          <ActivityIndicator size="small" color={colors.icon.basic} />
        </View>
      )}

      {!loading && errorMessage ? (
        <View style={styles.statusBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },

  statusBox: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
  },

  errorText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#999999',
  },
  
});