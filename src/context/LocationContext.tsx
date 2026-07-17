/**
 * 현위치 전역 관리 Context
 *
 * 앱 실행 동안 GPS로 사용자 위치를 실시간 추적(watchPosition)하고,
 * 어느 화면에서든 useLocation()으로 꺼내 쓸 수 있게 전역으로 공유한다.
 *
 * 사용 예시:
 *   const {location} = useLocation();
 *   → {latitude: 37.54, longitude: 127.06} (위치 못 잡으면 null)
 *
 * 쓰는 곳: 홈 지도 현위치, 장소 거리 계산, 위치 인증, 현위치 기반 검색 등
 */

import React, {createContext, useContext, useState, useEffect} from 'react';
import {Platform} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {Location} from '../types/location';

if (Platform.OS === 'ios') {
    Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: 'whenInUse',
    });
}

type LocationContextType = {
    location: Location | null;
    isLoading: boolean;
    error: string | null;
};

const LocationContext = createContext<LocationContextType>({
    location: null,
    isLoading: true,
    error: null,
});

export function LocationProvider({children}: {children: React.ReactNode}) {
    const [location, setLocation] = useState<Location | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 실시간 위치 추적 - watchPosition (getCurrentPosition에서 이걸로 변경)
    // 한 번 실패해도 위치 잡힐 때까지 자동 재시도, 사용자 이동 시 자동 업데이트
    useEffect(() => {
        const watchId = Geolocation.watchPosition(
            position => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setIsLoading(false);
                setError(null);                // 성공 시 이전 에러 초기화
            },
            err => {
                console.warn('[LocationContext] GPS 에러:', err.message);
                setError(err.message);
                setIsLoading(false);
            },
            {
                // iOS: GPS 사용 (정확도 향상) / Android: WiFi·셀룰러도 사용 (실내에서도 위치 잡힘)
                enableHighAccuracy: Platform.OS === 'ios',
                distanceFilter: 50,            // 50m 이상 이동 시에만 업데이트 
            },
        );

        // 컴포넌트 언마운트 시 watch 정리 (메모리 누수 방지)
        return () => {
            Geolocation.clearWatch(watchId);
        };
    }, []);

    return (
        <LocationContext.Provider value={{location, isLoading, error}}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    return useContext(LocationContext);
}
