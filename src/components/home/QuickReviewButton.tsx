import React from 'react';
import {Text, Pressable, StyleSheet, ViewStyle} from 'react-native';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import IconQuickReview from '../../assets/icons/IconQuickReview';

type Props = {
    onPress: () => void;
    style?: ViewStyle;
};

// 지도 하단 "지금 바로 리뷰 쓰기"  버튼
export default function QuickReviewButton({onPress, style}: Props) {
    return (
        <Pressable
            style={({pressed}) => [styles.container, pressed && styles.pressed, style]}
            onPress={onPress}
            hitSlop={8}>
            <IconQuickReview size={20} color="#FFFFFF" />
            <Text style={styles.label}>지금 바로 리뷰 쓰기</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 8,                          // 아이콘-텍스트 간격 (p-sm)
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 9999,
        backgroundColor: '#333333',
    },
    pressed: {
        opacity: 0.85,
    },
    label: {
        ...typography.b3,
        color: colors.text.inverse,
    },
});
