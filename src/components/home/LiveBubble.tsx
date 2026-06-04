import React from 'react';
import {View, Image, StyleSheet} from 'react-native';
import {NaverMapMarkerOverlay} from '@mj-studio/react-native-naver-map';
import {NearbyPlace, CongestionLevel} from '../../types/place';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';

// 혼잡도별 테두리 색 매핑
const CONGESTION_COLORS: Record<CongestionLevel, string> = {
    LOW:    '#84E588',   // 여유
    MEDIUM: '#FFD75E',   // 보통
    HIGH:   '#FF685D',   // 혼잡
};

type Props = {
    place: NearbyPlace;
    onPress: (place: NearbyPlace) => void;
};

const BUBBLE_SIZE = 60;
const TAIL_HEIGHT = 16;
const TAIL_WIDTH = 12;
const TOTAL_HEIGHT = BUBBLE_SIZE + TAIL_HEIGHT;

export default function LiveBubble({place, onPress}: Props) {
    const borderColor = (place.congestion_level ? CONGESTION_COLORS[place.congestion_level] : undefined) ?? '#84E588';

    return (
        <NaverMapMarkerOverlay
            latitude={place.latitude}
            longitude={place.longitude}
            width={BUBBLE_SIZE}
            height={TOTAL_HEIGHT}
            anchor={{x: 0.5, y: 1}}
            onTap={() => onPress(place)}>
            <View collapsable={false} style={styles.container}>
                <View collapsable={false} style={[styles.bubble, {borderColor}]}>
                    {place.thumbnail_url ? (
                        <Image
                            source={{uri: place.thumbnail_url}}
                            style={styles.thumbnail}
                            resizeMode="cover"
                            resizeMethod="resize"
                        />
                    ) : null}
                </View>
                <View style={[styles.tail, {borderTopColor: borderColor}]} />
            </View>
        </NaverMapMarkerOverlay>
    );
}

const styles = StyleSheet.create({
    container: {
        width: BUBBLE_SIZE,
        height: TOTAL_HEIGHT,
        alignItems: 'center',
    },
    bubble: {
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        borderRadius: radius.md,
        borderWidth: 2,
        borderColor: colors.surface.white,
        backgroundColor: colors.surface.muted,
        overflow: 'hidden',
    },
    thumbnail: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    tail: {
        width: 0,
        height: 0,
        borderLeftWidth: TAIL_WIDTH / 2,
        borderRightWidth: TAIL_WIDTH / 2,
        borderTopWidth: TAIL_HEIGHT,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: colors.surface.white,
        marginTop: -1,
    },
});
