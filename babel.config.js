module.exports = api => {
  // metro가 release 번들(--dev false)을 만들 때 BABEL_ENV=production 으로 넣어준다
  const isProduction = api.env('production');

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      // release 번들에서는 console.* 를 걷어낸다 - 토큰 같은 값이 logcat / Console.app으로
      // 새어나가는 걸 막는 2차 방어선. error는 크래시 추적용으로 남긴다
      ...(isProduction
        ? [['transform-remove-console', {exclude: ['error']}]]
        : []),
      // reanimated 4 필수 플러그인 - 반드시 plugins 배열 맨 마지막
      'react-native-worklets/plugin',
    ],
  };
};
