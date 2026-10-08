import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {spacing} from '../../constants/spacing';
import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';

export default function ReportToast() {
    return (
        <View style={styles.container}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.text}>신고가 접수되었어요</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.background.dimDarker,
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    check: {
        color: colors.icon.inverse,
        fontSize: 16,
        fontFamily: fontFamily.bold,
    },
    text: {
        color: colors.text.inverse,
        fontSize: 15,
        fontFamily: fontFamily.medium,
    },
});
