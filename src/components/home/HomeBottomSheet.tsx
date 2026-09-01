import React, {useMemo} from 'react';
import {Text, View, StyleSheet} from 'react-native';
import BottomSheet, {BottomSheetFlatList, BottomSheetScrollView} from '@gorhom/bottom-sheet';
import ClusterPlaceItem from './ClusterPlaceItem';
import FriendReviewSection from './FriendReviewSection';
import TrendingPlacesSection from './TrendingPlacesSection';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {spacing} from '../../constants/spacing';
import {NearbyPlace, TrendingPlace} from '../../types/place';
import {FriendReview} from '../../api/friend';
import type {SharedValue} from 'react-native-reanimated';

type Props = {
    ref?: React.Ref<BottomSheet>;
    places: NearbyPlace[];
    // 주변 장소 최초 조회 중 여부 (로딩중 / 리뷰없음 구분)
    loading?: boolean;
    clusterPlaces ?: NearbyPlace[] | null;
    onPressPlace?: (place: NearbyPlace) => void;
    // 기본 화면(클러스터 미선택) 콘텐츠
    friendReviews?: FriendReview[];
    trendingPlaces?: TrendingPlace[];
    onPressFriendReview?: (item: FriendReview) => void;
    onPressTrendingMore?: (place: TrendingPlace) => void;
    // 시트 상단 Y좌표 (플로팅 버튼이 시트를 따라 움직이게 공유)
    animatedPosition?: SharedValue<number>;
    // 스냅 단계 바뀔 때 (index, 시트 상단 Y position)
    onChange?: (index: number, position: number) => void;
};

// ref로 BottomSheet를 넘겨서 홈 탭 누르면 다시 열 수 있게
export default function HomeBottomSheet({
    ref,
    clusterPlaces,
    onPressPlace,
    friendReviews = [],
    trendingPlaces = [],
    onPressFriendReview,
    onPressTrendingMore,
    animatedPosition,
    onChange,
}: Props) {
    // 시트 단계: 30% 펼침 / 70% 최대 펼침 / (더 내리면 닫힘)
    const snapPoints = useMemo(() => ['30%', '70%'], []);

    return (
        <BottomSheet
            ref={ref}
            snapPoints={snapPoints}
            animatedPosition={animatedPosition}   // 시트 상단 Y좌표를 부모와 공유
            onChange={onChange}
            index={0}                       // 30% 펼친 상태로 시작
            enableDynamicSizing={false}     // 콘텐츠 높이 자동 스냅 끔 (지정한 단계만 사용)
            enablePanDownToClose={true}     // 30% 단계에서 더 내리면 닫힘
            handleIndicatorStyle={styles.handle}
            backgroundStyle={styles.sheetBackground}>
            {clusterPlaces ? (
                <BottomSheetFlatList
                    data={clusterPlaces}
                    keyExtractor={item => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={<Text style={styles.title}>범위 내 리뷰가 달린 장소</Text>}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    renderItem={({item}) => (
                        <ClusterPlaceItem place={item} onPress={onPressPlace} />
                    )}
                />
            ) : (
                <BottomSheetScrollView contentContainerStyle={styles.defaultContent}>
                    <FriendReviewSection items={friendReviews} onPressItem={onPressFriendReview} />
                    <TrendingPlacesSection
                        places={trendingPlaces}
                        onPressMore={onPressTrendingMore}
                    />
                </BottomSheetScrollView>
            )}
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    sheetBackground: {
        backgroundColor: colors.surface.inverse,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    handle: {
        backgroundColor: '#E5E7EA',
        width: 60,
    },
    title: {
        ...typography.b3,
        color: colors.text.inverse,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,      // 16 - 제목 ↔ 목록 첫 항목
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,     // 16 - 마지막 항목 ↔ 시트 하단
    },
    defaultContent: {
        paddingTop: spacing.xl,        // 20
        paddingBottom: spacing.xl,     // 20
        gap: spacing.xl,               // 20 - 친구 리뷰 ↔ 최근 리뷰 섹션
    },
    separator: {
        height: spacing.lg,            // 16 - 항목 사이
    },
});
