import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import TrendingPlaceCard from './TrendingPlaceCard';
import {RecommendedPlace} from '../../api/place';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';

type Props = {
    places: RecommendedPlace[];
    message?: string;
    onPressMore?: (place: RecommendedPlace) => void;
};

export default function TrendingPlacesSection({places, message, onPressMore}: Props) {
    if (places.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{message ?? '추천 장소'}</Text>
            <View style={styles.list}>
                {places.map((place, index) => (
                    <View key={place.id} style={index > 0 && styles.gap}>
                        <TrendingPlaceCard
                            place={place}
                            onPressMore={onPressMore}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.lg,
    },
    title: {
        ...typography.b3,
        color: colors.text.inverse,
        marginBottom: spacing.lg,      // 16 - 제목 ↔ 목록 첫 카드
    },
    list: {},
    gap: {
        marginTop: radius.sm,
    },
});
