module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // reanimated 4 필수 플러그인 - 반드시 plugins 배열 맨 마지막
  plugins: ['react-native-worklets/plugin'],
};
