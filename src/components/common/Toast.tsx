import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';

import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {gap, padding} from '../../constants/spacing';
import {radius} from '../../constants/radius';

const checkWhiteIcon = require('../../assets/image/check_white.png');

const TOAST_DURATION = 2000;
// 하단 탭바(+세이프에어리어)를 넘기는 높이. 토스트 호스트는 네비게이션 컨테이너 밖에 있어서
// useSafeAreaInsets를 못 쓴다 (insets은 react-navigation이 내부에서 제공)
const TOAST_BOTTOM = 120;

type ToastContextType = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

// 리뷰 신고/댓글 삭제 토스트와 같은 모양이지만, 이쪽은 화면이 닫혀도 살아 있어야 한다.
// (차단 성공 토스트는 프로필 화면을 goBack으로 닫은 뒤에 떠야 함)
export function ToastProvider({children}: {children: React.ReactNode}) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((next: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setMessage(next);
    timerRef.current = setTimeout(() => setMessage(null), TOAST_DURATION);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  return (
    <ToastContext.Provider value={{showToast}}>
      {children}

      {/* 바텀시트(@gorhom 포털)보다 위에 떠야 해서 시트 프로바이더 바깥에 두고,
          children 뒤에 그려서 항상 위에 깔리게 한다 */}
      {message !== null && (
        <View style={styles.host} pointerEvents="none">
          <View style={styles.toast}>
            <Image source={checkWhiteIcon} style={styles.icon} resizeMode="contain" />
            <Text allowFontScaling={false} style={styles.text}>
              {message}
            </Text>
          </View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: TOAST_BOTTOM,
    alignItems: 'center',
  },

  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: gap.sm,
    paddingVertical: padding.sm,
    paddingHorizontal: padding.lg,
    backgroundColor: colors.background.dimDarker,
    borderRadius: radius.md,
  },

  icon: {
    width: 16,
    height: 16,
  },

  text: {
    ...typography.b5,
    color: colors.text.inverse,
  },
});
