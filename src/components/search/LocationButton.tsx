import React from 'react';
import { TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { radius } from '../../constants/radius';

const placePinIcon = require('../../assets/image/place_pin.png');

type Props = {
    onPress: () => void;
};

export default function LocationButton({ onPress }: Props) {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Image source={placePinIcon} style={styles.icon} resizeMode="contain" />
            <Text style={styles.text}>현재 위치로 장소 찾기</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.surface.inverse,  // #111114
        borderRadius: radius.full,                // 9999
        paddingHorizontal: spacing.xl,            // 20
        paddingVertical: spacing.md,              // 12
    },
    icon: {
        width: 14,
        height: 14,
    },
    text: {
        ...typography.c1,
        color: colors.text.inverse,               // #FFFFFF
    },
});
