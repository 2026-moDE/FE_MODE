import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import FastImage from 'react-native-fast-image';
import {NaverMapMarkerOverlay} from '@mj-studio/react-native-naver-map';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {fontSize, typography} from '../../constants/typography';

type Props = {
    latitude: number;
    longitude: number;
    count: number;
    thumbnailUrl?: string;
    onPress?: () => void;
};

const BUBBLE_SIZE = 60;
const TAIL_HEIGHT = 16;
const TAIL_WIDTH = 12;
const TOTAL_HEIGHT = BUBBLE_SIZE + TAIL_HEIGHT;

const ClusterBubble = React.memo(function ClusterBubble({latitude, longitude, count, thumbnailUrl, onPress}: Props) {
    return (
        <NaverMapMarkerOverlay
            latitude={latitude}
            longitude={longitude}
            width={BUBBLE_SIZE}
            height={TOTAL_HEIGHT}
            anchor={{x: 0.5, y: 1}}
            onTap={onPress}>
            <View collapsable={false} style={styles.container}>
                <View collapsable={false} style={styles.bubble}>
                    {thumbnailUrl ? (
                        <FastImage
                            source={{uri: thumbnailUrl, priority: FastImage.priority.high}}
                            style={styles.thumbnail}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                    ) : null}
                    {/* 숫자 오버레이 */}
                    <View style={styles.overlay}>
                        <Text style={styles.count}>{count}</Text>
                    </View>
                </View>
                <View style={styles.tail} />
            </View>
        </NaverMapMarkerOverlay>
    );
});

export default ClusterBubble;

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
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    count: {
        ...typography.h2,
        fontSize: fontSize.b2,
        color: colors.surface.white,
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
