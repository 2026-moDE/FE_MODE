import React from 'react';
import {StyleSheet} from 'react-native';
import {NaverMapView, NaverMapViewProps, NaverMapViewRef} from '@mj-studio/react-native-naver-map';
import { INITIAL_CAMERA } from '../../constants/map';

type Props = Omit<NaverMapViewProps,'style'>&{
    ref?: React.Ref<NaverMapViewRef>;
}

const MapView=({ref, ...props}:Props)=>{
    return (
        <NaverMapView
            ref={ref}
            style={styles.map}
            initialCamera={INITIAL_CAMERA}
            isShowCompass={false}
            isShowScaleBar={false}
            {...props}
        />
    );
};

export default MapView;

const styles=StyleSheet.create({
    map:{flex:1},
});