import React, {useState} from 'react';
import {
  FlatList,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {gap} from '../../constants/spacing';

// 카드 안 휴대폰 이미지는 디자이너 요청대로 피그마의 원본 PNG를 쓴다.
// 묶음 그룹째로 내보내면 마스크 처리 때문에 안쪽 이미지가 확대돼 나와서, 원본을 시안 수치대로 하나씩 배치한다.
// 위치는 시안 카드(360x472) 기준이고, 가로는 카드 중앙에서의 거리로 잡아 기기 폭이 달라도 가운데 정렬을 유지한다.
// 카드 높이가 줄어드는 작은 기기에서는 이미지 아래쪽이 카드에 잘린다 (시안도 카드 아래로 넘친 부분을 마스크로 자름)
type SlideImage = {
  source: ImageSourcePropType;
  width: number;
  height: number;
  top: number;
  // 이미지 왼쪽 끝이 카드 가로 중앙에서 떨어진 거리
  offsetFromCenter: number;
  borderRadius?: number;
  // 시안의 기울기 (이미지 중심 기준 회전)
  rotate?: string;
};

type Slide = {
  title: string;
  description: string;
  // 뒤에 깔리는 것부터 순서대로
  images: SlideImage[];
};

const SLIDES: Slide[] = [
  {
    title: '다른 사람들의 실시간 후기를 살펴봐요',
    description: '지금 올라오는 생생한 리뷰를 확인해요',
    images: [
      {
        source: require('../../assets/image/onboarding_01_explore.png'),
        width: 111,
        height: 241,
        top: 196,
        offsetFromCenter: 18,
        borderRadius: radius.lg,
      },
      {
        source: require('../../assets/image/onboarding_01_home.png'),
        width: 162,
        height: 352,
        top: 140,
        offsetFromCenter: -129,
        borderRadius: radius.lg,
      },
    ],
  },
  {
    title: '나도 직접 후기를 남겨봐요',
    description: '나의 경험을 공유하고 모잉에 참여해요',
    images: [
      {
        source: require('../../assets/image/onboarding_02_write.png'),
        width: 175.71,
        height: 381,
        top: 220.02,
        offsetFromCenter: -148.83,
        borderRadius: radius.lg,
        rotate: '-0.96deg',
      },
      {
        source: require('../../assets/image/onboarding_02_complete.png'),
        width: 123,
        height: 231,
        top: 148,
        offsetFromCenter: 19.11,
        rotate: '5.25deg',
      },
    ],
  },
  {
    title: '후기를 쓰고, 나만의 조각을 모아요',
    description: '하나씩 쌓이는 조각으로 나만의 컬렉션을 완성해요',
    images: [
      {
        source: require('../../assets/image/onboarding_03_archive.png'),
        width: 159,
        height: 345,
        top: 236,
        offsetFromCenter: -79,
        borderRadius: radius.lg,
      },
      {
        source: require('../../assets/image/onboarding_03_piece.png'),
        width: 90,
        height: 108,
        top: 114,
        offsetFromCenter: -45,
      },
    ],
  },
];

const CARD_HORIZONTAL_MARGIN = 16;
const CARD_MAX_HEIGHT = 472;
const TEXT_TOP = 35;

export default function OnboardingCarousel() {
  const {width} = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  // 가로 FlatList 아이템은 리스트 높이를 자동으로 채우지 않아서, 실제 높이를 재서 페이지에 넣는다
  const [listHeight, setListHeight] = useState(0);

  // 손을 떼기 전에도 절반 넘게 넘어가면 점이 바로 바뀌도록 onScroll에서 계산
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== activeIndex && index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={SLIDES}
        keyExtractor={item => item.title}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onLayout={e => setListHeight(e.nativeEvent.layout.height)}
        style={styles.list}
        renderItem={({item}) => (
          <View style={[styles.page, {width, height: listHeight}]}>
            <View style={styles.card}>
              <LinearGradient
                colors={['rgba(27, 33, 41, 0)', colors.surface.subtle]}
                style={StyleSheet.absoluteFill}
              />

              {item.images.map((image, index) => (
                <Image
                  key={index}
                  source={image.source}
                  style={[
                    styles.image,
                    {
                      width: image.width,
                      height: image.height,
                      top: image.top,
                      marginLeft: image.offsetFromCenter,
                      borderRadius: image.borderRadius,
                      transform: image.rotate ? [{rotate: image.rotate}] : undefined,
                    },
                  ]}
                  resizeMode="cover"
                />
              ))}

              <View style={styles.textGroup}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.indicator}>
        {SLIDES.map((slide, index) => (
          <View
            key={slide.title}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // 시안 높이(472)가 기본이고, 화면이 작으면 로그인 버튼 자리를 위해 줄어든다
  list: {
    flexGrow: 0,
    flexShrink: 1,
    height: CARD_MAX_HEIGHT,
  },

  page: {
    paddingHorizontal: CARD_HORIZONTAL_MARGIN,
  },

  card: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },

  image: {
    position: 'absolute',
    left: '50%',
  },

  textGroup: {
    position: 'absolute',
    top: TEXT_TOP,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: gap.sm,
  },

  title: {
    ...typography.b1,
    color: colors.text.inverse,
    textAlign: 'center',
  },

  description: {
    ...typography.b6,
    color: colors.text.disabled,
    textAlign: 'center',
  },

  indicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: gap.sm,
    marginTop: gap.xl,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface.subtle,
  },

  dotActive: {
    backgroundColor: colors.white,
  },
});
