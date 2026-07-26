import React, {useMemo, forwardRef} from 'react';
import {Text, View, StyleSheet, Pressable, ActivityIndicator} from 'react-native';
import BottomSheet, {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import FastImage from 'react-native-fast-image';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import {NearbyPlace} from '../../types/place';
import type {SharedValue} from 'react-native-reanimated';

type Props = {
    places: NearbyPlace[];
    // 주변 장소 최초 조회 중 여부 (로딩중 / 리뷰없음 구분)
    loading?: boolean;
    onPressPlace?: (place: NearbyPlace) => void;
    // 시트 상단 Y좌표 (플로팅 버튼이 시트를 따라 움직이게 공유)
    animatedPosition?: SharedValue<number>;
    // 스냅 단계 바뀔 때 (index, 시트 상단 Y position)
    onChange?: (index: number, position: number) => void;
};

// 홈 하단 "지금 주변에서 이런 리뷰가 작성됐어요"  바텀시트
// ref로 BottomSheet를 넘겨서 홈 탭 누르면 다시 열 수 있게 함
const ReviewBottomSheet = forwardRef<BottomSheet, Props>(function ReviewBottomSheet({places, loading, onPressPlace, animatedPosition, onChange}, ref) {
    // 썸네일 있는 장소만 표시
    const items = useMemo(() => places.filter(p => p.thumbnail_url), [places]);

    // 시트 단계: 제목만 보이게(55) / 30% 펼침 / 85% 최대 펼침 / (더 내리면 닫힘)
    const snapPoints = useMemo(() => [55, '30%', '85%'], []);

    return (
        <BottomSheet
            ref={ref}
            snapPoints={snapPoints}
            animatedPosition={animatedPosition}   // 시트 상단 Y좌표를 부모와 공유
            onChange={onChange}
            index={1}                       // 30% 펼친 상태로 시작
            enableDynamicSizing={false}     // 콘텐츠 높이 자동 스냅 끔 (지정한 단계만 사용)
            enablePanDownToClose={true}     // 제목 단계에서 더 내리면 닫힘
            handleIndicatorStyle={styles.handle}
            backgroundStyle={styles.sheetBackground}>
            <Text style={styles.title}>지금 주변에서 이런 리뷰가 작성됐어요</Text>
            {loading ? (
                // 최초 조회 중 - 로딩 표시
                <View style={styles.stateBox}>
                    <ActivityIndicator color={colors.text.tertiary} />
                </View>
            ) : items.length === 0 ? (
                // 조회 끝났는데 근처 리뷰 없음
                <View style={styles.stateBox}>
                    <Text style={styles.emptyText}>근처에 작성된 리뷰가 없어요</Text>
                </View>
            ) : (
                // 리뷰 사진 목록
                <BottomSheetFlatList
                    data={items}
                    horizontal
                    keyExtractor={item => String(item.id)}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    renderItem={({item}) => (
                        <Pressable onPress={() => onPressPlace?.(item)}>
                            <FastImage
                                source={{uri: item.thumbnail_url!}}
                                style={styles.thumbnail}
                                resizeMode={FastImage.resizeMode.cover}
                            />
                        </Pressable>
                    )}
                />
            )}
        </BottomSheet>
    );
});

export default ReviewBottomSheet;

const styles = StyleSheet.create({
    sheetBackground: {
        backgroundColor: colors.surface.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    handle: {
        backgroundColor: '#E5E7EA',
        width: 60,
    },
    title: {
        ...typography.b1,
        color: colors.text.basic,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        gap: spacing.s,
    },
    thumbnail: {
        width: 86,
        height: 86,
        borderRadius: radius.md,
        backgroundColor: colors.surface.muted,
    },
    // 로딩중 / 리뷰없음 상태 영역 (사진 자리와 비슷한 높이)
    stateBox: {
        height: 86,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    emptyText: {
        ...typography.b4,
        color: colors.text.tertiary,
    },
});
