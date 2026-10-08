import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';
import {typography} from '../../constants/typography';

type Props = {
    text: string;
    // down(기본) = 말풍선 화살표가 아래로 가리킴 (가리키는 대상이 이 컴포넌트보다 아래에 있을 때)
    // up = 말풍선 화살표가 위로 가리킴 (가리키는 대상이 이 컴포넌트보다 위에 있을 때)
    direction?: 'down' | 'up';
    // 화살표만 좌우로 옮기고 싶을 때 (박스는 그대로, 화살표만 이동).
    //  음수 = 왼쪽으로
    tailOffsetX?: number;
};

// 말풍선(박스+화살표) 모양만 그리고, 위치 관련 스타일(position/top/left 등)은 일부러 안 넣음
// 힌트마다 가리켜야 할 대상(헤더 밑 라벨, 화면 정중앙, 버튼 위 등)이 다 달라서, 위치는 매번
// 호출부가 감싸는 View의 스타일로 정하게 맡김 - 예시는 PlaceDetailScreen.tsx의 3가지 참고
// 박스 너비는 항상 text 길이에 맞게 자동으로 정해짐 (고정 width 없음)
export default function SpeechBubbleHint({text, direction = 'down', tailOffsetX = 0}: Props) {
    const bubble = (
        <View style={styles.bubble}>
            <Text style={styles.text}>{text}</Text>
        </View>
    );
    const tail = (
        <View
            style={[
                direction === 'up' ? styles.tailUp : styles.tailDown,
                tailOffsetX !== 0 && {transform: [{translateX: tailOffsetX}]},
            ]}
        />
    );

    // View는 세로로 순서대로 쌓이기 때문에(위→아래)
    return direction === 'up' ? <>{tail}{bubble}</> : <>{bubble}{tail}</>;
}

const styles = StyleSheet.create({
    bubble: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.md,
        backgroundColor: colors.surface.brand,
    },
    text: {
        ...typography.c1,
        color: colors.text.basic,
    },
    tailDown: {
        marginTop: -1,          // 말풍선 박스와의 서브픽셀 틈 방지
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: colors.surface.brand,
    },
    tailUp: {
        marginBottom: -1,       // 말풍선 박스와의 서브픽셀 틈 방지
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: colors.surface.brand,
    },
});
