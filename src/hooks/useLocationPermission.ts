import { useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

// 위치 권한 요청 훅
export function useLocationPermission() {

    // useCallback으로 함수를 메모이제이션 → 매 렌더링마다 함수가 새로 생성되는 것을 방지
    const requestPermission = useCallback(async () => {
        if (Platform.OS === 'android') {
            // 안드로이드는 런타임에 사용자에게 직접 권한 팝업 요청
            await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
        }
        // iOS는 Info.plist 설정으로 자동 처리되어 별도 요청 불필요
    }, []);

    return { requestPermission };
}
