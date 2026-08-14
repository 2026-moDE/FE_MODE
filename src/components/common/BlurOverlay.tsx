import React from 'react';
import {Platform, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import {BlurView} from '@react-native-community/blur';

type Props = {
    style?: StyleProp<ViewStyle>;
    blurAmount?: number;
    // iOS "투명도 감소" 접근성 설정 켠 사용자에게 블러 대신 보여줄 색
    fallbackColor?: string;
};

// 모달/오버레이 배경에 공통으로 쓰는 블러. 플랫폼별 prop 차이(BlurView 타입이 union이라
// blurType="material" + overlayColor를 한 JSX에 같이 못 씀)를 여기서 한 번만 분기 처리.
export default function BlurOverlay({style, blurAmount = 10, fallbackColor = 'rgba(0,0,0,0.5)'}: Props) {
    if (Platform.OS === 'android') {
        return (
            <BlurView
                style={[StyleSheet.absoluteFill, style]}
                blurType="light"
                blurAmount={blurAmount}
                overlayColor="transparent"
            />
        );
    }
    return (
        <BlurView
            style={[StyleSheet.absoluteFill, style]}
            blurType="material"
            blurAmount={blurAmount}
            reducedTransparencyFallbackColor={fallbackColor}
        />
    );
}
