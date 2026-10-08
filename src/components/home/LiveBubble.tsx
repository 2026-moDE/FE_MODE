import React from 'react';
import {View, Image, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {NaverMapMarkerOverlay} from '@mj-studio/react-native-naver-map';
import {
    NearbyPlace,
    CONGESTION_COLOR,
} from '../../types/place';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';

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
    // 로컬 placeholder(Image)도 iOS에서는 마커 스냅샷이 찍히는 시점보다 실제 페인트가 늦어서
    // 버블 배경색(회색)만 캡처될 수 있음 - 로드 완료 후 key를 바꿔서 다시 스냅샷 찍게 함
    // (early return보다 먼저 선언해야 훅 규칙 위반이 안 됨)
    const [placeholderReady, setPlaceholderReady] = React.useState(false);
    // 네트워크 썸네일도 같은 문제가 있음 - 프리로더로 캐시에 올려놔도 첫 스냅샷보다 페인트가
    // 늦으면 회색 배경만 찍힌 채로 굳어버림. 실제로 그려진 뒤 key를 바꿔 다시 찍게 함
    const [thumbnailPainted, setThumbnailPainted] = React.useState(false);

    // 마커에 실제로 그리는 URL - HomeScreen의 프리로더/readyUrls와 우선순위가 같아야
    // "준비됨" 판정과 실제 그리는 이미지가 어긋나지 않음
    // (예전엔 thumbnail_url만 보고 판단해서, small만 있고 원본이 비면 사진 대신 빈 카드가 떴음)
    const bubbleUrl = place.thumbnail_small_url ?? place.thumbnail_url;
    const hasThumbnail = !!bubbleUrl && bubbleUrl.length > 0;

    const [rebakeTick, setRebakeTick] = React.useState(0);

    // 그릴 이미지가 바뀌면 처음부터 다시 판단
    React.useEffect(() => {
        setThumbnailPainted(false);
        setRebakeTick(0);
    }, [bubbleUrl, isReady]);

    // 이미지가 실제로 그려졌다고 보고가 왔는지 (사진이면 FastImage, 없으면 빈 카드 기준)
    const painted = hasThumbnail ? thumbnailPainted : placeholderReady;

    // onLoad만으로는 네이티브가 마커를 비트맵으로 굽는 시점을 못 맞추는 경우가 있음
    // (iOS에서 onLoad가 실제 페인트보다 먼저 오거나, 마커 자식은 화면 밖에서 그려져서 안 오기도 함).
    // 그때만 key를 바꿔 다시 굽게 함 - 정상적으로 그려진 버블까지 다시 구우면 지도가 깜빡임
    const MAX_REBAKE = 2;
    React.useEffect(() => {
        if (painted || rebakeTick >= MAX_REBAKE) return;
        const timer = setTimeout(() => setRebakeTick(t => t + 1), 250);
        return () => clearTimeout(timer);
    }, [painted, rebakeTick]);

    // 보여줄 썸네일이 있는데 아직 준비 안 됐으면, 빈 버블을 먼저 띄우지 않고 준비될 때까지 통째로 대기
    if (hasThumbnail && !isReady) {
        return null;
    }

    // 혼잡도 있으면 그 단계의 색, 없으면 null (없을 때 색은 아래 기본값 border-strong)
    // 응답에 색은 없어서 혼잡도 레벨로 매핑
    const congestionColor =
        !monochrome && place.congestion_level
            ? CONGESTION_COLOR[place.congestion_level].stroke
            : null;

    return (
        <NaverMapMarkerOverlay
            latitude={place.latitude}
            longitude={place.longitude}
            width={BUBBLE_SIZE}
            height={TOTAL_HEIGHT}
            anchor={{x: 0.5, y: 1}}
            onTap={() => onPress(place)}>
            {/* 마커 생김새가 바뀌면(사진 준비 여부/혼잡도 색/placeholder 로드 여부) key도 바뀌어야
                네이티브 쪽이 새 마커로 인식함 - 라이브러리 문서 권장사항 */}
            <View key={`${congestionColor ?? 'none'}-${isReady}-${hasThumbnail}-${placeholderReady}-${thumbnailPainted}-${rebakeTick}`} collapsable={false} style={styles.container}>
                <View
                    collapsable={false}
                    style={[
                        styles.bubble,
                        {borderColor: congestionColor ?? colors.border.strong},
                    ]}>
                    {hasThumbnail ? (
                        <FastImage
                            source={{
                                uri: bubbleUrl,
                                priority: FastImage.priority.high,
                                cache: FastImage.cacheControl.immutable,
                            }}
                            style={styles.thumbnail}
                            resizeMode={FastImage.resizeMode.cover}
                            onLoad={() => setThumbnailPainted(true)}
                        />
                    ) : (
                        // 로컬 placeholder는 RN Image로 - 마커는 네이티브가 비트맵으로 굽는데
                        // FastImage로 넣으면 그려지기 전에 캡처돼서 버블 배경(회색)만 남음.
                        // iOS는 로컬 이미지도 로드가 한 프레임 늦어서 첫 스냅샷엔 회색만 잡힐 수 있어,
                        // onLoad 이후 key를 바꿔 다시 스냅샷 찍게 함
                        <Image
                            source={EMPTY_THUMBNAIL}
                            style={styles.thumbnail}
                            resizeMode="cover"
                            onLoad={() => setPlaceholderReady(true)}
                        />
                    )}
                </View>
                {/* 꼬리: 버블 테두리와 항상 같은 색 */}
                <View
                    style={[
                        styles.tail,
                        {borderTopColor: congestionColor ?? colors.border.strong},
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
        // 혼잡도 색이 있으면 위에서 덮어씀 - 여긴 색이 없을 때의 기본값
        borderColor: colors.border.strong,
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
        borderTopColor: colors.border.strong,
        marginTop: -1,
    },
});
