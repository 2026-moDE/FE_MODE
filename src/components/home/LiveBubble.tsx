import React from 'react';
import {View, Image, StyleSheet} from 'react-native';
import {NaverMapMarkerOverlay} from '@mj-studio/react-native-naver-map';
import {NearbyPlace} from '../../types/place';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';

type Props = {
    place: NearbyPlace;
    onPress: (place: NearbyPlace) => void;
};

// 라이브 버블 사이즈 (수정 가능)
const BUBBLE_SIZE = 60;
const TAIL_HEIGHT = 16; // 살짝 길게
const TAIL_WIDTH = 12;  // 살짝 얇게 (좌우 합쳐서 12 → 6+6)

// 전체 마커 높이 = 버블 + 꼬리
const TOTAL_HEIGHT = BUBBLE_SIZE + TAIL_HEIGHT;

export default function LiveBubble({place, onPress}: Props) {
    return (
        <NaverMapMarkerOverlay
            latitude={place.latitude}
            longitude={place.longitude}
            width={BUBBLE_SIZE}
            height={TOTAL_HEIGHT}
            anchor={{x: 0.5, y: 1}}    // 마커 하단 중앙(=꼬리 끝)이 좌표에 위치
            onTap={() => onPress(place)}>
            <View // 캐싱X -> 성능 이슈가 생길 수도
                key={place.thumbnail_url}    // 이미지 바뀌면 다시 렌더링
                collapsable={false} // 이 방식에선 필수로 false 설정
                style={styles.container}>
                {/* 버블 (이미지) */}
                <View style={styles.bubble}>
                    <Image
                        source={{uri: place.thumbnail_url}}
                        style={styles.thumbnail}
                    />
                </View>

                {/* 꼬리 (아래로 향하는 삼각형) */}
                <View style={styles.tail} />
            </View>
        </NaverMapMarkerOverlay>
    );
}

const styles = StyleSheet.create({
    container: {
        width: BUBBLE_SIZE,
        height: TOTAL_HEIGHT,
        alignItems: 'center',          // 가로 가운데 정렬 (꼬리가 중앙에)
    },
    bubble: {
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        borderRadius: radius.md,        // 살짝 둥근 사각형 (8px)
        borderWidth: 2,
        borderColor: colors.surface.white,
        overflow: 'hidden',             // 이미지가 borderRadius 따라 잘림
        backgroundColor: colors.surface.muted,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    // 꼬리: border 트릭으로 아래로 향하는 삼각형
    tail: {
        width: 0,
        height: 0,
        borderLeftWidth: TAIL_WIDTH / 2,    // 8
        borderRightWidth: TAIL_WIDTH / 2,   // 8
        borderTopWidth: TAIL_HEIGHT,        // 12
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: colors.surface.white,
        marginTop: -1,                       // 버블 테두리와 살짝 겹쳐서 자연스럽게
    },
});
