import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import FastImage from 'react-native-fast-image';
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
    onPress: (placeId: number, placeName: string) => void;
};

export default function SubscriptionCard({place, onToggle, onPress}: Props) {
    const {place: {id: placeId, name, address, thumbnail_url}, is_active} = place;

    return (
        <Pressable style={styles.container} onPress={() => onPress(placeId, name)}>
            {thumbnail_url ? (
                <FastImage
                    source={{uri: thumbnail_url, priority: FastImage.priority.normal}}
                    style={styles.thumbnail}
                    resizeMode={FastImage.resizeMode.cover}
                />
            ) : (
                <View style={[styles.thumbnail, styles.thumbnailFallback]} />
            )}
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                <Text style={styles.address} numberOfLines={1}>{address}</Text>
            </View>
            <Pressable hitSlop={12} onPress={() => onToggle(placeId, is_active)}>
                {is_active
                    ? <IconBellOn color={colors.icon.basic} />
                    : <IconBellOff color={colors.icon.tertiary} />}
            </Pressable>
        </Pressable>
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
