import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { AppStackParamList } from '../../types/navigation';

type AppNav = NativeStackNavigationProp<AppStackParamList>;

const TAB_LABELS: Record<string, string> = {
  Home: '홈',
  Mypage: '마이페이지',
};

const TAB_ORDER = ['ReviewBtn', 'Home', 'Mypage'];

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const appNavigation = useNavigation<AppNav>();

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {TAB_ORDER.map((name) => {

          if (name === 'ReviewBtn') {
            return (
              <TouchableOpacity
                key="ReviewBtn"
                style={styles.tab}
                onPress={() => appNavigation.navigate('ReviewStack')}
              >
                <Text style={styles.label}>리뷰 쓰기</Text>
              </TouchableOpacity>
            );
          }

          const route = state.routes.find((r) => r.name === name);
          if (!route) return null;
          const index = state.routes.indexOf(route);
          const isActive = state.index === index;
          const label = TAB_LABELS[name] ?? name;

          return (
            <TouchableOpacity
              key={route.key}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => navigation.navigate(name)}
            >
              <Text style={[styles.label, isActive && styles.activeLabel]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 1000,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 1000,
  },
  activeTab: {
    backgroundColor: colors.brand.primary,
  },
  label: {
    ...typography.b4,
    color: colors.text.inverse,
  },
  activeLabel: {
    ...typography.b3,
    color: colors.text.inverse,
  },
});