import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {NaverMapViewRef} from '@mj-studio/react-native-naver-map';

import MapView from '../map/MapView';
import {getMyReviews, MyReview} from '../../api/mypage';
import {fontFamily} from '../../constants/typography';
import {searchPlaces} from '../../api/search';
import LiveBubble from '../home/LiveBubble';
import type {
  NearbyPlace,
  CongestionLevel,
} from '../../types/place';

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
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [locatedGroups, setLocatedGroups] = useState<
    LocatedPlaceReviewGroup[]
  >([]);

  const [selectedGroup, setSelectedGroup] =
    useState<LocatedPlaceReviewGroup | null>(null);

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
            );

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

  const handlePlacePress = (place: NearbyPlace) => {
    const group = locatedGroups.find(
        item => item.placeId === place.id,
    );

    if (!group) {
        return;
    }

    setSelectedGroup(group);

    mapRef.current?.animateCameraTo({
        latitude: group.latitude,
        longitude: group.longitude,
        zoom: 15,
    });

    console.log('[마이맵 장소 선택]', group.placeName);
    };

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
        onTapMap={() => setSelectedGroup(null)}>
        {myMapPlaces.map(place => (
            <LiveBubble
            key={`my-map-${place.id}`}
            place={place}
            onPress={handlePlacePress}
            />
        ))}
       </MapView>

       {selectedGroup && (
        <View style={styles.reviewPanel}>
            <View style={styles.dragHandle} />

            <View style={styles.panelHeader}>
            <View>
                <Text style={styles.panelTitle}>
                {selectedGroup.placeName}
                </Text>

                <Text style={styles.panelCount}>
                내가 작성한 리뷰 {selectedGroup.reviews.length}개
                </Text>
            </View>

            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedGroup(null)}>
                <Text style={styles.closeText}>닫기</Text>
            </TouchableOpacity>
            </View>

            <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.reviewImageList}>
            {selectedGroup.reviews.map(review => (
                <TouchableOpacity
                key={review.id}
                activeOpacity={0.85}
                onPress={() => {
                    console.log('[마이맵 리뷰 사진 클릭]', review.id);
                }}>
                <View style={styles.reviewImageBox}>
                    {review.image_url ? (
                    <Image
                        source={{uri: review.image_url}}
                        style={styles.reviewImage}
                        resizeMode="cover"
                    />
                    ) : null}
                </View>
                </TouchableOpacity>
            ))}
            </ScrollView>
        </View>
        )}

      {loading && (
        <View style={styles.statusBox}>
          <ActivityIndicator size="small" color="#2C343F" />
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
    backgroundColor: '#FFFFFF',
  },

  statusBox: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },

  errorText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#999999',
  },
  
  reviewPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: {
        width: 0,
        height: -3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    },

    dragHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9D9',
    marginBottom: 14,
    },

    panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    },

    panelTitle: {
    fontSize: 17,
    fontFamily: fontFamily.bold,
    color: '#111114',
    },

    panelCount: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: '#777777',
    },

    closeText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#6489F2',
    },

    reviewImageList: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 8,
    },

    reviewImageBox: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E0E0E4',
    },

    reviewImage: {
    width: '100%',
    height: '100%',
    },
});