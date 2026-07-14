import {PermissionsAndroid, Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';

export const getFcmToken = async (): Promise<string | undefined> => {
  try {
    // Android 13 이상 알림 권한 요청
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const permissionResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      console.log('[FCM 알림 권한]', permissionResult);
    }

    // iOS 대비용
    if (Platform.OS === 'ios') {
      await messaging().requestPermission();
      await messaging().registerDeviceForRemoteMessages();
    }

    const fcmToken = await messaging().getToken();

    console.log('[FCM TOKEN 발급 성공]', fcmToken);

    return fcmToken;
  } catch (error) {
    console.log('[FCM TOKEN 발급 실패]', error);

    // fcm_token은 선택값이라 실패해도 로그인은 진행되게 undefined 반환
    return undefined;
  }
};