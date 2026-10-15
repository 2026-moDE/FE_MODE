import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, Linking, PermissionsAndroid, Platform} from 'react-native';
import messaging, {AuthorizationStatus} from '@react-native-firebase/messaging';

import {getFcmToken} from '../utils/fcm';

// 푸시 알림 토글은 앱이 들고 있는 설정값이 아니라 OS 권한을 비추는 거울이다.
// 앱에서 OS 권한을 끌 수는 없어서, 끄기는 무조건 OS 설정으로 보내야 한다.
// iOS는 권한이 '미결정'일 때만 팝업이 뜨고 한 번 거부된 뒤엔 requestPermission()이
// 팝업 없이 현재 상태만 돌려주므로, 요청해보고 안 되면 설정으로 보내는 흐름으로 처리한다.
// 안드로이드의 hasPermission()은 areNotificationsEnabled()라서 읽기는 iOS와 같이 쓸 수 있지만,
// requestPermission()은 안드로이드에서 아무것도 요청하지 않고 AUTHORIZED를 돌려주므로
// (@react-native-firebase/messaging 의 namespaced.ts) 요청은 PermissionsAndroid로 직접 해야 한다.

type AuthorizationStatusValue =
  (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];

function isGranted(status: AuthorizationStatusValue): boolean {
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

export function useNotificationPermission() {
  const [enabled, setEnabled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // 권한 조회는 네이티브 왕복이라 화면을 떠난 뒤에 끝날 수 있다.
  // 그때 setState가 들어가면 화면 전환으로 해체 중인 트리에 커밋이 겹쳐서
  // Fabric이 'Attempt to recycle a mounted view'로 죽는다.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // OS 권한을 다시 읽어 토글 상태를 맞추고, 실제 허용 여부를 돌려준다
  const sync = useCallback(async (): Promise<boolean> => {
    try {
      const status = await messaging().hasPermission();
      const granted = isGranted(status);

      if (mountedRef.current) {
        setEnabled(granted);
      }

      return granted;
    } catch (error) {
      console.log('[알림 권한 조회 실패]', error);

      if (mountedRef.current) {
        setEnabled(false);
      }

      return false;
    } finally {
      if (mountedRef.current) {
        setIsChecking(false);
      }
    }
  }, []);

  useEffect(() => {
    sync();

    // 사용자가 OS 설정에서 바꾸고 돌아올 수 있으니 포그라운드 복귀마다 다시 읽는다
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        sync();
      }
    });

    return () => subscription.remove();
  }, [sync]);

  // 앱 안에서 권한 요청을 시도한다. 켜졌으면 true, 설정으로 보내야 하면 false.
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        // 안드로이드 13 미만은 런타임 권한이 없어서 앱에서 다시 켤 방법이 없다 (설정으로 보낸다)
        if (Platform.Version < 33) {
          return false;
        }

        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );

        console.log('[알림 권한 요청 결과]', result);

        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          if (mountedRef.current) {
            setEnabled(false);
          }

          return false;
        }
      } else {
        await messaging().requestPermission();
      }

      // 요청 결과를 그대로 믿지 않고 실제 권한을 다시 읽는다.
      // 안드로이드는 POST_NOTIFICATIONS를 허용해도 앱 알림 자체가 꺼져 있을 수 있다.
      const granted = await sync();

      if (!granted) {
        return false;
      }

      // 권한이 새로 켜졌으면 토큰을 발급해 기기를 다시 등록해둔다.
      // 서버는 로그인 때만 fcm_token을 받으므로, 토큰이 바뀐 경우 반영은 다음 로그인에 된다.
      await getFcmToken();

      return true;
    } catch (error) {
      console.log('[알림 권한 요청 실패]', error);

      return false;
    }
  }, [sync]);

  // OS 설정 화면으로 보낸다 (끄기, 그리고 이미 거부된 상태에서 켜기)
  const openSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.log('[OS 설정 이동 실패]', error);
    }
  }, []);

  return {enabled, isChecking, requestPermission, openSettings};
}
