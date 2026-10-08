import React, {useEffect} from 'react';
import {View, Text, Image, Pressable, StyleSheet, PixelRatio} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Reanimated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolateColor,
    runOnJS,
} from 'react-native-reanimated';
import {colors} from '../../constants/colors';
import {spacing, gap as gapToken, padding} from '../../constants/spacing';
import {typography} from '../../constants/typography';
import {Subscription} from '../../types/notifications';

const locationIcon = require('../../assets/image/location.png');
// 기기마다 화면 밀도 차이로 ui깨짐
const ICON_SIZE = PixelRatio.roundToNearestPixel(40 / PixelRatio.get());

const DELETE_ACTION_WIDTH = 88;

type Props = {
    place: Subscription;
    isOpen: boolean;
    // 부모에게 삭제 버튼 열린 상태 여부를 알려주는 콜백
    onOpenChange: (isOpen: boolean) => void;
    onPress: (placeId: number, placeName: string) => void;
    onDelete: (placeId: number) => void;
};

export default function SubscriptionCard({place, isOpen, onOpenChange, onPress, onDelete}: Props) {
    const {place: {id: placeId, name, address}} = place;
    // 지금 카드가 얼마나 왼쪽으로 밀려있는지 (0 = 닫힘, -DELETE_ACTION_WIDTH = 열림)
    const translateX = useSharedValue(0);
    const startX = useSharedValue(0);

    // 다른 카드가 열리면(부모가 isOpen을 false로 바꾸면) 이 카드는 원위치로
    useEffect(() => {
        if (!isOpen) {
            translateX.value = withTiming(0);
        }
    }, [isOpen, translateX]);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-10, 10])
        .onStart(() => {
            startX.value = translateX.value;
        })
        .onUpdate(event => {
            translateX.value = Math.min(
                0,
                Math.max(-DELETE_ACTION_WIDTH, startX.value + event.translationX),
            );
        })
        .onEnd(() => {
            const shouldOpen = translateX.value < -DELETE_ACTION_WIDTH / 2;
            translateX.value = withTiming(shouldOpen ? -DELETE_ACTION_WIDTH : 0);
            runOnJS(onOpenChange)(shouldOpen);
        });

    const tapGesture = Gesture.Tap().onEnd(() => {
        if (isOpen) {
            runOnJS(onOpenChange)(false);
        } else {
            runOnJS(onPress)(placeId, name);
        }
    });

    const rowGesture = Gesture.Race(panGesture, tapGesture);

    // 카드가 밀려서 열려있는 동안 행 배경색을 흰색 → 회색으로 변경 (친구 목록과 동일)
    const rowAnimatedStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            translateX.value,
            [-DELETE_ACTION_WIDTH, 0],
            [colors.surface.default, colors.surface.white],
        ),
    }));

    // 카드가 밀려서 열려있는 동안 텍스트 색을 변경
    const nameAnimatedStyle = useAnimatedStyle(() => ({
        color: interpolateColor(
            translateX.value,
            [-DELETE_ACTION_WIDTH, 0],
            [colors.text.disabled, colors.text.basic],
        ),
    }));
    const addressAnimatedStyle = useAnimatedStyle(() => ({
        color: interpolateColor(
            translateX.value,
            [-DELETE_ACTION_WIDTH, 0],
            [colors.text.disabled, colors.text.tertiary],
        ),
    }));

    // 평소엔 안 보이는 곳에 있다가, 카드가 밀리는 만큼 같이 따라 들어옴
    // translateX가 -88이면 deleteActionTranslateX는 -88 + 88 = 0 (완전히 화면 밖에 숨어있던 삭제 버튼이 화면 안쪽으로)
    // translateX가 0이면 deleteActionTranslateX는 0 + 88 = 88 (삭제 버튼이 자기 너비만큼 오른쪽으로 밀려나 화면 밖으로)
    const deleteAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{translateX: translateX.value + DELETE_ACTION_WIDTH}],
    }));

    return (
        <View style={styles.rowContainer}>
            <GestureDetector gesture={rowGesture}>
                <Reanimated.View style={[styles.container, styles.pressableFill, rowAnimatedStyle]}>
                    <Image source={locationIcon} style={styles.icon} resizeMode="contain" />
                    <View style={styles.info}>
                        <Reanimated.Text style={[styles.name, nameAnimatedStyle]} numberOfLines={1}>{name}</Reanimated.Text>
                        <Reanimated.Text style={[styles.address, addressAnimatedStyle]} numberOfLines={1}>{address}</Reanimated.Text>
                    </View>
                </Reanimated.View>
            </GestureDetector>

            <Reanimated.View style={[styles.deleteAction, deleteAnimatedStyle]}>
                <Pressable style={styles.deleteButton} onPress={() => onDelete(placeId)}>
                    <Text style={styles.deleteText}>삭제</Text>
                </Pressable>
            </Reanimated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    rowContainer: {
        overflow: 'hidden',
    },
    container: {
        backgroundColor: colors.surface.white,
    },
    pressableFill: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: gapToken.sm,                  // 8
        paddingHorizontal: spacing.lg,      // 16
        paddingVertical: spacing.lg,        // 16
    },
    icon: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        marginTop: 4,   // 제목 글자 윗선에 맞춤
    },
    info: {
        flex: 1,
        gap: spacing.xs,
    },
    name: {
        ...typography.b3,
        color: colors.text.basic,
    },
    address: {
        ...typography.b6,
        color: colors.text.tertiary,
    },
    deleteAction: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: DELETE_ACTION_WIDTH,
        backgroundColor: colors.brand.secondary,
    },
    deleteButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: padding['2xl'],   // 24
    },
    deleteText: {
        ...typography.b3,
        color: colors.text.inverse,
    },
});
