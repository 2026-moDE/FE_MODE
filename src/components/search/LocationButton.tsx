import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { radius } from '../../constants/radius';

type Props = {
    onPress: () => void;
};

export default function LocationButton({ onPress }: Props) {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.text}>⊙ 현재 위치로 장소 찾기</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.surface.inverse,  // #111114
        borderRadius: radius.full,                // 9999
        paddingHorizontal: spacing.xl,            // 20
        paddingVertical: spacing.md,              // 12
    },
    text: {
        ...typography.b4,
        color: colors.text.inverse,               // #FFFFFF
    },
});
