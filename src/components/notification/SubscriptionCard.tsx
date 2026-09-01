import React, {useEffect, useRef} from 'react';
import {View, Text, Image, Pressable, StyleSheet, PixelRatio, Animated, PanResponder} from 'react-native';
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
    const translateX = useRef(new Animated.Value(0)).current;
    // 지금 카드가 멈춰있는 위치 (0 = 닫힘, -DELETE_ACTION_WIDTH = 열림) - 드래그 시작 기준점
    // 즉, 얼마나 왼쪽으로 밀려있는 상태인지를 저장해두는 값
    const restX = useRef(0);

    // 다른 카드가 열리면(부모가 isOpen을 false로 바꾸면) 이 카드는 원위치로
    useEffect(() => {
        if (!isOpen && restX.current !== 0) {
            restX.current = 0;
            Animated.timing(translateX, {toValue: 0, duration: 200, useNativeDriver: false}).start();
        }
    }, [isOpen, translateX]);

    const panResponder = useRef(
        PanResponder.create({
            // 터치가 움직이기 시작할 때, 뷰가 responder될지 결정
            onMoveShouldSetPanResponder: (_, gesture) =>
                // 가로 움직임 && 세로스크롤 막지 않기 위함
                Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
            // 터치 이동할 때마다 반복 호출
            onPanResponderMove: (_, gesture) => {
                // DELETE_ACTION_WIDTH ~ 0까지로 위치를 한정 시키기 위해 min, max씀
                // max은 사용자가 아무리 왼쪽으로 밀어도 최대가 -88이 되도록
                // min은 사용자가 아무리 오른쪽으로 밀어도 최소가 0이 되도록
                const next = Math.min(0, Math.max(-DELETE_ACTION_WIDTH, restX.current + gesture.dx));
                translateX.setValue(next);
            },
            // 터치 뗐을 때
            onPanResponderRelease: (_, gesture) => {
                const current = restX.current + gesture.dx;
                // 손 뗀 위치에 따라 삭제 버튼 열림 or 닫힘 상태로 둘지 결정 
                const shouldOpen = current < -DELETE_ACTION_WIDTH / 2;
                restX.current = shouldOpen ? -DELETE_ACTION_WIDTH : 0;
                // 손 뗀 위치에서 -DELETE_ACTION_WIDTH아니면 0으로 이동 시킴
                Animated.timing(translateX, {toValue: restX.current, duration: 200, useNativeDriver: false}).start();
                onOpenChange(shouldOpen);
            },
        }),
    ).current;

    // 카드가 밀려서 열려있는 동안 텍스트 색을 변경
    const nameColor = translateX.interpolate({
        inputRange: [-DELETE_ACTION_WIDTH, 0],
        outputRange: [colors.text.disabled, colors.text.basic],
    });
    const addressColor = translateX.interpolate({
        inputRange: [-DELETE_ACTION_WIDTH, 0],
        outputRange: [colors.text.disabled, colors.text.tertiary],
    });
    
    // 평소엔 안 보이는 곳에 있다가, 카드가 밀리는 만큼 같이 따라 들어옴
    // translateX가 -88이면 deleteActionTranslateX는 -88 + 88 = 0 (완전히 화면 밖에 숨어있던 삭제 버튼이 화면 안쪽으로)
    // translateX가 0이면 deleteActionTranslateX는 0 + 88 = 88 (삭제 버튼이 자기 너비만큼 오른쪽으로 밀려나 화면 밖으로)
    const deleteActionTranslateX = Animated.add(translateX, new Animated.Value(DELETE_ACTION_WIDTH));

    const handlePress = () => {
        if (isOpen) {
            onOpenChange(false);
        } else {
            onPress(placeId, name);
        }
    };

    return (
        <View style={styles.rowContainer}>
            <Animated.View style={styles.container} {...panResponder.panHandlers}>
                <Pressable style={styles.pressableFill} onPress={handlePress}>
                    <Image source={locationIcon} style={styles.icon} resizeMode="contain" />
                    <View style={styles.info}>
                        <Animated.Text style={[styles.name, {color: nameColor}]} numberOfLines={1}>{name}</Animated.Text>
                        <Animated.Text style={[styles.address, {color: addressColor}]} numberOfLines={1}>{address}</Animated.Text>
                    </View>
                </Pressable>
            </Animated.View>

            <Animated.View style={[styles.deleteAction, {transform: [{translateX: deleteActionTranslateX}]}]}>
                <Pressable style={styles.deleteButton} onPress={() => onDelete(placeId)}>
                    <Text style={styles.deleteText}>삭제</Text>
                </Pressable>
            </Animated.View>
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
