import React, {useMemo} from 'react';
import {Text, View, StyleSheet} from 'react-native';
import BottomSheet, {BottomSheetFlatList, BottomSheetScrollView} from '@gorhom/bottom-sheet';
import ClusterPlaceItem from './ClusterPlaceItem';
import FriendReviewSection from './FriendReviewSection';
import TrendingPlacesSection from './TrendingPlacesSection';
import CongestionCard from './CongestionCard';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {spacing} from '../../constants/spacing';
import {NearbyPlace} from '../../types/place';
import {FriendReview} from '../../api/friend';
import {NearbyCongestionData} from '../../api/congestion';
import {RecommendedPlace} from '../../api/place';
import type {SharedValue} from 'react-native-reanimated';

// updated_at ISO 문자열 → "MM.DD HH:mm" 형식
function formatUpdatedAt(isoString: string): string {
    const date = new Date(isoString);
    const mm  = String(date.getMonth() + 1).padStart(2, '0');
    const dd  = String(date.getDate()).padStart(2, '0');
    const hh  = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${mm}.${dd} ${hh}:${min}`;
}


type Props = {
    ref?: React.Ref<BottomSheet>;
    places: NearbyPlace[];
    loading?: boolean;
    clusterPlaces?: NearbyPlace[] | null;
    onPressPlace?: (place: NearbyPlace) => void;
    // 기본 화면(클러스터 미선택) 콘텐츠
    friendReviews?: FriendReview[];
    recommendPlaces?: RecommendedPlace[];
    recommendMessage?: string;
    congestionData?: NearbyCongestionData | null;
    onPressFriendReview?: (item: FriendReview) => void;
    onPressTrendingMore?: (place: RecommendedPlace) => void;
    // 시트 상단 Y좌표 (플로팅 버튼이 시트를 따라 움직이게 공유)
    animatedPosition?: SharedValue<number>;
    onChange?: (index: number, position: number) => void;
};

// ref로 BottomSheet를 넘겨서 홈 탭 누르면 다시 열 수 있게
export default function HomeBottomSheet({
    ref,
    clusterPlaces,
    onPressPlace,
    friendReviews = [],
    recommendPlaces = [],
    recommendMessage,
    congestionData,
    onPressFriendReview,
    onPressTrendingMore,
    animatedPosition,
    onChange,
}: Props) {
    const displayPlaces  = recommendPlaces;
    const displayMessage = recommendMessage ?? '근처에서 인기 있는 장소예요';

    const congestionCard = useMemo(() => {
        if (!congestionData || congestionData.forecast.length === 0) return null;
        return {
            areaName:     congestionData.area_name,
            baseTime:     formatUpdatedAt(congestionData.updated_at),
            currentLevel: congestionData.congestion_level,
            updatedAt:    congestionData.updated_at,
            forecast:     congestionData.forecast,
        };
    }, [congestionData]);

    // 시트 단계: 30% 펼침 / 70% 최대 펼침 / (더 내리면 닫힘)
    const snapPoints = useMemo(() => ['30%', '70%'], []);

    return (
        <BottomSheet
            ref={ref}
            snapPoints={snapPoints}
            animatedPosition={animatedPosition}
            onChange={onChange}
            index={0}
            enableDynamicSizing={false}
            enablePanDownToClose={true}
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
                    {congestionCard && (
                        <CongestionCard
                            areaName={congestionCard.areaName}
                            baseTime={congestionCard.baseTime}
                            currentLevel={congestionCard.currentLevel}
                            updatedAt={congestionCard.updatedAt}
                            forecast={congestionCard.forecast}
                        />
                    )}
                    <TrendingPlacesSection
                        places={displayPlaces}
                        message={displayMessage}
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
        marginBottom: spacing.lg,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    defaultContent: {
        paddingTop: spacing.xl,
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.lg,
        gap: spacing.xl,
    },
    separator: {
        height: spacing.lg,
    },
});
