import React, {useEffect} from 'react';
import {StatusBar, LogBox} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import RootNavigation from './src/navigation/RootNavigation';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {GOOGLE_WEB_CLIENT_ID} from './src/constants/google';

LogBox.ignoreLogs(['[gps]', 'new NativeEventEmitter']);
LogBox.ignoreAllLogs();

function App() {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });
  }, []);

  return (
    // 바텀시트 등 제스처 사용을 위해 최상단 래핑 (gesture-handler 필수 설정)
    <GestureHandlerRootView style={{flex: 1}}>
      <BottomSheetModalProvider>
        {/* 앱 전역 StatusBar — 모든 화면에서 투명 적용 */}
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
        <RootNavigation />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

export default App;
