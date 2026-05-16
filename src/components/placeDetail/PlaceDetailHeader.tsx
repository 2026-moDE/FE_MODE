import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {typography} from '../../constants/typography';

type Props = {
    title?: string;          // 가운데 표시할 제목 (없으면 빈 헤더)
    onBack: () => void;      // 뒤로가기 콜백
};

export default function PlaceDetailHeader({title, onBack}: Props) {
    return (
        <View style={styles.container}>
            {/* 뒤로가기 버튼 */}
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <IconArrowLeft size={21} color={colors.icon.basic} />
            </TouchableOpacity>

            {/* 중앙 타이틀 */}
            <View style={styles.titleContainer}>
                {title && <Text style={styles.title}>{title}</Text>}
            </View>

            {/* 우측 여백 (뒤로가기 버튼과 대칭 맞춤 → 타이틀 정중앙 정렬) */}
            <View style={styles.rightSpacer} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface.white,
        paddingHorizontal: spacing.lg,    // 16
        paddingVertical: spacing.s,       // 8
    },
    backButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        ...typography.h4,                 // fontSize: 18, bold
        color: colors.text.basic,         // #111114
        letterSpacing: -0.18,
        textAlign: 'center',
    },
    rightSpacer: {
        width: 32,
        height: 32,
    },
});
