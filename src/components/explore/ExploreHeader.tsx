import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {gap, padding} from '../../constants/spacing';
import IconChevronDown from '../../assets/icons/IconChevronDown';

type Props = {
    placeName: string;
    radiusKm: number;
    onPressPlace?: () => void;
};

export default function ExploreHeader({placeName, radiusKm, onPressPlace}: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.wrapper, {paddingTop: insets.top + padding.sm}]}>
            <Pressable style={styles.titleRow} onPress={onPressPlace} hitSlop={8}>
                <Text style={styles.title}>{placeName}</Text>
                <IconChevronDown size={18} color={colors.text.inverse} />
            </Pressable>
            <Text style={styles.subtitle}>기준 {radiusKm.toFixed(1)}km 범위 내 리뷰</Text>
        </View>
    );

}

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: padding.xl,
        paddingBottom: padding.md,
        gap: gap.xs,
        alignItems: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.xs,
    },
    title: {
        ...typography.b1,
        color: colors.text.inverse,
    },
    subtitle: {
        ...typography.b5,
        color: colors.brand.primary,
    },
});
