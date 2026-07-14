import React from 'react';
import {Pressable, Text, StyleSheet} from 'react-native';
import {spacing} from '../../constants/spacing';
import {fontFamily} from '../../constants/typography';
import { colors } from '../../constants/colors';

type Props = {
    onPress: () => void;
    disabled?: boolean;
};

export default function ReportButton({onPress, disabled = false}: Props) {
    return (
        <Pressable
            style={[styles.button, disabled && styles.disabled]}
            onPress={onPress}
            disabled={disabled}>
            <Text style={styles.text}>신고하기</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        width: '100%',
        backgroundColor: colors.button.secondaryFill,
        borderRadius: 12,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing['5xl'],
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabled: {
        backgroundColor: colors.button.disabledFill,
    },
    text: {
        color: colors.text.inverse,
        fontSize: 16,
        fontFamily: fontFamily.bold,
    },
});
