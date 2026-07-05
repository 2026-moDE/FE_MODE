import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {typography} from '../../constants/typography';
import {radius} from '../../constants/radius';
import {Subscription} from '../../types/notifications';
import IconBellOn from '../../assets/icons/IconBellOn';
import IconBellOff from '../../assets/icons/IconBellOff';

type Props = {
    place: Subscription;
    onToggle: (id: number, current: boolean) => void;
};

export default function SubscriptionCard({place, onToggle}: Props) {
    const {id, place: {name, address}, is_active} = place;

    return (
        <View style={styles.container}>
            <View style={[styles.thumbnail, styles.thumbnailFallback]} />
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                <Text style={styles.address} numberOfLines={1}>{address}</Text>
            </View>
            <Pressable hitSlop={12} onPress={() => onToggle(id, is_active)}>
                {is_active
                    ? <IconBellOn color={colors.icon.basic} />
                    : <IconBellOff color={colors.icon.tertiary} />}
            </Pressable>
        </View>
    );
}

const THUMBNAIL_SIZE = 68;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface.white,
    },
    thumbnail: {
        width: THUMBNAIL_SIZE,
        height: THUMBNAIL_SIZE,
        borderRadius: radius.sm,
        backgroundColor: colors.surface.muted,
    },
    thumbnailFallback: {
        backgroundColor: colors.surface.muted,
    },
    info: {
        flex: 1,
        gap: spacing.xs,
    },
    name: {
        ...typography.b1,
        color: colors.text.basic,
    },
    address: {
        ...typography.b4,
        color: colors.text.tertiary,
    },
});
