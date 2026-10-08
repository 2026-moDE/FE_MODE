import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import Animated, {useAnimatedStyle, interpolate, Extrapolation} from 'react-native-reanimated';
import type {BottomSheetBackdropProps} from '@gorhom/bottom-sheet';
import BlurOverlay from './BlurOverlay';

type Props = BottomSheetBackdropProps & {
    onPress?: () => void;   // 배경 눌렀을 때
};

// BottomSheetModal용 커스텀 backdrop: BlurOverlay + 시트 위치에 따른 페이드 + 눌러서 닫기
export default function BlurBackdrop({animatedIndex, style, onPress}: Props) {
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(animatedIndex.value, [-1, 0], [0, 1], Extrapolation.CLAMP),
    }));

    return (
        <Animated.View style={[style, styles.overlay, animatedStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onPress}>
                <BlurOverlay />
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});
