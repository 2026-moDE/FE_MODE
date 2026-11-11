import React from 'react';
import {View, Text, Pressable, Image, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {gap, padding} from '../../constants/spacing';
import IconChevronDown from '../../assets/icons/IconChevronDown';
import {CongestionLevel, CONGESTION_LABEL, CONGESTION_COLOR} from '../../types/place';

const crowdIcon = require('../../assets/image/crowd.png');

type Props = {
    onPressPlace?: () => void;
    congestionLevel?: CongestionLevel;
    baseTime?: string;
};

export default function ExploreHeader({onPressPlace, congestionLevel, baseTime}: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.wrapper, {paddingTop: insets.top + padding.sm}]}>
            <Pressable style={styles.titleRow} onPress={onPressPlace} hitSlop={8}>
                <Text style={styles.title}>지금 내 근처에서는</Text>
                <IconChevronDown size={18} color={colors.text.inverse} />
            </Pressable>
            {congestionLevel && (
                <View style={styles.infoRow}>
                    <Image source={crowdIcon} style={styles.crowdIcon} />
                    <Text style={styles.congestionTitle}>혼잡도</Text>
                    <Text style={[styles.congestionLabel, {color: CONGESTION_COLOR[congestionLevel].bubbleStroke}]}>
                        {CONGESTION_LABEL[congestionLevel]}
                    </Text>
                    <View style={styles.spacer} />
                    {baseTime && (
                        <Text style={styles.baseTime}>{baseTime} 기준</Text>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: padding['4xl'],
        paddingBottom: padding.sm,
        gap: gap.md,
        alignItems: 'stretch',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: gap.xs,
    },
    title: {
        ...typography.b1,
        color: colors.text.inverse,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.xs,
        paddingBottom: padding.xs,
    },
    spacer: {
        flex: 1,
    },
    crowdIcon: {
        width: 22,
        height: 22,
        tintColor: colors.text.disabled,
    },
    congestionTitle: {
        ...typography.b6,
        color: colors.text.disabled,
    },
    congestionLabel: {
        ...typography.b5,
    },
    baseTime: {
        ...typography.c3,
        color: colors.text.disabled,
    },
});
