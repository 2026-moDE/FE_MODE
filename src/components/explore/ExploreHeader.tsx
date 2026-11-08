import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {gap, padding} from '../../constants/spacing';
import IconChevronDown from '../../assets/icons/IconChevronDown';

type Props = {
    onPressPlace?: () => void;
};

export default function ExploreHeader({onPressPlace}: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.wrapper, {paddingTop: insets.top + padding.sm}]}>
            <Pressable style={styles.titleRow} onPress={onPressPlace} hitSlop={8}>
                <Text style={styles.title}>지금 내 근처에서는</Text>
                <IconChevronDown size={18} color={colors.text.inverse} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: padding['3xl'],
        paddingBottom: padding.sm,
        gap: gap.md,
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
});
