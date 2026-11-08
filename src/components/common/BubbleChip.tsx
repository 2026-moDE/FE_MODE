import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Svg, Path} from 'react-native-svg';

import {colors} from '../../constants/colors';
import {padding} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import {typography} from '../../constants/typography';

type Props = {
  text: string;
};

// 시안 bubbleChip(node 1799:8191, BottomCenter). 위치는 감싸는 쪽에서 정한다.
// 칩 높이가 28로 고정이라 시스템 글자 크기를 따라가면 글자가 넘치므로 스케일링을 끈다
export default function BubbleChip({text}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.chip}>
        <Text allowFontScaling={false} style={styles.text}>
          {text}
        </Text>
      </View>

      <Svg width={13.8564} height={12} viewBox="0 0 13.8564 12" style={styles.tail}>
        <Path
          d="M6.9282 12L13.8564 0H0L6.9282 12Z"
          fill={colors.button.primaryFill}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },

  chip: {
    height: 28,
    paddingHorizontal: padding.md,
    borderRadius: radius.md,
    backgroundColor: colors.button.primaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  text: {
    ...typography.c1,
    lineHeight: 16,
    letterSpacing: -0.24,
    color: colors.text.basic,
    textAlign: 'center',
    includeFontPadding: false,
  },

  // 칩과의 서브픽셀 틈 방지
  tail: {
    marginTop: -0.5,
  },
});
