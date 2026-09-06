import React, {useMemo, useRef} from 'react';
import {StyleSheet, View, Platform} from 'react-native';
import {NaverMapView, NaverMapViewProps, NaverMapViewRef, NaverMapMarkerOverlay} from '@mj-studio/react-native-naver-map';
import { INITIAL_CAMERA } from '../../constants/map';
import { useLocation } from '../../context/LocationContext';

type Props = Omit<NaverMapViewProps,'style'>&{
    ref?: React.Ref<NaverMapViewRef>;
    showCircle?: boolean;
    showLocationMarker?: boolean;
}

const MARKER_SIZE = 36;

// 컴포넌트 안에서 객체 리터럴로 넘기면 리렌더될 때마다 새 참조가 생겨서
// 네이티브 쪽이 값이 안 바뀌어도 매번 이미지를 다시 디코딩/적용함 - 이게 커스텀
// 이미지 적용 후 마커가 흔들려 보이던 원인이라 이미지/크기 같은 정적인 값만 모듈 밖에 고정 참조로 선언
// subAnchor.y를 0으로 두면 subImage 전체가 기준점(anchor) 아래로 그려져서
// 메인 마커(image)와 방향 화살표(subImage) 사이에 간격이 생김
// (subAnchor는 화살표 회전 축이기도 해서 0~1 정상 범위를 벗어나면 회전이 크게 튀어 보임 -
// 범위 밖 값(-5 등)을 넣었다가 화살표가 45도씩 튀는 문제가 생겨서 정상 범위로 되돌림)
const LOCATION_OVERLAY_BASE = {
    isVisible: true,
    // assetName은 네이티브 프로젝트(안드로이드 res/drawable, iOS 에셋 카탈로그)에 있는
    // 리소스를 가리키는 거라 RN 쪽 이미지(src/assets)는 못 찾음 - require()로 직접 불러와야 함
    image: require('../../assets/image/mapMarker.png'),
    imageWidth: 22,
    imageHeight: 22,
    anchor: {x: 0.5, y: 0.5},
    // 방향 화살표(subImage) 자체를 안 씀 - 커스텀 이미지는 회전이 제대로 안 됐고,
    // 나침반으로 직접 갱신하면 매번 이미지가 비동기로 재로드돼서 반응이 느렸음.
    // subImageWidth/Height를 0으로 줘도 SDK 기본 파란 화살표가 그대로 보여서,
    // 투명 1x1 이미지로 덮어써서 확실하게 안 보이게 함
    subImage: require('../../assets/image/transparent.png'),
    subImageWidth: 1,
    subImageHeight: 1,
    circleColor: 'rgba(255, 253, 109, 0.15)',
    circleOutlineWidth: 0,
    circleRadius: 30,
};

const MapView=({ref, children, showCircle = true, showLocationMarker = true, ...props}:Props)=>{
    const { location } = useLocation();

    // position을 안 넘기면 Follow 트래킹이 SDK 내부 GPS로 첫 위치를 잡을 때까지
    // 마커가 어디 있어야 할지 몰라서 시청 근처 잠깐 보였다가 이동
    // 마운트 시점의 위치를 고정으로 넣어서 그 틈을 메움 (이후 실시간 추적은 Follow)
    const initialLocationRef = useRef(location);

    const locationOverlay = useMemo(() => ({
        ...LOCATION_OVERLAY_BASE,
        position: initialLocationRef.current ?? undefined,
    }), []);

    return (
        <NaverMapView
            ref={ref}
            style={styles.map}
            initialCamera={INITIAL_CAMERA}
            isShowCompass={false}
            isShowScaleBar={false}
            isShowZoomControls={false}
            minZoom={5.5}
            isExtentBoundedInKorea={true}
            locationOverlay={locationOverlay}
            {...props}
        >
            {children}
        </NaverMapView>
    );
};

export default MapView;

const styles=StyleSheet.create({
    map:{flex:1},
    markerWrap:{
        width: MARKER_SIZE,
        height: MARKER_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulse:{
        position: 'absolute',
        width: MARKER_SIZE,
        height: MARKER_SIZE,
        borderRadius: MARKER_SIZE / 2,
        backgroundColor: 'rgba(66, 133, 244, 0.2)',
    },
    dot:{
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4285F4',
        borderWidth: 2.5,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3,
    },
});