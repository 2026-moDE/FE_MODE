import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {View, StyleSheet, Dimensions, LayoutChangeEvent} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withDecay,
    runOnJS,
} from 'react-native-reanimated';
import {useFocusEffect} from '@react-navigation/native';
import {CurrentReview} from '../../types/place';
import ExploreCard from './ExploreCard';
import {gap} from '../../constants/spacing';

const {width: SCREEN_W} = Dimensions.get('window');

// 시안 기준(393pt 프레임, 카드 161x215, 간격 24)을 화면 폭 비율로 환산
const DESIGN_FRAME_W = 393;
const DESIGN_CARD_W = 161;
const DESIGN_CARD_H = 215;

const CARD_W = SCREEN_W * (DESIGN_CARD_W / DESIGN_FRAME_W);
const CARD_H = CARD_W * (DESIGN_CARD_H / DESIGN_CARD_W);
const CARD_GAP = gap['2xl'];
// 홀수 행이 한 장 적어서 생기는 폭 차이의 절반 - 행을 서로 어긋나게 배치한다
const EVEN_ROW_OFFSET = CARD_W / 2 + CARD_GAP / 2;
const SIDE_PAD = (SCREEN_W - CARD_W) / 2;
// x 스크롤 범위: 카드 끝 + CARD_GAP*2 여백
const X_PAD = CARD_GAP * 2;
const MAX_X = -SIDE_PAD + X_PAD;

// 열 수를 고정하면 캔버스가 세로로만 길어져서 가로 탐색이 사라진다.
// 캔버스가 대략 정사각형이 되게 잡아 리뷰가 쌓일수록 가로·세로로 같이 퍼지게 한다.
const MIN_COLS = 4;
const colsForCount = (count: number) =>
    Math.max(
        MIN_COLS,
        Math.round(Math.sqrt((count * (CARD_H + CARD_GAP)) / (CARD_W + CARD_GAP))),
    );
const canvasWidthForCols = (cols: number) =>
    SIDE_PAD * 2 + cols * CARD_W + (cols - 1) * CARD_GAP;

type Props = {
    reviews: CurrentReview[];
    onPressCard?: (review: CurrentReview) => void;
    onLongPressCard?: (review: CurrentReview) => void;
    onEndReached?: () => void;
};

export default function ExploreGrid({reviews, onPressCard, onLongPressCard, onEndReached}: Props) {
    const [containerH, setContainerH] = useState(0);

    const cols = useMemo(() => colsForCount(reviews.length), [reviews.length]);
    const canvasW = useMemo(() => canvasWidthForCols(cols), [cols]);

    const rows = useMemo(() => {
        const result: CurrentReview[][] = [];
        let i = 0;
        let rowIdx = 0;
        while (i < reviews.length) {
            // 행마다 한 장씩 번갈아 빼서 어긋나게 쌓는다
            const count = rowIdx % 2 === 0 ? cols : cols - 1;
            result.push(reviews.slice(i, i + count));
            i += count;
            rowIdx++;
        }
        return result;
    }, [reviews, cols]);

    const canvasH = CARD_GAP + rows.length * (CARD_H + CARD_GAP);

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const startX = useSharedValue(0);
    const startY = useSharedValue(0);
    const minXSV = useSharedValue(0);
    const minYSV = useSharedValue(0);
    const initialXRef = useRef(0);
    const initialXSetRef = useRef(false);
    const initialYRef = useRef(0);
    const initialYSetRef = useRef(false);

    // 캔버스 폭은 열 수를 따라 바뀌므로 x 경계도 같이 갱신한다 (제스처가 worklet이라 shared value로)
    useEffect(() => {
        minXSV.value = SCREEN_W - canvasW + SIDE_PAD - X_PAD;
        initialXRef.current = -((canvasW - SCREEN_W) / 2);
        if (!initialXSetRef.current) {
            initialXSetRef.current = true;
            translateX.value = initialXRef.current;
        }
    }, [canvasW]);

    useEffect(() => {
        if (containerH > 0 && canvasH > 0) {
            minYSV.value = Math.min(-(canvasH - containerH), 0);
            initialYRef.current = canvasH > containerH ? -(canvasH - containerH) / 2 : 0;
            if (!initialYSetRef.current) {
                initialYSetRef.current = true;
                translateY.value = initialYRef.current;
            }
        }
    }, [canvasH, containerH]);

    useFocusEffect(useCallback(() => {
        translateX.value = initialXRef.current;
        translateY.value = initialYRef.current;
    }, []));

    const endReachedCalledRef = useRef(false);
    const triggerEndReached = useCallback(() => {
        if (endReachedCalledRef.current) {return;}
        endReachedCalledRef.current = true;
        onEndReached?.();
    }, [onEndReached]);

    useEffect(() => {
        endReachedCalledRef.current = false;
    }, [reviews.length]);

    const panRef = useRef(null);

    const pan = Gesture.Pan()
        .withRef(panRef)
        .minDistance(10)
        .onStart(() => {
            startX.value = translateX.value;
            startY.value = translateY.value;
        })
        .onUpdate(e => {
            const newX = Math.max(Math.min(startX.value + e.translationX, MAX_X), minXSV.value);
            const newY = Math.max(Math.min(startY.value + e.translationY, 0), minYSV.value);
            translateX.value = newX;
            translateY.value = newY;
            if (newY <= minYSV.value + 300) {
                runOnJS(triggerEndReached)();
            }
        })
        .onEnd(e => {
            translateX.value = withDecay({velocity: e.velocityX, clamp: [minXSV.value, MAX_X]});
            translateY.value = withDecay({velocity: e.velocityY, clamp: [minYSV.value, 0]});
        });

    const gesture = pan;

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            {translateX: translateX.value},
            {translateY: translateY.value},
        ],
    }));

    const cards = useMemo(() => {
        const allPositions: Array<{x: number; y: number}> = [];
        rows.forEach((row, rowIdx) => {
            const isEvenRow = rowIdx % 2 === 1;
            const rowY = CARD_GAP + rowIdx * (CARD_H + CARD_GAP);
            const baseX = SIDE_PAD + (isEvenRow ? EVEN_ROW_OFFSET : 0);
            row.forEach((_, colIdx) => {
                allPositions.push({x: baseX + colIdx * (CARD_W + CARD_GAP), y: rowY});
            });
        });

        const centerX = canvasW / 2;
        const centerY = canvasH / 2;
        const sortedPositions = [...allPositions].sort((a, b) => {
            const da = (a.x + CARD_W / 2 - centerX) ** 2 + (a.y + CARD_H / 2 - centerY) ** 2;
            const db = (b.x + CARD_W / 2 - centerX) ** 2 + (b.y + CARD_H / 2 - centerY) ** 2;
            return da - db;
        });

        const sortedReviews = [...reviews].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        return sortedPositions.map((pos, idx) => ({
            review: sortedReviews[idx],
            x: pos.x,
            y: pos.y,
        }));
    }, [rows, canvasW, canvasH, reviews]);

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        setContainerH(e.nativeEvent.layout.height);
    }, []);

    return (
        <View style={styles.container} onLayout={onLayout}>
            <GestureDetector gesture={gesture}>
                <Animated.View
                    style={[styles.canvas, {width: canvasW, height: canvasH}, animatedStyle]}>
                    {cards.map(({review, x, y}) => (
                        <View key={review.id} style={[styles.card, {left: x, top: y}]}>
                            <ExploreCard
                                review={review}
                                onPress={() => onPressCard?.(review)}
                                onLongPress={() => onLongPressCard?.(review)}
                                panRef={panRef}
                            />
                        </View>
                    ))}
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    canvas: {
        position: 'absolute',
    },
    card: {
        position: 'absolute',
        width: CARD_W,
        height: CARD_H,
    },
});
