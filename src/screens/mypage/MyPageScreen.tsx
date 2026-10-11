import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  StatusBar,
  ScrollView,
  Share,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NaverMapViewRef} from '@mj-studio/react-native-naver-map';
import {BottomSheetModal} from '@gorhom/bottom-sheet';

import {colors} from '../../constants/colors';
import PieceProfileHeader from '../../components/mypage/PieceProfileHeader';
import ProfileActionButtons from '../../components/mypage/ProfileActionButtons';
import MyMapRow from '../../components/mypage/MyMapRow';
import RecentReviewSection from '../../components/mypage/RecentReviewSection';
import ProfileShareModal from '../../components/mypage/ProfileShareModal';
import {getMyProfile, getMyReviews, MyProfile, MyReview} from '../../api/mypage';
import {changeReview, deleteReview} from '../../api/review';
import {
  getMyPieces,
  updatePiecePositions,
  type Piece,
  type PiecePlacement,
} from '../../api/piece';

const REVIEW_PAGE_LIMIT = 20;
const SCROLL_END_THRESHOLD = 120;

export default function MypageScreen() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<NaverMapViewRef>(null);
  const scrollRef = useRef<ScrollView>(null);
  const shareModalRef = useRef<BottomSheetModal>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [recentReviews, setRecentReviews] = useState<MyReview[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const isLoadingMoreRef = useRef(false);
  const [pieces, setPieces] = useState<Piece[]>([]);
  // 화면에 들어올 때마다 조각이 다시 떨어져 쌓이는 애니메이션을 보여주려고 보드를 새로 마운트시킨다
  const [boardRunId, setBoardRunId] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      const result = await getMyProfile();

      console.log('[프로필 재조회 성공]', result);
      setProfile(result);
    } catch (error) {
      console.log('[프로필 재조회 실패]', error);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  const loadRecentReviews = useCallback(async () => {
    try {
      const data = await getMyReviews({limit: REVIEW_PAGE_LIMIT});
      setRecentReviews(data.reviews);
      setNextCursor(data.next_cursor);
    } catch (error) {
      console.log('[최신 리뷰 조회 실패]', error);
    } finally {
      setIsReviewsLoading(false);
    }
  }, []);

  const loadMoreReviews = useCallback(async () => {
    if (isLoadingMoreRef.current || nextCursor == null) return;

    isLoadingMoreRef.current = true;
    setIsLoadingMoreReviews(true);
    try {
      const data = await getMyReviews({cursor: nextCursor, limit: REVIEW_PAGE_LIMIT});
      setRecentReviews(prev => [...prev, ...data.reviews]);
      setNextCursor(data.next_cursor);
    } catch (error) {
      console.log('[리뷰 추가 조회 실패]', error);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMoreReviews(false);
    }
  }, [nextCursor]);

  const loadPieces = useCallback(async () => {
    try {
      const data = await getMyPieces();

      // 내 보드에는 PRIVATE 조각도 보여준다 - 안 그러면 숨긴 조각을 다시 찾아 되돌릴 방법이 없다
      setPieces(data.pieces);
    } catch (error) {
      // 조각 API가 아직 없는 동안은 빈 보드로 둔다
      console.log('[조각 목록 조회 실패]', error);
      setPieces([]);
    } finally {
      setBoardRunId(prev => prev + 1);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadRecentReviews();
      loadPieces();
    }, [loadProfile, loadRecentReviews, loadPieces]),
  );

  const applyPlacements = useCallback((placements: PiecePlacement[]) => {
    setPieces(prev =>
      prev.map(piece => {
        const placed = placements.find(p => p.piece_id === piece.id);

        return placed
          ? {
              ...piece,
              position_x: placed.position_x,
              position_y: placed.position_y,
              rotation: placed.rotation,
              scale: placed.scale,
            }
          : piece;
      }),
    );
  }, []);

  // 보드가 중력 배치로 계산한 자리를 저장 (새 조각의 첫 배치, 크기가 바뀌어 다시 떨어진 조각, 드래그 후 재안착)
  const handlePlacePieces = useCallback(
    async (placements: PiecePlacement[]) => {
      applyPlacements(placements);

      try {
        await updatePiecePositions(placements);
      } catch (error) {
        console.log('[조각 배치 저장 실패]', error);
      }
    },
    [applyPlacements],
  );


  // 이미 마이페이지인 상태에서 탭을 다시 누르면 맨 위로 (CustomTabBar가 활성 탭에서도 tabPress를 쏴줌)
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      scrollRef.current?.scrollTo({y: 0, animated: true});
    });
    return unsubscribe;
  }, [navigation]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {layoutMeasurement, contentOffset, contentSize} = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (layoutMeasurement.height + contentOffset.y);

    if (distanceFromBottom < SCROLL_END_THRESHOLD) {
      loadMoreReviews();
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      await deleteReview(reviewId);
      setRecentReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error) {
      console.log('[리뷰 삭제 실패]', error);
    }
  };

  const handleEditReviewComment = async (reviewId: number, comment: string) => {
    try {
      await changeReview(reviewId, {comment});
      setRecentReviews(prev => prev.map(r => (r.id === reviewId ? {...r, comment} : r)));
    } catch (error) {
      console.log('[리뷰 수정 실패]', error);
    }
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `${profile?.nickname ?? '모잉'}님의 모잉 프로필을 확인해보세요!`,
      });
    } catch (error) {
      console.log('[프로필 공유 실패]', error);
    }
  };

  return (
    // 조각 보드가 상태바 아래까지 올라붙어야 해서 위쪽 세이프에어리어는 주지 않는다
    // (보드 자체가 insets.top을 보고 자리를 잡음)
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.white} />

      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={200}>
        <PieceProfileHeader
          profile={profile}
          isProfileLoading={isProfileLoading}
          pieces={pieces}
          boardRunId={boardRunId}
          onPressBack={() => navigation.navigate('Tab', {screen: 'Home'})}
          onPressSettings={() => navigation.navigate('Setting')}
          onPressFriends={() => navigation.navigate('FollowList')}
          // 조각은 리뷰를 쓴 뒤에 모으는 흐름이라 리뷰 작성(촬영)부터 시작한다
          onPressCollect={() =>
            navigation.navigate('ReviewStack', {screen: 'ReviewCamera'})
          }
          onPlacePieces={handlePlacePieces}
          onEditPiece={piece =>
            navigation.navigate('PieceEdit', {
              pieceId: piece.id,
              imageUrl: piece.image_url,
              name: piece.name,
              placeName: piece.place.name,
              createdAt: piece.created_at,
              visibility: piece.visibility ?? 'PUBLIC',
            })
          }
        />

        <ProfileActionButtons
          onPressEdit={() =>
            navigation.navigate('ProfileEdit', {
              nickname: profile?.nickname ?? '',
              profileImageUrl: profile?.profile_image_url ?? null,
            })
          }
          onPressShare={() => shareModalRef.current?.present()}
        />

        <MyMapRow mapRef={mapRef} reviews={recentReviews} isReviewsLoading={isReviewsLoading} />

        <RecentReviewSection
          profile={profile}
          recentReviews={recentReviews}
          isReviewsLoading={isReviewsLoading}
          isLoadingMore={isLoadingMoreReviews}
          showFriendBadge
          onDeleteReview={handleDeleteReview}
          onEditComment={handleEditReviewComment}
        />
      </ScrollView>

      <ProfileShareModal ref={shareModalRef} onSelectShare={handleShareProfile} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },

  scrollContent: {
    paddingBottom: 110,
  },
});
