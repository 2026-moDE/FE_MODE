import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NaverMapViewRef} from '@mj-studio/react-native-naver-map';

import {AppStackParamList} from '../../types/navigation';
import MapView from '../../components/map/MapView';
import {getMyReviews, getMyProfile, MyReview, MyProfile} from '../../api/mypage';
import {fontFamily} from '../../constants/typography';
import {searchPlaces} from '../../api/search';
import LiveBubble from '../../components/home/LiveBubble';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import type {NearbyPlace, CongestionLevel, CurrentReview} from '../../types/place';
import ReviewPhoto from '../../components/placeDetail/ReviewPhoto';
import {deleteReview} from '../../api/review';

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type Props = NativeStackScreenProps<AppStackParamList, 'MyMap'>;

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

export default function MyMapScreen({navigation}: Props) {
  const mapRef = useRef<NaverMapViewRef>(null);
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [locatedGroups, setLocatedGroups] = useState<LocatedPlaceReviewGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<LocatedPlaceReviewGroup | null>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);

  // 현재 화면에 보이는 장소들의 리뷰 (바텀시트용)
  const [visibleReviews, setVisibleReviews] = useState<MyReview[]>([]);
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const {height: SCREEN_HEIGHT} = Dimensions.get('window');
  const COLLAPSED_HEIGHT = 180;
  const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.55;
  const sheetHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;

  const sheetExpandedRef = useRef(false);
  const lastHeightRef = useRef(COLLAPSED_HEIGHT);

  const animateTo = (expanded: boolean) => {
    sheetExpandedRef.current = expanded;
    setSheetExpanded(expanded);
    const target = expanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
    lastHeightRef.current = target;
    Animated.spring(sheetHeight, {
      toValue: target,
      useNativeDriver: false,
      friction: 10,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        const newHeight = lastHeightRef.current - g.dy;
        const clamped = Math.max(COLLAPSED_HEIGHT, Math.min(EXPANDED_HEIGHT, newHeight));
        sheetHeight.setValue(clamped);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -50) {
          animateTo(true);
        } else if (g.dy > 50) {
          animateTo(false);
        } else {
          animateTo(sheetExpandedRef.current);
        }
      },
    }),
  ).current;

  const myMapPlaces = useMemo<NearbyPlace[]>(() => {
    return locatedGroups.map(group => ({
      id: group.placeId,
      name: group.placeName,
      address: group.address,
      latitude: group.latitude,
      longitude: group.longitude,
      congestion_level: group.representativeReview.congestion_level as CongestionLevel,
      thumbnail_url: group.representativeReview.image_url ?? '',
    }));
  }, [locatedGroups]);

  // visibleReviews → CurrentReview 변환 (ReviewPhoto용)
  const photoReviews = useMemo<CurrentReview[]>(() =>
    visibleReviews
      .filter(r => r.image_url)
      .map(r => ({
        id: r.id,
        image_url: r.image_url!,
        congestion_level: r.congestion_level as CurrentReview['congestion_level'],
        comment: r.comment ?? '',
        helpful_count: r.helpful_count,
        is_helpful: false,
        is_mine: true,
        user: {
          id: profile?.id ?? 0,
          nickname: profile?.nickname ?? '',
          profile_image_url: profile?.profile_image_url ?? '',
        },
        created_at: r.created_at,
      })),
    [visibleReviews, profile],
  );

  const groupedReviews = useMemo<PlaceReviewGroup[]>(() => {
    const groupMap = new Map<number, MyReview[]>();
    reviews.forEach(review => {
      const existing = groupMap.get(review.place.id) ?? [];
      groupMap.set(review.place.id, [...existing, review]);
    });
    return Array.from(groupMap.entries()).map(([placeId, placeReviews]) => {
      const sorted = [...placeReviews].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      return {
        placeId,
        placeName: sorted[0].place.name,
        address: sorted[0].place.address,
        reviews: sorted,
        representativeReview: sorted[0],
      };
    });
  }, [reviews]);

  useEffect(() => {
    if (groupedReviews.length === 0) {
      setLocatedGroups([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const results = await Promise.all(
          groupedReviews.map(async group => {
            const searchResult = await searchPlaces(group.placeName);
            const matched = searchResult.places.find(p => p.id === group.placeId);
            if (!matched || matched.latitude == null || matched.longitude == null) return null;
            return {...group, latitude: matched.latitude, longitude: matched.longitude};
          }),
        );
        if (cancelled) return;
        setLocatedGroups(results.filter((g): g is LocatedPlaceReviewGroup => g !== null));
      } catch (error) {
        console.log('[마이맵 전체화면 좌표 조회 실패]', error);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [groupedReviews]);

  useEffect(() => {
    loadMyReviews();
    getMyProfile().then(setProfile).catch(() => {});
  }, []);

  // 리뷰 데이터가 오면 바로 바텀시트에 표시
  useEffect(() => {
    const withImage = reviews.filter(r => r.image_url);
    setVisibleReviews(withImage);
  }, [reviews]);

  const loadMyReviews = async () => {
    try {
      setLoading(true);
      const data = await getMyReviews({limit: 100});
      setReviews(data.reviews);
    } catch (error) {
      console.log('[마이맵 전체화면 리뷰 조회 실패]', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlacePress = (place: NearbyPlace) => {
    const group = locatedGroups.find(item => item.placeId === place.id);
    if (!group) return;
    setSelectedGroup(group);
    setVisibleReviews(group.reviews.filter(r => r.image_url));
    mapRef.current?.animateCameraTo({
      latitude: group.latitude,
      longitude: group.longitude,
      zoom: 15,
    });
  };

  const handleTapMap = () => {
    setSelectedGroup(null);
    setVisibleReviews(reviews.filter(r => r.image_url));
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerButton} hitSlop={10}>
            <IconArrowLeft size={px(20)} color="#2C343F" />
          </Pressable>
          <Text style={styles.headerTitle}>마이맵</Text>
          <View style={styles.headerButton} />
        </View>
      </SafeAreaView>

      {/* 지도 */}
      <MapView
        ref={mapRef}
        initialCamera={{latitude: 37.5665, longitude: 126.978, zoom: 6}}
        isShowLocationButton={false}
        onTapMap={handleTapMap}>
        {myMapPlaces.map(place => (
          <LiveBubble
            key={`my-map-full-${place.id}`}
            place={place}
            onPress={handlePlacePress}
          />
        ))}
      </MapView>

      {loading && (
        <View style={styles.statusBox}>
          <ActivityIndicator size="small" color="#2C343F" />
        </View>
      )}

      {/* 하단 바텀시트 */}
      {visibleReviews.filter(r => r.image_url).length > 0 && (
        <Animated.View style={[styles.bottomSheet, {height: sheetHeight}]}>
          <Animated.View
            style={styles.dragHandleTouchArea}
            {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </Animated.View>
          <Text style={styles.sheetTitle}>
            {selectedGroup ? selectedGroup.placeName : '이 주변 장소의 사진'}
          </Text>

          {sheetExpanded ? (
            <ScrollView
              style={{flex: 1}}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.photoGrid}>
              {visibleReviews.filter(r => r.image_url).map((review, index) => (
                <TouchableOpacity
                  key={review.id}
                  activeOpacity={0.85}
                  onPress={() => setImageIndex(index)}>
                  <Image
                    source={{uri: review.image_url!}}
                    style={styles.photoGridItem}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.photoGrid}>
              {visibleReviews.filter(r => r.image_url).slice(0, 5).map((review, index) => (
                <TouchableOpacity
                  key={review.id}
                  activeOpacity={0.85}
                  onPress={() => setImageIndex(index)}>
                  <Image
                    source={{uri: review.image_url!}}
                    style={styles.photoGridItem}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>
      )}

      {/* 리뷰 사진 풀스크린 뷰어 */}
      <ReviewPhoto
        reviews={photoReviews}
        startIndex={imageIndex ?? 0}
        visible={imageIndex !== null}
        onClose={() => setImageIndex(null)}
        onDelete={async () => {
          if (imageIndex === null) return;
          try {
            await deleteReview(photoReviews[imageIndex].id);
            setReviews(prev => prev.filter(r => r.id !== photoReviews[imageIndex].id));
            setImageIndex(null);
          } catch (error) {
            console.error('리뷰 삭제 실패:', error);
          }
        }}
        onReport={() => setImageIndex(null)}
        useAbsoluteDate
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: px(16),
    paddingVertical: px(12),
  },
  headerButton: {
    width: px(34),
    height: px(34),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: px(18),
    fontFamily: fontFamily.bold,
    color: '#111114',
  },
  statusBox: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  dragHandleTouchArea: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9D9',
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#111114',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 40,
  },
  photoGridItem: {
    width: (SCREEN_WIDTH - 40 - 32) / 5,
    height: (SCREEN_WIDTH - 40 - 32) / 5,
    borderRadius: 12,
    backgroundColor: '#E0E0E4',
  },
});
