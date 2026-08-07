import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Dimensions,
  Modal,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NaverMapView, NaverMapMarkerOverlay, NaverMapViewRef} from '@mj-studio/react-native-naver-map';

import type {ReviewStackParamList} from '../../types/navigation';
import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
const cautionIcon = require('../../assets/image/caution.png');

type Props = NativeStackScreenProps<
  ReviewStackParamList,
  'ReviewLocationConfirm'
>;

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

const ReviewLocationConfirmScreen = ({navigation, route}: Props) => {
  const {
    photoUri,
    placeId,
    placeName,
    placeCategory,
    placeDistance,
    placeAddress,
    latitude,
    longitude,
    congestion,
    reviewText,
  } = route.params;

const mapRef = useRef<NaverMapViewRef>(null);

const [locationFailVisible, setLocationFailVisible] = useState(false);

const LOCATION_LIMIT_M = 200;

const getDistanceNumber = (distance: string | number | undefined) => {
  if (typeof distance === 'number') {
    return distance;
  }

  if (!distance) {
    return 9999;
  }

  const lowerDistance = distance.toLowerCase();

  const onlyNumber = lowerDistance.replace(/[^0-9.]/g, '');
  const numberValue = Number(onlyNumber);

  if (Number.isNaN(numberValue)) {
    return 9999;
  }

  // 혹시 "1.2km" 이런 식으로 들어오면 m로 변환
  if (lowerDistance.includes('km')) {
    return numberValue * 1000;
  }

  return numberValue;
};

const handleNo = () => {
  navigation.goBack();
};

const handleConfirmLocation = () => {
  const distanceNumber = getDistanceNumber(placeDistance);

  if (distanceNumber > LOCATION_LIMIT_M) {
    setLocationFailVisible(true);
    return;
  }

  navigation.navigate('ReviewWrite', {
    photoUri,
    placeId,
    placeName,
    congestion,
    reviewText,
  });
};


const handleLocationFailConfirm = () => {
  setLocationFailVisible(false);

  navigation.navigate('ReviewWrite', {
    photoUri,
    congestion,
    reviewText,
  });
};

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.white} />

      <View style={styles.container}>
        <Pressable
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          hitSlop={10}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>

        <View style={styles.titleBox}>
          <Text style={styles.title}>지금 {placeName}에 계신가요?</Text>
          <Text style={styles.subTitle}>선택하신 장소를 확인해주세요</Text>
        </View>

        <View style={styles.placeCard}>
            <View style={styles.mapBox}>
              {latitude != null && longitude != null && latitude !== 0 && longitude !== 0 ? (
                <NaverMapView
                  ref={mapRef}
                  style={styles.naverMap}
                  initialCamera={{latitude, longitude, zoom: 16}}
                  isShowCompass={false}
                  isShowScaleBar={false}
                  isShowZoomControls={false}
                  isScrollGesturesEnabled={false}
                  isZoomGesturesEnabled={false}
                  isTiltGesturesEnabled={false}
                  isRotateGesturesEnabled={false}>
                  <NaverMapMarkerOverlay
                    latitude={latitude}
                    longitude={longitude}
                  />
                </NaverMapView>
              ) : (
                <View style={styles.mapFallback} />
              )}
            </View>

          <View style={styles.placeInfoBox}>
            {!!placeCategory && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{placeCategory}</Text>
              </View>
            )}

            <View style={styles.placeTextBox}>
              <View style={styles.placeNameRow}>
                <Text style={styles.placeName} numberOfLines={1} ellipsizeMode="tail">{placeName}</Text>
                <Text style={styles.placeDistance}>{placeDistance}</Text>
              </View>

              {!!placeAddress && (
                <Text style={styles.placeAddress}>{placeAddress}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomButtonBox}>
            <Pressable
                style={styles.noButton}
                onPress={handleNo}>
                <Text style={styles.noButtonText}>아니에요</Text>
            </Pressable>

            <Pressable style={styles.yesButton} onPress={handleConfirmLocation}>
                <View style={styles.yesButtonContent}>
                <Text style={styles.checkText}>✓</Text>
                <Text style={styles.yesButtonText}>네 맞아요</Text>
                </View>
            </Pressable>
        </View>
      </View>

      <Modal
        visible={locationFailVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationFailVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.locationFailModal}>
            <Image source={cautionIcon} style={styles.cautionIcon} />

            <Text style={styles.modalTitle}>위치 인증에 실패했어요</Text>

            <Text style={styles.modalDescription}>
              내 위치 기준 200m 이내의 장소만{'\n'}
              리뷰 작성이 가능해요
            </Text>

            <Pressable
              style={styles.modalButton}
              onPress={handleLocationFailConfirm}>
            <Text style={styles.modalButtonText}>확인했어요</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ReviewLocationConfirmScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.white,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background.white,
    paddingHorizontal: px(spacing.lg),
  },

  // 우상단 × 닫기 버튼
  closeButton: {
    position: 'absolute',
    top: px(spacing.xl),
    right: px(spacing.lg),
    width: px(32),
    height: px(32),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  closeText: {
    fontFamily: fontFamily.regular,
    fontSize: px(30),
    lineHeight: px(30),
    color: '#1F2933',
    includeFontPadding: false,
  },

  titleBox: {
    marginTop: px(116),
    alignItems: 'center',
  },

  // 메인 질문 텍스트
  title: {
    fontFamily: fontFamily.bold,
    fontSize: px(22),
    lineHeight: px(26),
    color: colors.text.basic,
    includeFontPadding: false,
    textAlign: 'center',
  },

  // 안내 부제목
  subTitle: {
    marginTop: px(spacing.s),
    fontFamily: fontFamily.bold,
    fontSize: px(14),
    lineHeight: px(17),
    color: '#4B5563',
    includeFontPadding: false,
    textAlign: 'center',
  },

  // 장소 카드 전체 컨테이너
  placeCard: {
    width: px(360),
    height: px(329),
    alignSelf: 'center',
    marginTop: px(spacing['4xl']),
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: px(radius.lg),
    padding: px(spacing.xs),
    backgroundColor: colors.surface.white,
  },

  // 지도 표시 영역
  mapBox: {
    width: '100%',
    height: px(244),
    borderRadius: px(radius.md),
  },

  naverMap: {
    flex: 1,
  },

  mapFallback: {
    flex: 1,
    backgroundColor: colors.navy[50],
  },

  // 지도 준비 전 임시 안내 문구
  mapPlaceholderText: {
    fontFamily: fontFamily.medium,
    fontSize: px(14),
    color: '#9CA3AF',
    includeFontPadding: false,
  },

  // 카테고리 배지 + 장소명/주소 가로 배치
  placeInfoBox: {
    flex: 1,
    paddingTop: px(spacing.md),
    paddingHorizontal: px(spacing.s),
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface.white,
  },

  // 카테고리 배지
  categoryBadge: {
    height: px(22),
    paddingHorizontal: px(spacing.s),
    borderRadius: px(radius.md),
    backgroundColor: colors.button.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: px(spacing.s),
    marginTop: px(2),
  },

  // 카테고리 텍스트 (파란 계열)
  categoryText: {
    fontFamily: fontFamily.bold,
    fontSize: px(12),
    lineHeight: px(14),
    color: colors.text.brand,
    includeFontPadding: false,
  },

  // 장소명·거리·주소를 세로로 쌓는 flex 컨테이너
  placeTextBox: {
    flex: 1,
  },

  // 장소명과 거리를 한 줄에 가로 배치
  placeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // 장소명 — 굵고 큰 텍스트
  placeName: {
    flexShrink: 1,
    fontFamily: fontFamily.bold,
    fontSize: px(20),
    lineHeight: px(24),
    color: colors.text.basic,
    includeFontPadding: false,
    marginRight: px(spacing.s),
  },

  // 거리 표시 (연파란 계열) — 항상 잘리지 않게 고정
  placeDistance: {
    flexShrink: 0,
    fontFamily: fontFamily.medium,
    fontSize: px(14),
    lineHeight: px(18),
    color: colors.brand.primary,
    includeFontPadding: false,
  },

  // 도로명 주소 — 작은 회색 텍스트
  placeAddress: {
    marginTop: px(spacing.s),
    fontFamily: fontFamily.medium,
    fontSize: px(13),
    lineHeight: px(17),
    color: '#6B7280',
    includeFontPadding: false,
  },

  // 하단 버튼 영역
  bottomButtonBox: {
    position: 'absolute',
    left: px(spacing.lg),
    right: px(spacing.lg),
    bottom: px(33),
    height: px(48),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // '아니에요' 버튼
  noButton: {
    width: px(126),
    height: px(48),
    borderRadius: px(radius.lg),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: colors.button.tertiaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // '네 맞아요' 버튼
  yesButton: {
    width: px(225),
    height: px(48),
    borderRadius: px(radius.lg),
    backgroundColor: '#DCE6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
    yesButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    },

    noButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: px(18),
    lineHeight: px(21),
    color: '#B8BDC7',
    includeFontPadding: false,
    },

    checkText: {
    fontFamily: fontFamily.bold,
    fontSize: px(18),
    lineHeight: px(21),
    color: colors.text.brand,
    includeFontPadding: false,
    marginRight: px(spacing.s),
    },

    yesButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: px(18),
    lineHeight: px(21),
    color: colors.text.brand,
    includeFontPadding: false,
    },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },

  locationFailModal: {
    width: '100%',
    height: px(358),
    backgroundColor: colors.surface.white,

    borderTopLeftRadius: px(radius.lg),
    borderTopRightRadius: px(radius.lg),

    paddingTop: px(45),
    paddingRight: px(spacing.lg),
    paddingBottom: px(44),
    paddingLeft: px(17),

    alignItems: 'center',
  },

  cautionIcon: {
    width: px(74),
    height: px(74),
    resizeMode: 'contain',
    marginBottom: px(spacing.lg),
  },

  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: px(24),
    lineHeight: px(29),
    color: colors.text.basic,
    textAlign: 'center',
    includeFontPadding: false,
    marginBottom: px(spacing.md),
  },

  modalDescription: {
    fontFamily: fontFamily.medium,
    fontSize: px(18),
    lineHeight: px(22),
    color: colors.text.subtle,
    textAlign: 'center',
    includeFontPadding: false,
    marginBottom: px(44),
  },

  modalButton: {
    width: px(360),
    height: px(52),
    borderRadius: px(radius.lg),
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: px(18),
    lineHeight: px(21),
    color: colors.text.inverse,
    includeFontPadding: false,
  },
});