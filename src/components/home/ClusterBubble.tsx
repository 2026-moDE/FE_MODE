import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {NaverMapMarkerOverlay} from '@mj-studio/react-native-naver-map';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {fontSize, typography} from '../../constants/typography';

type Props = {
    latitude: number;
    longitude: number;
    count: number;
    thumbnailUrl?: string;
    // 썸네일이 디코딩까지 끝나서 안전하게 그릴 수 있는 상태인지 (프리로더 완료 여부)
    isReady?: boolean;
    onPress?: () => void;
};

const EMPTY_THUMBNAIL = require('../../assets/image/empty_minicard.png');

const BUBBLE_SIZE = 60;
const TAIL_HEIGHT = 16;
const TAIL_WIDTH = 12;
const TOTAL_HEIGHT = BUBBLE_SIZE + TAIL_HEIGHT;

const ClusterBubble = React.memo(function ClusterBubble({latitude, longitude, count, thumbnailUrl, isReady = true, onPress}: Props) {
    // 보여줄 썸네일이 있는데 아직 준비 안 됐으면, 빈 버블을 먼저 띄우지 않고 준비될 때까지 통째로 대기
    if (thumbnailUrl && !isReady) {
        return null;
    }

    return (
        <NaverMapMarkerOverlay
            latitude={latitude}
            longitude={longitude}
            width={BUBBLE_SIZE}
            height={TOTAL_HEIGHT}
            anchor={{x: 0.5, y: 1}}
            onTap={onPress}>
            {/* 마커 생김새가 바뀌면(사진 준비 여부/개수) key도 바뀌어야 네이티브 쪽이 새 마커로 인식함 - 라이브러리 문서 권장사항 */}
            <View key={`${thumbnailUrl ?? 'none'}-${isReady}-${count}`} collapsable={false} style={styles.container}>
                <View collapsable={false} style={styles.bubble}>
                    {thumbnailUrl ? (
                        <FastImage
                            source={{uri: thumbnailUrl, priority: FastImage.priority.high}}
                            style={styles.thumbnail}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                    ) : (
                        // 로컬 placeholder는 RN Image로 - 마커는 네이티브가 비트맵으로 굽는데
                        // FastImage로 넣으면 그려지기 전에 캡처돼서 버블 배경(회색)만 남음
                        <Image source={EMPTY_THUMBNAIL} style={styles.thumbnail} resizeMode="cover" />
                    )}
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
