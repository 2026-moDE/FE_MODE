import React from 'react';
import {StyleSheet} from 'react-native';
import {NaverMapView, NaverMapViewProps, NaverMapViewRef, NaverMapCircleOverlay} from '@mj-studio/react-native-naver-map';
import { INITIAL_CAMERA } from '../../constants/map';
import { useLocation } from '../../context/LocationContext';

type Props = Omit<NaverMapViewProps,'style'>&{
    ref?: React.Ref<NaverMapViewRef>;
}

const MapView=({ref, children, ...props}:Props)=>{
    const { location } = useLocation();

    return (
        <NaverMapView
            ref={ref}
            style={styles.map}
            initialCamera={INITIAL_CAMERA}
            isShowCompass={false}
            isShowScaleBar={false}
            isShowZoomControls={false}
            {...props}
        >
            {children}
            {location && (
                <NaverMapCircleOverlay
                    latitude={location.latitude}
                    longitude={location.longitude}
                    radius={500}
                    color="rgba(131, 166, 255, 0.2)"
                    outlineColor="rgba(131, 166, 255, 0.5)"
                    outlineWidth={1}
                />
            )}
        </NaverMapView>
    );
};

export default MapView;

const styles=StyleSheet.create({
    map:{flex:1},
});