import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { AppStackParamList } from '../../types/navigation';

type AppNav = NativeStackNavigationProp<AppStackParamList>;

// 홈 → 리뷰 → 마이페이지 순서
const TAB_ORDER = ['Home', 'ReviewBtn', 'Mypage'];

const TAB_ICONS: Record<string, any> = {
  Home: require('../../assets/image/tab_home.png'),
  ReviewBtn: require('../../assets/image/tab_review.png'),
  Mypage: require('../../assets/image/tab_mypage.png'),
};

// png 원본 크기가 제각각이라 리뷰 사진 기준으로 각자 환산
const ICON_SIZES: Record<string, {width: number; height: number}> = {
  Home: {width: 18.5, height: 20},      // 원본 44x48
  ReviewBtn: {width: 24, height: 24},   // 원본 57x57 (기준)
  Mypage: {width: 27, height: 27},      // 원본 64x64
};

export default function CustomTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const appNavigation = useNavigation<AppNav>();
  const insets = useSafeAreaInsets();

  // 현재 화면이 tabBarStyle을 'none'으로 설정했으면 탭바 숨김
  const focusedRoute = state.routes[state.index]; // 현재 화면
  const focusedOptions = descriptors[focusedRoute.key]?.options;
  const tabBarStyle = focusedOptions?.tabBarStyle as { display?: string } | undefined;
  if (tabBarStyle?.display === 'none') {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {TAB_ORDER.map((name) => {

        // 가운데 리뷰 버튼
        if (name === 'ReviewBtn') {
          return (
            <TouchableOpacity
              key="ReviewBtn"
              style={styles.tab}
              onPress={() => appNavigation.navigate('ReviewStack')}
            >
              <View style={[styles.iconBox, styles.reviewBox]}>
                <Image source={TAB_ICONS.ReviewBtn} style={ICON_SIZES.ReviewBtn} resizeMode="contain" />
              </View>
            </TouchableOpacity>
          );
        }

        const route = state.routes.find((r) => r.name === name);
        if (!route) return null;
        const index = state.routes.indexOf(route);
        const isFocused = state.index === index;

        // 탭 누르면 tabPress 이벤트 발생 (이미 활성 탭이어도 발생 → 화면이 감지 가능)
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true, // 이동 거부권
          });

          // preventDefault()호출하면 defaultPrevented는 true
          // 근데 preventDefault() 호출 따로 안해서 event.defaultPrevented는 항상 false
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
          >
            <View style={styles.iconBox}>
              <Image source={TAB_ICONS[name]} style={ICON_SIZES[name]} resizeMode="contain" />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.white,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBox: {
    backgroundColor: '#F2F3F5',
  },
});
