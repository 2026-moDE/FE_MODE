import React, {useMemo} from 'react';
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
// require()로 넘긴 RN 에셋은 iOS에서 적용되지 않음.
// 라이브러리가 RN 에셋을 [RCTBridge currentBridge]로 얻은 RCTImageLoader로 비동기 로딩하는데
// (ImageUtil.h), 이 앱은 신아키텍처(브리지리스)라 currentBridge가 nil이라서 이미지 로더도 nil이 됨.
// 그러면 loadImageWithURLRequest:가 완료 콜백을 아예 안 불러서 아이콘이 설정되지 않고
// SDK 기본 파란 점이 그대로 남음 (에러가 아니라 무반응이라 폴백인 초록 마커도 안 뜸).
// 원/크기/앵커는 동기로 적용돼서 노란 원만 정상으로 보였던 게 이 때문.
//
// assetName 경로는 [NMFOverlayImage overlayImageWithName:]로 동기 처리돼 브리지를 안 타므로
// iOS만 에셋 카탈로그(ios/moing/Images.xcassets)를 쓰게 함. 안드로이드는 require()로 정상 동작.
// → 이미지를 교체할 땐 src/assets/image 와 Images.xcassets 양쪽을 같이 갱신해야 함
const LOCATION_MARKER_IMAGE = Platform.OS === 'ios'
    ? {assetName: 'mapMarker'}
    : require('../../assets/image/mapMarker.png');

const LOCATION_MARKER_SUB_IMAGE = Platform.OS === 'ios'
    ? {assetName: 'transparent'}
    : require('../../assets/image/transparent.png');

const LOCATION_OVERLAY_BASE = {
    isVisible: true,
    image: LOCATION_MARKER_IMAGE,
    imageWidth: 22,
    imageHeight: 22,
    anchor: {x: 0.5, y: 0.5},
    // 방향 화살표(subImage) 자체를 안 씀 - 커스텀 이미지는 회전이 제대로 안 됐고,
    // 나침반으로 직접 갱신하면 매번 이미지가 비동기로 재로드돼서 반응이 느렸음.
    // subImageWidth/Height를 0으로 줘도 SDK 기본 파란 화살표가 그대로 보여서,
    // 투명 1x1 이미지로 덮어써서 확실하게 안 보이게 함
    subImage: LOCATION_MARKER_SUB_IMAGE,
    subImageWidth: 1,
    subImageHeight: 1,
    circleColor: 'rgba(255, 253, 109, 0.15)',
    circleOutlineWidth: 0,
    circleRadius: 30,
};

const MapView=({ref, children, showCircle = true, showLocationMarker = true, ...props}:Props)=>{
    const { location } = useLocation();

    // position을 안 넘기면 SDK가 내부 GPS로 첫 위치를 잡을 때까지 마커가 어디 있어야
    // 할지 몰라서 시청 근처에 잠깐 보였다가 이동함 - 그래서 항상 앱이 들고 있는 위치를 넘김
    //
    // 예전엔 마운트 시점 위치로 고정하고 실시간 추적은 SDK Follow에 맡겼는데, iOS는
    // positionMode를 켜는 순간 SDK가 locationOverlay 아이콘을 자기 기본값으로 덮어써서
    // (내부적으로 setLocationOverlayWithImageName:isHidden: 호출) 커스텀 마커가 사라졌음.
    // 그래서 iOS에선 Follow를 안 쓰고(HomeScreen 참고) 여기서 실시간 위치를 직접 먹여 마커를 움직임.
    // 안드로이드는 SDK가 FusedLocationSource로 직접 추적하니 이 값은 초기 위치 역할만 함.
    //
    // location만 바뀌고 image/크기 같은 정적 값은 모듈 밖 고정 참조라, 네이티브 diff에서
    // 이미지가 같다고 판단돼 재디코딩은 일어나지 않음
    const locationOverlay = useMemo(() => ({
        ...LOCATION_OVERLAY_BASE,
        position: location ?? undefined,
    }), [location]);

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