import React from 'react';
import {View, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {NaverMapMarkerOverlay} from '@mj-studio/react-native-naver-map';
import {NearbyPlace, CongestionLevel} from '../../types/place';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';

// 혼잡도별 테두리 색 매핑
const CONGESTION_COLORS: Partial<Record<CongestionLevel, string>> = {
    LOW:      '#84E588',   // 여유
    MODERATE: '#FFD75E',   // 보통
    MEDIUM:   '#FFD75E',   // 보통 (별칭)
    CROWDED:  '#FF685D',   // 혼잡
    HIGH:     '#FF685D',   // 혼잡 (별칭)
};

type Props = {
    place: NearbyPlace;
    onPress: (place: NearbyPlace) => void;
    // true면 혼잡도 색상 없이 항상 흰색으로 표시 (마이페이지 마이맵용)
    monochrome?: boolean;
    // 썸네일이 디코딩까지 끝나서 안전하게 그릴 수 있는 상태인지 (프리로더 완료 여부)
    isReady?: boolean;
};

const EMPTY_THUMBNAIL = require('../../assets/image/empty_minicard.png');

const BUBBLE_SIZE = 60;
const TAIL_HEIGHT = 16;
const TAIL_WIDTH = 12;
const TOTAL_HEIGHT = BUBBLE_SIZE + TAIL_HEIGHT;

const LiveBubble = React.memo(function LiveBubble({place, onPress, monochrome, isReady = true}: Props) {
    // 보여줄 썸네일이 있는데 아직 준비 안 됐으면, 빈 버블을 먼저 띄우지 않고 준비될 때까지 통째로 대기
    const hasThumbnail = !!place.thumbnail_url && place.thumbnail_url.length > 0;
    if (hasThumbnail && !isReady) {
        return null;
    }

    // 혼잡도 있으면 색상, 없으면 null
    const congestionColor =
        !monochrome && place.congestion_level
            ? CONGESTION_COLORS[place.congestion_level]
            : null;

    return (
        <NaverMapMarkerOverlay
            latitude={place.latitude}
            longitude={place.longitude}
            width={BUBBLE_SIZE}
            height={TOTAL_HEIGHT}
            anchor={{x: 0.5, y: 1}}
            onTap={() => onPress(place)}>
            {/* 마커 생김새가 바뀌면(사진 준비 여부/혼잡도 색) key도 바뀌어야 네이티브 쪽이 새 마커로 인식함 - 라이브러리 문서 권장사항 */}
            <View key={`${congestionColor ?? 'none'}-${isReady}-${hasThumbnail}`} collapsable={false} style={styles.container}>
                <View
                    collapsable={false}
                    style={[
                        styles.bubble,
                        {borderColor: congestionColor ?? colors.surface.white},
                    ]}>
                    {hasThumbnail ? (
                        <FastImage
                            source={{
                                uri: place.thumbnail_small_url ?? place.thumbnail_url,
                                priority: FastImage.priority.high,
                                cache: FastImage.cacheControl.immutable,
                            }}
                            style={styles.thumbnail}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                    ) : (
                        <FastImage source={EMPTY_THUMBNAIL} style={styles.thumbnail} resizeMode={FastImage.resizeMode.cover} />
                    )}
                </View>
                {/* 꼬리: 혼잡도 있으면 같은 색, 없으면 흰색 */}
                <View
                    style={[
                        styles.tail,
                        {borderTopColor: congestionColor ?? colors.surface.white},
                    ]}
                />
            </View>
        </NaverMapMarkerOverlay>
    );
});

export default LiveBubble;

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
