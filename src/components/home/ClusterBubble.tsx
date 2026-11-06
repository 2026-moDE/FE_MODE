import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {NaverMapMarkerOverlay} from '@mj-studio/react-native-naver-map';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {fontSize, typography} from '../../constants/typography';
import {
    BUBBLE_SIZE,
    TAIL_HEIGHT,
    TAIL_WIDTH,
    TOTAL_HEIGHT,
    MARKER_PAD,
    MARKER_WIDTH,
    MARKER_HEIGHT,
    MARKER_ANCHOR,
} from './bubbleShadow';

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

const ClusterBubble = React.memo(function ClusterBubble({latitude, longitude, count, thumbnailUrl, isReady = true, onPress}: Props) {
    // 로컬 placeholder(Image)도 iOS에서는 마커 스냅샷이 찍히는 시점보다 실제 페인트가 늦어서
    // 버블 배경색(회색)만 캡처될 수 있음 - 로드 완료 후 key를 바꿔서 다시 스냅샷 찍게 함
    // (early return보다 먼저 선언해야 훅 규칙 위반이 안 됨)
    const [placeholderReady, setPlaceholderReady] = React.useState(false);
    // 네트워크 썸네일도 같은 문제가 있음 - 캐시에 있어도 첫 스냅샷보다 페인트가 늦으면
    // 회색 배경만 찍힌 채로 굳어버림. 실제로 그려진 뒤 key를 바꿔 다시 찍게 함
    const [thumbnailPainted, setThumbnailPainted] = React.useState(false);

    const [rebakeTick, setRebakeTick] = React.useState(0);

    // 그릴 이미지가 바뀌면 처음부터 다시 판단
    React.useEffect(() => {
        setThumbnailPainted(false);
        setRebakeTick(0);
    }, [thumbnailUrl, isReady]);

    // 사진이 최종적으로 다 그려졌는지 (사진이면 FastImage, 없으면 빈 카드 기준).
    // rebakeTick 폴백 타이머를 멈출지 판단하는 용도 - 바닥 기본 이미지가 그려진 것만으론 "완료"가 아니다
    const painted = thumbnailUrl ? thumbnailPainted : placeholderReady;

    // onLoad가 실제 페인트 시점과 안 맞는 경우에만 다시 굽게 함 -
    // 정상적으로 그려진 버블까지 다시 구우면 지도가 깜빡임
    const MAX_REBAKE = 2;
    React.useEffect(() => {
        if (painted || rebakeTick >= MAX_REBAKE) return;
        const timer = setTimeout(() => setRebakeTick(t => t + 1), 250);
        return () => clearTimeout(timer);
    }, [painted, rebakeTick]);

    // 보여줄 썸네일이 있는데 아직 준비 안 됐으면, 빈 버블을 먼저 띄우지 않고 준비될 때까지 통째로 대기
    if (thumbnailUrl && !isReady) {
        return null;
    }

    return (
        <NaverMapMarkerOverlay
            latitude={latitude}
            longitude={longitude}
            width={MARKER_WIDTH}
            height={MARKER_HEIGHT}
            anchor={MARKER_ANCHOR}
            onTap={onPress}>
            {/* 마커 생김새가 바뀌면(사진 준비 여부/개수/placeholder 로드 여부) key도 바뀌어야
                네이티브 쪽이 새 마커로 인식함 - 라이브러리 문서 권장사항 */}
            <View key={`${thumbnailUrl ?? 'none'}-${isReady}-${count}-${placeholderReady}-${thumbnailPainted}-${rebakeTick}`} collapsable={false} style={styles.root}>
                {/* 묶음 버블은 테두리가 항상 흰색 - 흰 그림자는 지도에서 안 보여서 아예 안 넣는다.
                    여백(MARKER_PAD)은 장소 버블과 크기/위치를 똑같이 유지하려고 그대로 둔다 */}
                <View collapsable={false} style={styles.container}>
                    <View collapsable={false} style={styles.bubble}>
                        {/* 기본 이미지를 항상 바닥에 깔아둔다 - 사진이 아직 안 그려진 첫 스냅샷에
                            버블 배경색(회색)이 찍히는 걸 막는 용도. 사진이 있으면 바로 위 FastImage가 덮는다.
                            로컬 에셋은 RN Image로 - FastImage로 넣으면 그려지기 전에 캡처돼서 회색만 남음 */}
                        <Image
                            source={EMPTY_THUMBNAIL}
                            style={styles.thumbnail}
                            resizeMode="cover"
                            onLoad={() => setPlaceholderReady(true)}
                        />
                        {thumbnailUrl && (
                            <FastImage
                                source={{uri: thumbnailUrl, priority: FastImage.priority.high}}
                                style={styles.thumbnail}
                                resizeMode={FastImage.resizeMode.cover}
                                onLoad={() => setThumbnailPainted(true)}
                            />
                        )}
                        {/* 숫자 오버레이 */}
                        <View style={styles.overlay}>
                            <Text style={styles.count}>{count}</Text>
                        </View>
                    </View>
                    <View style={styles.tail} />
                </View>
            </View>
        </NaverMapMarkerOverlay>
    );
});

export default ClusterBubble;

const styles = StyleSheet.create({
    // 그림자 여백까지 포함한 마커 전체 - 크기가 마커에 선언한 width/height와 같아야 비트맵이 안 잘린다
    root: {
        width: MARKER_WIDTH,
        height: MARKER_HEIGHT,
    },
    container: {
        position: 'absolute',
        top: MARKER_PAD,
        left: MARKER_PAD,
        width: BUBBLE_SIZE,
        height: TOTAL_HEIGHT,
        alignItems: 'center',
    },
    bubble: {
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        borderRadius: radius.md,
        borderWidth: 2,
        // 묶음 버블은 혼잡도 색이 하나로 정해지지 않아 항상 색 없는 쪽 기본값을 쓴다
        borderColor: colors.border.inverse,
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
        borderTopColor: colors.border.inverse,
        marginTop: -1,
    },
});
