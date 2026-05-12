import { useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

// 위치 권한 요청 훅
export function useLocationPermission() {

    const requestPermission = useCallback(async () => {
        if (Platform.OS === 'android') {
            await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
        } else {
            Geolocation.requestAuthorization();
        }
    }, []);

    return { requestPermission };
}
