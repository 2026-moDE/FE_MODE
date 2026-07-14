import React from 'react';
import {StatusBar, LogBox} from 'react-native';
import RootNavigation from './src/navigation/RootNavigation';

LogBox.ignoreLogs(['[gps]', 'new NativeEventEmitter']);
LogBox.ignoreAllLogs();

function App() {
  return (
    <>
      {/* 앱 전역 StatusBar — 모든 화면에서 투명 적용 */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <RootNavigation />
    </>
  );
}

export default App;