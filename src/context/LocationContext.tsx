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

    // 실시간 위치 추적하려면 getCurrentPosition -> watchPosition
    useEffect(() => {
        Geolocation.getCurrentPosition(
            position => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setIsLoading(false);
            },
            err => {
                setError(err.message);
                setIsLoading(false);
            },
            // GPS / 위치 정보 최대 반환 시간 / 위치 사용 허용 시간
            {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
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
