import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {spacing} from '../../constants/spacing';

type Props = {
    label: string;
    selected: boolean;
    onPress: () => void;
};

export default function ReportReasonItem({label, selected, onPress}: Props) {
    return (
        <Pressable style={styles.container} onPress={onPress}>
            {/* 선택됐을 때만, 색 변경 */}
            <View style={[styles.radio, selected && styles.radioSelected]}> 
                {/* 선택됐을 때만, 원 안에 원 */}
                {selected && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.label}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.lg,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: colors.border.default,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: colors.icon.basic,
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.icon.basic,
    },
    label: {
        ...typography.c2,
        color: colors.text.basic,
    },
});
