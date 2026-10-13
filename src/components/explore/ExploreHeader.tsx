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
                <Text style={styles.title}>탐색</Text>
                {/* <IconChevronDown size={18} color={colors.text.inverse} /> */}
            </Pressable>
            {/* <Text style={styles.subtitle}>주변 리뷰</Text> */}
        </View>
    );

}

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: padding.lg,
        paddingBottom: padding.sm,
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
