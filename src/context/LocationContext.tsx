import React, {createContext, useContext, useState, useEffect} from 'react';
import Geolocation from '@react-native-community/geolocation';
import {Location} from '../types/location';

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
                enableHighAccuracy: false,     // GPS + WiFi + 셀룰러 다 사용 (실내도 ㄱㄴ)
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
