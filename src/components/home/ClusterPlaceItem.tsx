import React from 'react';
import {View, Text, Image, Pressable, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {NearbyPlace} from '../../types/place';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {radius} from '../../constants/radius';
import {gap} from '../../constants/spacing';

const EMPTY_THUMBNAIL = require('../../assets/image/empty_minicard.png');

type Props = {
    place: NearbyPlace;
    onPress?: (place: NearbyPlace) => void;
};

// 클러스터 버블 클릭 시 뜨는 바텀시트의 장소 목록 행 (썸네일 + 가게명 + 주소)
export default function ClusterPlaceItem({place, onPress}: Props) {
    const thumbnailUrl = place.thumbnail_small_url ?? place.thumbnail_url;
    return (
        <Pressable style={styles.row} onPress={() => onPress?.(place)}>
            {thumbnailUrl ? (
                <FastImage
                    source={{uri: thumbnailUrl}}
                    style={styles.thumbnail}
                    resizeMode={FastImage.resizeMode.cover}
                />
            ) : (
                <Image source={EMPTY_THUMBNAIL} style={styles.thumbnail} resizeMode="cover" />
            )}
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                    {place.name}
                </Text>
                {place.address && (
                    <Text style={styles.address} numberOfLines={1}>
                        {place.address}
                    </Text>
                )}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.sm,           // 8
    },
    thumbnail: {
        width: 78,
        height: 78,
        borderRadius: radius.lg,   // 12
        backgroundColor: colors.surface.muted,
    },
    info: {
        flex: 1,
    },
    name: {
        ...typography.b5,
        color: colors.text.inverse,
    },
    address: {
        ...typography.c2,
        color: colors.text.subtle,
    },
});
