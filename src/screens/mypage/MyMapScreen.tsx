import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NaverMapViewRef} from '@mj-studio/react-native-naver-map';
import {BottomSheetModal} from '@gorhom/bottom-sheet';

import {AppStackParamList} from '../../types/navigation';
import MapView from '../../components/map/MapView';
import {getMyReviews, getMyProfile, MyReview, MyProfile} from '../../api/mypage';
import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import {searchPlaces} from '../../api/search';
import LiveBubble from '../../components/home/LiveBubble';
import ClusterBubble from '../../components/home/ClusterBubble';
import Supercluster from 'supercluster';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import type {NearbyPlace, CongestionLevel, CurrentReview} from '../../types/place';
import ReviewPhoto from '../../components/placeDetail/ReviewPhoto';
import ReviewReactionsModal from '../../components/mypage/ReviewReactionsModal';
import {deleteReview, fetchEmojis, EmojiReaction} from '../../api/review';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const EMPTY_THUMBNAIL = require('../../assets/image/empty_minicard.png');

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
  const [zoom, setZoom] = useState(6);
  // 홈과 동일한 썸네일 처리: decode 끝난 것만 마커에 그리고(네이티브 비트맵 크래시 방지),
  // 로딩 실패한 URL은 아예 없는 것처럼 취급해서 empty_minicard가 나오게 함
  const [readyUrls, setReadyUrls] = useState<Set<string>>(new Set());
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [bounds, setBounds] = useState<[number, number, number, number]>([-180, -90, 180, 90]);
  const cameraDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<LocatedPlaceReviewGroup | null>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);

  // 현재 화면에 보이는 장소들의 리뷰 (바텀시트용)
  const [visibleReviews, setVisibleReviews] = useState<MyReview[]>([]);
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  // 풀스크린 뷰어에서 스와이프 가능한 범위를 같은 월로 제한하기 위한 키 (예: '2026-7')
  const [viewerMonthKey, setViewerMonthKey] = useState<string | null>(null);

  // 내 리뷰 이모지 반응 목록 (마이페이지 ReviewReactionsModal 재사용)
  const reactionsSheetRef = useRef<BottomSheetModal>(null);
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [isReactionsLoading, setIsReactionsLoading] = useState(false);
  const openReactions = useCallback(async (reviewId: number) => {
    reactionsSheetRef.current?.present();
    setIsReactionsLoading(true);
    try {
      const res = await fetchEmojis(reviewId);
      setReactions(res.reactions);
    } catch (error) {
      console.error('이모지 반응 조회 실패:', error);
      setReactions([]);
    } finally {
      setIsReactionsLoading(false);
    }
  }, []);

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
    return locatedGroups.map(group => {
      // 대표 리뷰(최신)에 사진이 없어도 같은 장소의 다른 리뷰 사진을 마커에 씀 -
      // 최신 리뷰만 보면 사진 있는 장소인데도 빈 썸네일이 뜸
      const reviewWithPhoto =
        group.reviews.find(r => r.thumbnail_small_url ?? r.thumbnail_url ?? r.image_url) ??
        group.representativeReview;

      return {
        id: group.placeId,
        name: group.placeName,
        address: group.address,
        latitude: group.latitude,
        longitude: group.longitude,
        congestion_level: group.representativeReview.congestion_level as CongestionLevel,
        thumbnail_url: reviewWithPhoto.thumbnail_url ?? reviewWithPhoto.image_url ?? '',
        thumbnail_small_url: reviewWithPhoto.thumbnail_small_url ?? null,
      };
    });
  }, [locatedGroups]);

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
    return supercluster.getClusters(bounds, Math.floor(zoom));
  }, [supercluster, bounds, zoom]);

  const handleClusterPress = useCallback((clusterId: number, latitude: number, longitude: number) => {
    const expandZoom = supercluster.getClusterExpansionZoom(clusterId);
    mapRef.current?.animateCameraTo({latitude, longitude, zoom: expandZoom});
  }, [supercluster]);

  const getMonthKey = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  };

  // visibleReviews → CurrentReview 변환 (ReviewPhoto용), 선택된 월로 제한
  const photoReviews = useMemo<CurrentReview[]>(() =>
    visibleReviews
      .filter(r => r.image_url)
      .filter(r => viewerMonthKey === null || getMonthKey(r.created_at) === viewerMonthKey)
      .map(r => ({
        id: r.id,
        image_url: r.image_url!,
        thumbnail_url: r.thumbnail_url ?? null,
        thumbnail_small_url: r.thumbnail_small_url ?? null,
        congestion_level: r.congestion_level as CurrentReview['congestion_level'],
        comment: r.comment ?? '',
        place_name: r.place.name,
        helpful_count: r.helpful_count,
        is_helpful: false,
        is_mine: true,
        // /api/users/me/reviews엔 visibility/is_friend가 없음 - ReviewPhoto를 readOnlyComments로 열어서 댓글 입력창 자체가 없으니 더미값으로
        visibility: 'PUBLIC', // 더미값
        is_friend: false, // 더미값
        user: {
          id: profile?.id ?? 0,
          nickname: profile?.nickname ?? '',
          profile_image_url: profile?.profile_image_url ?? '',
          profile_url: profile?.profile_url ?? null,
        },
        created_at: r.created_at,
      })),
    [visibleReviews, profile, viewerMonthKey],
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

  // 리뷰 사진 뷰어를 열면서, 탭한 리뷰가 속한 월로 스와이프 범위를 제한
  const openViewer = (list: MyReview[], review: MyReview) => {
    const monthKey = getMonthKey(review.created_at);
    const filtered = list.filter(r => r.image_url && getMonthKey(r.created_at) === monthKey);
    const targetIndex = filtered.findIndex(r => r.id === review.id);
    setViewerMonthKey(monthKey);
    setImageIndex(targetIndex >= 0 ? targetIndex : 0);
  };

  const handlePlacePress = (place: NearbyPlace) => {
    const group = locatedGroups.find(item => item.placeId === place.id);
    if (!group) return;
    setSelectedGroup(group);
    const placeReviews = group.reviews.filter(r => r.image_url);
    setVisibleReviews(placeReviews);
    mapRef.current?.animateCameraTo({
      latitude: group.latitude,
      longitude: group.longitude,
      zoom: 15,
    });
    // 리뷰 사진이 있으면 바로 뷰어 열기
    if (placeReviews.length > 0) {
      openViewer(placeReviews, placeReviews[0]);
    }
  };

  const handleTapMap = () => {
    setSelectedGroup(null);
    setVisibleReviews(reviews.filter(r => r.image_url));
  };

  return (
    <View style={styles.container}>
      {/* 지도 카드 */}
      <View style={styles.mapCard}>
        <MapView
          ref={mapRef}
          initialCamera={{latitude: 37.5665, longitude: 126.978, zoom: 6}}
          isShowLocationButton={false}
          showLocationMarker={false}
          onTapMap={handleTapMap}
          onCameraChanged={(params) => {
            if (cameraDebounceRef.current) clearTimeout(cameraDebounceRef.current);
            cameraDebounceRef.current = setTimeout(() => {
              const { latitude, longitude, latitudeDelta, longitudeDelta } = params.region;
              const padLng = longitudeDelta * 0.3;
              const padLat = latitudeDelta * 0.3;
              setZoom(params.zoom ?? 6);
              setBounds([
                Math.max(longitude - longitudeDelta / 2 - padLng, -180),
                Math.max(latitude - latitudeDelta / 2 - padLat, -90),
                Math.min(longitude + longitudeDelta / 2 + padLng, 180),
                Math.min(latitude + latitudeDelta / 2 + padLat, 90),
              ]);
            }, 150);
          }}>
          {clusters.map(cluster => {
            const [lng, lat] = cluster.geometry.coordinates;
            if (cluster.properties.cluster) {
              const leafPlace = supercluster.getLeaves(cluster.properties.cluster_id, 1)[0]?.properties.place;
              const rawThumbnailUrl = leafPlace?.thumbnail_small_url ?? leafPlace?.thumbnail_url;
              // 로딩 실패한(깨진) 이미지는 아예 없는 것처럼 취급 - 네이티브 마커에 절대 안 넘김
              const thumbnailUrl = rawThumbnailUrl && !failedUrls.has(rawThumbnailUrl) ? rawThumbnailUrl : undefined;

              return (
                <ClusterBubble
                  key={`my-map-cluster-${cluster.properties.cluster_id}`}
                  latitude={lat}
                  longitude={lng}
                  count={cluster.properties.point_count}
                  thumbnailUrl={thumbnailUrl}
                  // 프리로더로 디코딩까지 끝난 이미지만 마커에 그려서 네이티브 비트맵 크래시 방지
                  isReady={!!thumbnailUrl && readyUrls.has(thumbnailUrl)}
                  onPress={() => handleClusterPress(cluster.properties.cluster_id, lat, lng)}
                />
              );
            }
            const place = cluster.properties.place;
            const rawPlaceThumbnailUrl = place.thumbnail_small_url ?? place.thumbnail_url;
            const placeThumbnailFailed = !!rawPlaceThumbnailUrl && failedUrls.has(rawPlaceThumbnailUrl);
            // 실패한 썸네일이면 LiveBubble에는 사진 없는 장소처럼 보이도록 필드를 비워서 전달
            const safePlace = placeThumbnailFailed
              ? {...place, thumbnail_url: '', thumbnail_small_url: null}
              : place;
            return (
              <LiveBubble
                key={`my-map-full-${place.id}`}
                place={safePlace}
                isReady={!placeThumbnailFailed && !!rawPlaceThumbnailUrl && readyUrls.has(rawPlaceThumbnailUrl)}
                onPress={handlePlacePress}
                monochrome
              />
            );
          })}
        </MapView>

        {/* 썸네일 프리로더: decode 완료 후에만 마커 렌더 - 버블이 실제로 쓰는 필드(thumbnail_small_url 우선)랑 맞춤 */}
        {myMapPlaces.map(place => {
          const bubbleUrl = place.thumbnail_small_url ?? place.thumbnail_url;
          return bubbleUrl && !readyUrls.has(bubbleUrl) && !failedUrls.has(bubbleUrl) ? (
            <FastImage
              key={place.id}
              source={{uri: bubbleUrl, priority: FastImage.priority.high}}
              style={styles.preloader}
              resizeMode={FastImage.resizeMode.cover}
              onLoad={() => setReadyUrls(prev => new Set([...prev, bubbleUrl]))}
              // 로딩 실패한 이미지는 ready가 아니라 failed로 분리 - 마커에 절대 안 넘어가게
              onError={() => setFailedUrls(prev => new Set([...prev, bubbleUrl]))}
            />
          ) : null;
        })}

        {/* 헤더 (지도 위 오버레이) */}
        <View style={styles.headerGradientWrap} pointerEvents="none">
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
            style={styles.headerGradient}
          />
        </View>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea} pointerEvents="box-none">
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.headerButton} hitSlop={10}>
              <IconArrowLeft size={20} color={colors.icon.inverse} />
            </Pressable>
            <Text style={styles.headerTitle}>마이맵</Text>
            <View style={styles.headerButton} />
          </View>
        </SafeAreaView>

        {loading && (
          <View style={styles.statusBox}>
            <ActivityIndicator size="small" color={colors.icon.basic} />
          </View>
        )}
      </View>

      {/* 하단 바텀시트 */}
      {visibleReviews.filter(r => r.image_url).length > 0 && (
        <Animated.View style={[styles.bottomSheet, {height: sheetHeight}]}>
          <Animated.View
            style={styles.sheetHeader}
            {...panResponder.panHandlers}>
            <View style={styles.dragHandleTouchArea}>
              <View style={styles.dragHandle} />
            </View>
            <Text style={styles.sheetTitle}>
              {selectedGroup ? selectedGroup.placeName : '이 주변 장소의 사진'}
            </Text>
          </Animated.View>

          {sheetExpanded ? (
            <ScrollView
              style={{flex: 1}}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.photoGrid}>
              {visibleReviews.filter(r => r.image_url).map(review => (
                <TouchableOpacity
                  key={review.id}
                  activeOpacity={0.85}
                  onPress={() => openViewer(visibleReviews, review)}>
                  <View style={styles.photoGridItem}>
                    <FastImage source={EMPTY_THUMBNAIL} style={StyleSheet.absoluteFill} resizeMode={FastImage.resizeMode.cover} />
                    <FastImage
                      source={{uri: review.thumbnail_small_url ?? review.thumbnail_url ?? review.image_url!}}
                      style={StyleSheet.absoluteFill}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.photoGrid}>
              {visibleReviews.filter(r => r.image_url).slice(0, 5).map(review => (
                <TouchableOpacity
                  key={review.id}
                  activeOpacity={0.85}
                  onPress={() => openViewer(visibleReviews, review)}>
                  <View style={styles.photoGridItem}>
                    <FastImage source={EMPTY_THUMBNAIL} style={StyleSheet.absoluteFill} resizeMode={FastImage.resizeMode.cover} />
                    <FastImage
                      source={{uri: review.thumbnail_small_url ?? review.thumbnail_url ?? review.image_url!}}
                      style={StyleSheet.absoluteFill}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  </View>
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
        readOnlyComments
        onOpenReactionList={openReactions}
        onPressUser={user => {
          if (user.user_id == null) return;
          navigation.navigate('UserMyPage', {userId: user.user_id});
        }}
        onClose={() => {
          setImageIndex(null);
          setViewerMonthKey(null);
        }}
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

      {/* 내 리뷰 이모지 반응 목록 */}
      <ReviewReactionsModal ref={reactionsSheetRef} reactions={reactions} isLoading={isReactionsLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  // 마커에 그리기 전 디코딩만 시키는 용도라 화면에는 안 보이게
  preloader: {width: 60, height: 60, position: 'absolute', opacity: 0},
  container: {
    flex: 1,
    backgroundColor: colors.background.dimDarkest,
  },
  mapCard: {
    flex: 1,
  },
  headerGradientWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  headerGradient: {
    flex: 1,
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
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
    paddingTop: spacing.sm,
    backgroundColor: colors.background.dimDarkest,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    overflow: 'hidden',
  },
  sheetHeader: {
    width: '100%',
  },
  dragHandleTouchArea: {
    alignItems: 'center',
    paddingTop: spacing.s,
    paddingBottom: spacing.sm,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: radius.xs,
    backgroundColor: '#D9D9D9',
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.s,
    paddingBottom: spacing['4xl'],
  },
  photoGridItem: {
    width: (SCREEN_WIDTH - 40 - 32) / 5,
    height: (SCREEN_WIDTH - 40 - 32) / 5,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.muted,
    borderWidth: 2,
    borderColor: colors.border.inverse,
    overflow: 'hidden',
  },
});
