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

const CARD_W = SCREEN_W * 0.38;
const CARD_H = CARD_W * (233 / 177);
const CARDS_PER_ROW = 3;
const CARD_GAP = gap.lg;
const EVEN_ROW_OFFSET = CARD_W / 2 + CARD_GAP / 2;
const SIDE_PAD = (SCREEN_W - CARD_W) / 2;
const CANVAS_W = SIDE_PAD * 2 + CARDS_PER_ROW * CARD_W + (CARDS_PER_ROW - 1) * CARD_GAP;
const INITIAL_X = -((CANVAS_W - SCREEN_W) / 2);
// x 스크롤 범위: 카드 끝 + CARD_GAP*2 여백
const X_PAD = CARD_GAP * 2;
const MAX_X = -SIDE_PAD + X_PAD;
const MIN_X = SCREEN_W - CANVAS_W + SIDE_PAD - X_PAD;

type Props = {
    reviews: CurrentReview[];
    onPressCard?: (review: CurrentReview) => void;
    onLongPressCard?: (review: CurrentReview) => void;
    onEndReached?: () => void;
};

export default function ExploreGrid({reviews, onPressCard, onLongPressCard, onEndReached}: Props) {
    const [containerH, setContainerH] = useState(0);

    const rows = useMemo(() => {
        const result: CurrentReview[][] = [];
        let i = 0;
        let rowIdx = 0;
        while (i < reviews.length) {
            const count = rowIdx % 2 === 0 ? CARDS_PER_ROW : 2;
            result.push(reviews.slice(i, i + count));
            i += count;
            rowIdx++;
        }
        return result;
    }, [reviews]);

    const canvasH = CARD_GAP + rows.length * (CARD_H + CARD_GAP);

    const translateX = useSharedValue(INITIAL_X);
    const translateY = useSharedValue(0);
    const startX = useSharedValue(INITIAL_X);
    const startY = useSharedValue(0);
    const minYSV = useSharedValue(0);

    useEffect(() => {
        if (containerH > 0) {
            minYSV.value = Math.min(-(canvasH - containerH), 0);
        }
    }, [canvasH, containerH]);

    useFocusEffect(useCallback(() => {
        translateX.value = INITIAL_X;
        translateY.value = 0;
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

    const gesture = Gesture.Pan()
        .minDistance(10)
        .onStart(() => {
            startX.value = translateX.value;
            startY.value = translateY.value;
        })
        .onUpdate(e => {
            const newX = Math.max(Math.min(startX.value + e.translationX, MAX_X), MIN_X);
            const newY = Math.max(Math.min(startY.value + e.translationY, 0), minYSV.value);
            translateX.value = newX;
            translateY.value = newY;
            if (newY <= minYSV.value + 300) {
                runOnJS(triggerEndReached)();
            }
        })
        .onEnd(e => {
            translateX.value = withDecay({velocity: e.velocityX, clamp: [MIN_X, MAX_X]});
            translateY.value = withDecay({velocity: e.velocityY, clamp: [minYSV.value, 0]});
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            {translateX: translateX.value},
            {translateY: translateY.value},
        ],
    }));

    const cards = useMemo(() => rows.flatMap((row, rowIdx) => {
        const isEvenRow = rowIdx % 2 === 1;
        const rowY = CARD_GAP + rowIdx * (CARD_H + CARD_GAP);
        const baseX = SIDE_PAD + (isEvenRow ? EVEN_ROW_OFFSET : 0);
        return row.map((review, colIdx) => ({
            review,
            x: baseX + colIdx * (CARD_W + CARD_GAP),
            y: rowY,
        }));
    }), [rows]);

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        setContainerH(e.nativeEvent.layout.height);
    }, []);

    return (
        <View style={styles.container} onLayout={onLayout}>
            <GestureDetector gesture={gesture}>
                <Animated.View
                    style={[styles.canvas, {width: CANVAS_W, height: canvasH}, animatedStyle]}>
                    {cards.map(({review, x, y}) => (
                        <View key={review.id} style={[styles.card, {left: x, top: y}]}>
                            <ExploreCard
                                review={review}
                                onPress={() => onPressCard?.(review)}
                                onLongPress={() => onLongPressCard?.(review)}
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
