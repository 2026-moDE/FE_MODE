import React, {useCallback, useRef} from 'react';
import {View, ScrollView, StyleSheet, Dimensions} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {CurrentReview} from '../../types/place';
import {gap} from '../../constants/spacing';
import ExploreCard from './ExploreCard';

const {width: SCREEN_W} = Dimensions.get('window');

const CARD_W = SCREEN_W * 0.38;
const CARD_H = CARD_W * (233 / 177); // aspectRatio 177/233 에서 역산
const CARDS_PER_ROW = 3;
const CARD_GAP = gap.lg;
const EVEN_ROW_OFFSET = CARD_W / 2 + CARD_GAP / 2;
// 좌우 대칭 패딩: 첫 카드~마지막 카드 모두 화면 중앙으로 스크롤 가능
const ROW_SIDE_PADDING = (SCREEN_W - CARD_W) / 2;

type Props = {
    reviews: CurrentReview[];
    onPressCard?: (review: CurrentReview) => void;
    onLongPressCard?: (review: CurrentReview) => void;
    onEndReached?: () => void;
};

export default function ExploreGrid({reviews, onPressCard, onLongPressCard, onEndReached}: Props) {
    // 홀수 행 3개, 짝수 행 2개씩 교대로 분할
    const rows: CurrentReview[][] = [];
    let i = 0;
    let rowIndex = 0;
    while (i < reviews.length) {
        const count = rowIndex % 2 === 0 ? CARDS_PER_ROW : 2;
        rows.push(reviews.slice(i, i + count));
        i += count;
        rowIndex++;
    }

    const rowRefs = useRef<(ScrollView | null)[]>([]);
    const verticalRef = useRef<ScrollView>(null);
    const containerHeightRef = useRef(0);
    const rowsRef = useRef<CurrentReview[][]>([]);
    rowsRef.current = rows; // 항상 최신 rows를 ref에 유지

    const scrollToCenter = useCallback(() => {
        const containerH = containerHeightRef.current;
        const currentRows = rowsRef.current;
        if (!containerH || !currentRows.length) {return;}

        // 가로: 각 행 중앙 카드로
        currentRows.forEach((row, idx) => {
            const isEven = idx % 2 === 1;
            const offset = isEven
                ? Math.floor(row.length / 2) * (CARD_W + CARD_GAP)
                : Math.floor((row.length - 1) / 2) * (CARD_W + CARD_GAP);
            rowRefs.current[idx]?.scrollTo({x: offset, animated: false});
        });

        // 세로: 2-card 줄(짝수번째) 중앙으로 → 3-card 줄(홀수번째)이 상하 엣지에서 잘리게
        const midIndex = Math.floor((currentRows.length - 1) / 2);
        const targetIndex = Math.min(
            midIndex % 2 === 1 ? midIndex : midIndex + 1,
            currentRows.length - 1,
        );
        const rowCenterY = CARD_GAP + targetIndex * (CARD_H + CARD_GAP) + CARD_H / 2;
        const scrollY = Math.max(0, rowCenterY - containerH / 2);
        verticalRef.current?.scrollTo({y: scrollY, animated: false});
    }, []); // rows는 ref로 접근하므로 의존성 불필요

    // 탐색 탭 재진입 시 가로·세로 모두 중앙 리셋
    useFocusEffect(useCallback(() => { scrollToCenter(); }, [scrollToCenter]));

    const renderRow = useCallback((row: CurrentReview[], rowIndex: number) => {
        const isEven = rowIndex % 2 === 1;
        const leftPad = ROW_SIDE_PADDING + (isEven ? EVEN_ROW_OFFSET : 0);
        // 홀수: 중간 카드 중앙 / 짝수: 중간 두 카드 사이 공백 중앙
        // (짝수 행의 시각적 시프트는 leftPad의 EVEN_ROW_OFFSET이 담당)
        const initialOffset = isEven
            ? Math.floor(row.length / 2) * (CARD_W + CARD_GAP)
            : Math.floor((row.length - 1) / 2) * (CARD_W + CARD_GAP);

        return (
            <ScrollView
                key={rowIndex}
                ref={el => { rowRefs.current[rowIndex] = el; }}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                    styles.rowContent,
                    {paddingLeft: leftPad},
                ]}
                onLayout={() => {
                    rowRefs.current[rowIndex]?.scrollTo({x: initialOffset, animated: false});
                }}>
                {row.map(review => (
                    <View key={review.id} style={styles.cardWrapper}>
                        <ExploreCard
                            review={review}
                            onPress={() => onPressCard?.(review)}
                            onLongPress={() => onLongPressCard?.(review)}
                        />
                    </View>
                ))}
            </ScrollView>
        );
    }, [onPressCard]);

    return (
        <ScrollView
            ref={verticalRef}
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            onLayout={e => {
                containerHeightRef.current = e.nativeEvent.layout.height;
                scrollToCenter();
            }}
            onContentSizeChange={() => { scrollToCenter(); }}
            onMomentumScrollEnd={({nativeEvent}) => {
                const {layoutMeasurement, contentOffset, contentSize} = nativeEvent;
                const nearEnd = contentOffset.y + layoutMeasurement.height >= contentSize.height - 200;
                if (nearEnd) {onEndReached?.();}
            }}>
            {rows.map((row, i) => renderRow(row, i))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        gap: CARD_GAP,
        paddingVertical: CARD_GAP,
    },
    rowContent: {
        flexDirection: 'row',
        gap: CARD_GAP,
        paddingRight: ROW_SIDE_PADDING,
    },
    cardWrapper: {
        width: CARD_W,
    },
});
