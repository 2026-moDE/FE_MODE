import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Place } from '../../types/place';
import { Location } from '../../types/location';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { getDistance, formatDistance } from '../../utils/distance';

const locationPinIcon = require('../../assets/image/location.png');

type Props = {
    places: Place[];
    onSelect: (place: Place) => void;
    location?: Location | null;
};

export default function PlaceCardList({ places, onSelect, location }: Props) {

    if (places.length === 0) return null;

    return (
        <View>
            {places.map(place => {
                const distanceText = (location && place.latitude != null && place.longitude != null)
                    ? formatDistance(getDistance(location, { latitude: place.latitude, longitude: place.longitude }))
                    : null;

                return (
                    <TouchableOpacity
                        key={String(place.id)}
                        style={styles.card}
                        onPress={() => onSelect(place)}
                    >
                        {/* 위치 핀 아이콘 */}
                        <Image source={locationPinIcon} style={styles.pinIcon} resizeMode="contain" />

                        {/* 장소명 + 거리 + 주소 */}
                        <View style={styles.info}>

                            {/* 카테고리 칩 + 장소명 + 거리 */}
                            <View style={styles.row}>
                                {/* <View style={styles.categoryChip}>
                                    <Text style={styles.categoryText}>{place.category}</Text>
                                </View> */}
                                <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
                                {distanceText ? (
                                    <Text style={styles.distance}>{distanceText}</Text>
                                ) : null}
                            </View>

                            {/* 주소 */}
                            <Text style={styles.address} numberOfLines={1}>{place.address}</Text>

                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.lg,   // 16
        paddingVertical: spacing.md,     // 12
        gap: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    pinIcon: {
        width: 28,
        height: 34,
    },
    info: {
        flex: 1,
        gap: spacing.xs,                 // 4
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,                 // 4
    },
    categoryChip: {
        backgroundColor: colors.surface.default,   // #F1F1F4
        borderRadius: 4,
        paddingHorizontal: spacing.xs,             // 4
        paddingVertical: 2,
    },
    categoryText: {
        ...typography.c1,
        color: colors.text.tertiary,               // #5C5D68
    },
    name: {
        ...typography.b3,
        color: colors.text.basic,                  // #111114
        flexShrink: 1,
        includeFontPadding: false,                  // 안드로이드 폰트 상단 여백 제거 (아이콘 상단과 정렬)
    },
    distance: {
        ...typography.b6,
        color: colors.text.brandDarker,
        flexShrink: 0,
    },
    address: {
        ...typography.b6,
        color: colors.text.tertiary,               // #5C5D68
    },
});
