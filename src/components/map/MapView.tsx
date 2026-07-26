import React from 'react';
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

const MapView=({ref, children, showCircle = true, showLocationMarker = true, ...props}:Props)=>{
    const { location } = useLocation();

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
            // 기존 locationOverlay을 prop로 안 넘겨서 마커 움직이는 오류 발생했을 확률이 있음
            // mj-studio/react-native-naver-map가 네이티브 기능 가지는데, prop로 안 넘기면서 rn에서 오류 생겼던 듯
            locationOverlay={{isVisible: false} }
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