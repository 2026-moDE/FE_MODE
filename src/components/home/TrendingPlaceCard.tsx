import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import IconLocationOutline from '../../assets/icons/IconLocationOutline';
import {RecommendedPlace} from '../../api/place';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {radius} from '../../constants/radius';
import {padding, gap} from '../../constants/spacing';

type Props = {
    place: RecommendedPlace;
    onPressMore?: (place: RecommendedPlace) => void;
};

const MAX_PHOTOS = 4;

export default function TrendingPlaceCard({place, onPressMore}: Props) {
    const photoUrl = place.thumbnail_small_url ?? place.thumbnail_url;
    const photos: (string | null)[] = photoUrl ? [photoUrl] : [];

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.placeNameGroup}>
                    <IconLocationOutline size={16} color={colors.icon.inverse} />
                    <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                </View>
                <Pressable
                    style={styles.moreButton}
                    onPress={() => onPressMore?.(place)}>
                    <Text style={styles.moreButtonText}>더 알아보기 →</Text>
                </Pressable>
            </View>

            <View style={styles.photoRow}>
                {Array.from({length: MAX_PHOTOS}, (_, index) => {
                    const photo = photos[index];
                    // 4장 미만이어도 4칸을 항상 확보해서 사진 크기가 커지지 않게 함 - 남는 칸은 빈 슬롯
                    if (!photo) return <View key={`empty-${index}`} style={styles.photoWrapper} />;
                    return (
                        <Pressable
                            key={index}
                            style={styles.photoWrapper}
                            onPress={() => onPressMore?.(place)}>
                            <FastImage
                                source={{uri: photo}}
                                style={styles.photo}
                                resizeMode={FastImage.resizeMode.cover}
                            />
                        </Pressable>
                    );
                })}
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface.subtleDarker,
        borderRadius: radius.xl,
        paddingHorizontal: padding.lg,     // 16
        paddingVertical: padding.sm,       // 10
        gap: gap.md,                       // 12
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.5,     // Alpha/Black/50
        shadowRadius: 20,       // Blur 20
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: gap.xs,
    },
    placeNameGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.xs,
    },
    placeName: {
        ...typography.c1,
        color: colors.text.inverse,
        flexShrink: 1,
    },
    photoRow: {
        flexDirection: 'row',
        gap: gap.sm,                       // 8
    },
    photoWrapper: {
        flex: 1,
        aspectRatio: 9 / 16,
    },
    photo: {
        width: '100%',
        height: '100%',
        borderRadius: radius.md,
        backgroundColor: colors.surface.muted,
    },
    moreButton: {
        backgroundColor: colors.surface.subtle,
        borderRadius: radius.full,
        paddingHorizontal: padding.sm,     // 10
        paddingVertical: padding.s,        // 8
    },
    moreButtonText: {
        ...typography.c3,
        color: colors.text.inverse,
    },
});
