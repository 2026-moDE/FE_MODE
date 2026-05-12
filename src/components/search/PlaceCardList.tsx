import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Place } from '../../types/place';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { radius } from '../../constants/radius';

type Props = {
    places: Place[];
    onSelect: (place: Place) => void;
};

export default function PlaceCardList({ places, onSelect }: Props) {

    if (places.length === 0) return null;

    return (
        <View>
            {places.map(place => (
                <TouchableOpacity
                    key={String(place.id)}
                    style={styles.card}
                    onPress={() => onSelect(place)}
                >
                    {/* 왼쪽: 카테고리 + 장소명 + 거리 + 주소 */}
                    <View style={styles.info}>

                        {/* 카테고리 칩 + 장소명 + 거리 */}
                        <View style={styles.row}>
                            <View style={styles.categoryChip}>
                                <Text style={styles.categoryText}>{place.category}</Text>
                            </View>
                            <Text style={styles.name}>{place.name}</Text>
                        </View>

                        {/* 주소 */}
                        <Text style={styles.address} numberOfLines={1}>{place.address}</Text>

                    </View>

                    {/* 오른쪽: 썸네일 이미지 */}
                    <Image
                        source={{ uri: place.thumbnail_url }}
                        style={styles.thumbnail}
                    />

                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,   // 16
        paddingVertical: spacing.md,     // 12
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
        minHeight: 80,
    },
    info: {
        flex: 1,
        gap: spacing.xs,                 // 4
        marginRight: spacing.md,         // 12
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,                 // 4
    },
    categoryChip: {
        backgroundColor: colors.surface.default,   // #F1F1F4
        borderRadius: radius.sm,                   // 4
        paddingHorizontal: spacing.xs,             // 4
        paddingVertical: 2,
    },
    categoryText: {
        ...typography.caption1,
        color: colors.text.tertiary,               // #5C5D68
    },
    name: {
        ...typography.b2,
        color: colors.text.basic,                  // #111114
    },
    address: {
        ...typography.b4,
        color: colors.text.tertiary,               // #5C5D68
    },
    thumbnail: {
        width: 64,
        height: 64,
        borderRadius: radius.md,                   // 8
        backgroundColor: colors.surface.default,   // 이미지 로딩 전 배경
    },
});
