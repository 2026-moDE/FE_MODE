import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {typography} from '../../constants/typography';
import IconBell from '../../assets/icons/IconBell';

type Props = {
    count: number;
};

export default function SubscriptionBanner({count}: Props) {
    return (
        <View style={styles.wrapper}>
            <View style={styles.banner}>
                <IconBell size={16} color={colors.text.inverse} />
                <Text style={styles.text}>{count}개의 장소에 알림이 활성화 되어 있어요</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        backgroundColor: colors.surface.white,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.button.secondaryFill,
        borderRadius: 12,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    text: {
        ...typography.b2,
        color: colors.text.inverse,
    },
});
