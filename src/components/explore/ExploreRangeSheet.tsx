import React, {
    forwardRef,
    useCallback,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';

const mapMarkerIcon = require('../../assets/image/mapMarker.png');
import {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetModal,
    BottomSheetView,
} from '@gorhom/bottom-sheet';
import {Image} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {gap, padding} from '../../constants/spacing';
import {radius} from '../../constants/radius';

const DISTANCES = [5, 10, 15] as const;
const THUMB_SIZE = 26;
const TRACK_HEIGHT = 14;

type Props = {
    initialDistanceKm?: number;
    onConfirm?: (distanceKm: number) => void;
};

export type ExploreRangeSheetHandle = {
    present: () => void;
    dismiss: () => void;
};

const ExploreRangeSheet = forwardRef<ExploreRangeSheetHandle, Props>(
    ({initialDistanceKm = 5, onConfirm}, handle) => {
        const insets = useSafeAreaInsets();
        const sheetRef = useRef<BottomSheetModal>(null);

        const initialStep = DISTANCES.indexOf(initialDistanceKm as typeof DISTANCES[number]);
        const [stepIndex, setStepIndex] = useState(Math.max(0, initialStep));

        const trackWidthRef = useRef(0);
        const stepIndexRef = useRef(stepIndex);
        const thumbX = useRef(new Animated.Value(0)).current;
        const startXRef = useRef(0);

        useImperativeHandle(handle, () => ({
            present: () => {
                // 열릴 때 항상 확정된 거리로 슬라이더 리셋
                const confirmedStep = Math.max(0, DISTANCES.indexOf(initialDistanceKm as typeof DISTANCES[number]));
                stepIndexRef.current = confirmedStep;
                setStepIndex(confirmedStep);
                // trackWidth가 이미 잡혀있으면 thumbX도 리셋
                if (trackWidthRef.current > 0) {
                    thumbX.setValue(getPositionForStep(confirmedStep));
                }
                sheetRef.current?.present();
            },
            dismiss: () => sheetRef.current?.dismiss(),
        }));

        // 썸 중심이 트랙의 1/3, 2/3, 3/3 위치에 오도록 계산
        const getPositionForStep = useCallback((step: number) => {
            const w = trackWidthRef.current;
            const center = ((step + 1) / DISTANCES.length) * w;
            return Math.min(center - THUMB_SIZE / 2, w - THUMB_SIZE);
        }, []);

        // 픽셀 x 좌표 → 가장 가까운 step (Math.floor 대신 nearest-center 사용)
        const getNearestStep = useCallback((pixelX: number, trackWidth: number): number => {
            let nearest = 0;
            let minDist = Infinity;
            for (let i = 0; i < DISTANCES.length; i++) {
                const center = ((i + 1) / DISTANCES.length) * trackWidth;
                const dist = Math.abs(pixelX - center);
                if (dist < minDist) { minDist = dist; nearest = i; }
            }
            return nearest;
        }, []);

        const animateToStep = useCallback(
            (step: number) => {
                const clamped = Math.max(0, Math.min(DISTANCES.length - 1, step));
                stepIndexRef.current = clamped;
                setStepIndex(clamped);
                Animated.spring(thumbX, {
                    toValue: getPositionForStep(clamped),
                    useNativeDriver: false,
                    tension: 160,
                    friction: 10,
                }).start();
            },
            [thumbX, getPositionForStep],
        );

        const panGesture = Gesture.Pan()
            .activeOffsetX([-5, 5])
            .failOffsetY([-40, 40])
            .runOnJS(true)
            .onBegin(() => {
                const w = trackWidthRef.current;
                const step = stepIndexRef.current;
                startXRef.current = Math.min(
                    ((step + 1) / DISTANCES.length) * w - THUMB_SIZE / 2,
                    w - THUMB_SIZE,
                );
            })
            .onUpdate(e => {
                const w = trackWidthRef.current;
                const rawX = Math.max(0, Math.min(w - THUMB_SIZE, startXRef.current + e.translationX));
                const nearest = getNearestStep(rawX + THUMB_SIZE / 2, w);
                if (nearest !== stepIndexRef.current) {
                    stepIndexRef.current = nearest;
                    setStepIndex(nearest);
                }
                thumbX.setValue(getPositionForStep(nearest));
            })
            .onEnd(e => {
                const w = trackWidthRef.current;
                const rawX = Math.max(0, Math.min(w - THUMB_SIZE, startXRef.current + e.translationX));
                animateToStep(getNearestStep(rawX + THUMB_SIZE / 2, w));
            });

        const tapGesture = Gesture.Tap()
            .runOnJS(true)
            .onEnd(e => {
                animateToStep(getNearestStep(e.x, trackWidthRef.current));
            });

        // pan이 먼저 경쟁 — 5px 수평 이동 감지되면 pan이 이기고 tap은 취소됨
        // 움직임 없이 손가락을 뗐을 때만 tap이 이김
        const sliderGesture = Gesture.Race(panGesture, tapGesture);

        // 노란 트랙 너비 = 썸 중심까지 (썸X + 반지름)
        const yellowWidth = Animated.add(thumbX, THUMB_SIZE / 2);

        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => (
                <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
            ),
            [],
        );

        const handleConfirm = () => {
            onConfirm?.(DISTANCES[stepIndex]);
            sheetRef.current?.dismiss();
        };

        return (
            <BottomSheetModal
                ref={sheetRef}
                enableDynamicSizing
                backdropComponent={renderBackdrop}
                backgroundStyle={styles.sheetBackground}
                handleComponent={null}>
                <BottomSheetView style={[styles.content, {paddingBottom: insets.bottom + padding.lg}]}>
                    {/* 타이틀 */}
                    <Text style={styles.title}>범위 설정</Text>

                    {/* 거리 텍스트 + 서브타이틀 + 슬라이더 */}
                    <View style={styles.distanceSliderBlock}>
                        <View style={styles.distanceBlock}>
                            <View style={styles.distanceRow}>
                                <Text style={styles.distancePrefix}>내 위치 기준 </Text>
                                <Text style={styles.distanceValue}>{DISTANCES[stepIndex]}.0km</Text>
                                <Text style={styles.distancePrefix}> 이내</Text>
                            </View>
                            <Text style={styles.subtitle}>게시글만 볼 수 있어요</Text>
                        </View>

                        {/* 슬라이더 */}
                        <GestureDetector gesture={sliderGesture}>
                            <View
                                style={styles.sliderWrapper}
                                onLayout={e => {
                                    const w = e.nativeEvent.layout.width;
                                    if (trackWidthRef.current !== w) {
                                        trackWidthRef.current = w;
                                        thumbX.setValue(getPositionForStep(stepIndexRef.current));
                                    }
                                }}>
                                {/* 회색 트랙 (전체) */}
                                <View style={styles.trackGray} />
                                {/* 노란 트랙 (왼쪽) */}
                                <Animated.View
                                    style={[styles.trackYellow, {width: yellowWidth}]}
                                    pointerEvents="none"
                                />
                                {/* 단계 틱마크 — 1/3, 2/3 위치 */}
                                {[1, 2].map(i => (
                                    <View
                                        key={i}
                                        style={[styles.tick, {left: `${(i / DISTANCES.length) * 100}%`}]}
                                        pointerEvents="none"
                                    />
                                ))}
                                {/* 썸 */}
                                <Animated.View
                                    style={[styles.thumb, {transform: [{translateX: thumbX}]}]}
                                />
                            </View>
                        </GestureDetector>
                    </View>

                    {/* 원형 시각화 */}
                    <CircleVisual stepIndex={stepIndex} />

                    {/* 설정하기 버튼 */}
                    <Pressable
                        style={({pressed}) => [styles.confirmBtn, pressed && styles.confirmBtnPressed]}
                        onPress={handleConfirm}>
                        <Text style={styles.confirmBtnText}>설정하기</Text>
                    </Pressable>
                </BottomSheetView>
            </BottomSheetModal>
        );
    },
);

// ─── 원형 시각화 ───────────────────────────────────────────────────────────────

const CIRCLE_SIZES = [
    // 5km: 1개 링
    [{size: 100}],
    // 10km: 2개 링
    [{size: 150}, {size: 100}],
    // 15km: 3개 링
    [{size: 200}, {size: 150}, {size: 100}],
] as const;

// #FFFDBF(yellow[100])를 40% 투명도로 겹겹이 쌓음
// 바깥→안 순서로 배열, 안쪽일수록 더 밝아 보임
const CIRCLE_COLORS = [
    'rgba(255,253,191,0.40)',
    'rgba(255,253,191,0.40)',
    'rgba(255,253,191,0.40)',
];

function CircleVisual({stepIndex}: {stepIndex: number}) {
    const rings = CIRCLE_SIZES[stepIndex];
    const containerSize = 240;

    return (
        <View style={[styles.circleContainer, {width: containerSize, height: containerSize}]}>
            {rings.map((ring, i) => (
                <View
                    key={i}
                    style={[
                        styles.ring,
                        {
                            width: ring.size,
                            height: ring.size,
                            borderRadius: ring.size / 2,
                            backgroundColor: CIRCLE_COLORS[i],
                        },
                    ]}
                />
            ))}
            {/* 중심 맵마커 */}
            <Image source={mapMarkerIcon} style={styles.centerMarker} resizeMode="contain" />
        </View>
    );
}

export default ExploreRangeSheet;

const styles = StyleSheet.create({
    sheetBackground: {
        backgroundColor: '#1B2129',
        borderTopLeftRadius: radius['3xl'],
        borderTopRightRadius: radius['3xl'],
    },
    content: {
        paddingHorizontal: padding['3xl'],
        paddingTop: gap['2xl'],
        gap: gap['2xl'],
        alignItems: 'center',
    },
    title: {
        ...typography.b1,
        color: colors.text.inverse,
    },
    distanceSliderBlock: {
        width: '100%',
        alignItems: 'center',
        gap: radius.lg,  // 12px — 디자인 스펙
    },
    distanceBlock: {
        alignItems: 'center',
        gap: gap.sm,
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    distancePrefix: {
        ...typography.h3,
        color: colors.text.inverse,
    },
    distanceValue: {
        ...typography.h3,
        color: colors.brand.primary,
    },
    subtitle: {
        ...typography.b6,
        color: colors.text.disabled,
    },
    sliderWrapper: {
        width: '100%',
        height: THUMB_SIZE,
        justifyContent: 'center',
    },
    trackGray: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: TRACK_HEIGHT,
        borderRadius: radius.full,
        backgroundColor: colors.surface.muted,
    },
    trackYellow: {
        position: 'absolute',
        left: 0,
        height: TRACK_HEIGHT,
        borderRadius: radius.full,
        backgroundColor: colors.brand.primary,
    },
    tick: {
        position: 'absolute',
        width: 2,
        height: TRACK_HEIGHT,
        marginLeft: -1,
        backgroundColor: '#1B2129',
    },
    thumb: {
        position: 'absolute',
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: colors.text.inverse,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    circleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    ring: {
        position: 'absolute',
    },
    centerMarker: {
        position: 'absolute',
        width: 28,
        height: 28,
    },
    confirmBtn: {
        width: '100%',
        height: 52,
        borderRadius: radius.xl,
        backgroundColor: colors.button.secondaryFill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnPressed: {
        opacity: 0.75,
    },
    confirmBtnText: {
        ...typography.b3,
        color: colors.text.inverse,
    },
});
