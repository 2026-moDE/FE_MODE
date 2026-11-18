import React, {useRef, useState} from 'react';
import {View, Text, StyleSheet, StatusBar, Pressable, Modal, Image, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NaverMapMarkerOverlay, NaverMapViewRef} from '@mj-studio/react-native-naver-map';
// 현위치 마커(locationOverlay) 설정이 여기 들어있다 - iOS 에셋 카탈로그 처리까지 포함이라
// NaverMapView를 직접 쓰면 현위치 마커가 아예 안 뜬다
import MapView from '../../components/map/MapView';

import type {ReviewStackParamList} from '../../types/navigation';
import {fontFamily, typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import IconLocationPin from '../../assets/icons/IconLocationPin';
const cautionIcon = require('../../assets/image/caution_yellow.png');

// 장소 위치에 찍는 노란 동그라미. 현위치 마커와 같은 이미지를 쓴다.
// (안드로이드는 위치 추적 모드가 꺼져 있으면 SDK가 현위치 오버레이를 안 그려서,
//  이 화면에서는 장소 좌표에 마커를 직접 올려야 동그라미가 보인다)
// iOS는 신아키텍처라 require() 에셋이 지도 오버레이에 적용되지 않아 에셋 카탈로그 이름을 쓴다 - MapView와 같은 처리
const PLACE_MARKER_IMAGE = Platform.OS === 'ios'
  ? {assetName: 'mapMarker'}
  : require('../../assets/image/mapMarker.png');

type Props = NativeStackScreenProps<
  ReviewStackParamList,
  'ReviewLocationConfirm'
>;

const ReviewLocationConfirmScreen = ({navigation, route}: Props) => {
  const {
    photoUri,
    placeId,
    placeName,
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
                <MapView
                  ref={mapRef}
                  showLocationMarker={false}
                  initialCamera={{latitude, longitude, zoom: 16}}
                  isScrollGesturesEnabled={false}
                  isZoomGesturesEnabled={false}
                  isTiltGesturesEnabled={false}
                  isRotateGesturesEnabled={false}>
                  <NaverMapMarkerOverlay
                    latitude={latitude}
                    longitude={longitude}
                    image={PLACE_MARKER_IMAGE}
                    width={22}
                    height={22}
                    anchor={{x: 0.5, y: 0.5}}
                  />
                </MapView>
              ) : (
                <View style={styles.mapFallback} />
              )}
            </View>

          <View style={styles.placeInfoBox}>
            <IconLocationPin size={24} color="#4B566D" />

            <View style={styles.placeTextBox}>
              <View style={styles.placeNameRow}>
                <Text style={styles.placeName} numberOfLines={1} ellipsizeMode="tail">{placeName}</Text>
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
                <Text style={styles.noButtonText} numberOfLines={1} ellipsizeMode="tail">아니에요</Text>
            </Pressable>

            <Pressable style={styles.yesButton} onPress={handleConfirmLocation}>
                <View style={styles.yesButtonContent}>
                <Text style={styles.checkText}>✓</Text>
                <Text style={styles.yesButtonText} numberOfLines={1} ellipsizeMode="tail">네 맞아요</Text>
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
    paddingHorizontal: spacing.lg,
  },

  // 우상단 × 닫기 버튼
  closeButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  closeText: {
    fontFamily: fontFamily.regular,
    fontSize: 30,
    lineHeight: 30,
    color: '#1F2933',
    includeFontPadding: false,
  },

  titleBox: {
    marginTop: 116,
    alignItems: 'center',
  },

  // 메인 질문 텍스트
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 26,
    color: colors.text.basic,
    includeFontPadding: false,
    textAlign: 'center',
  },

  // 안내 부제목
  subTitle: {
    marginTop: spacing.s,
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 17,
    color: '#4B5563',
    includeFontPadding: false,
    textAlign: 'center',
  },

  // 장소 카드 전체 컨테이너
  placeCard: {
    alignSelf: 'stretch',
    height: 329,
    marginTop: spacing['4xl'],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    padding: spacing.xs,
    backgroundColor: colors.surface.white,
  },

  // 지도 표시 영역
  mapBox: {
    width: '100%',
    height: 244,
    borderRadius: radius.md,
  },


  mapFallback: {
    flex: 1,
    backgroundColor: colors.navy[50],
  },

  // 지도 준비 전 임시 안내 문구
  mapPlaceholderText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: '#9CA3AF',
    includeFontPadding: false,
  },

  // 위치 아이콘 + 장소명/주소 가로 배치
  placeInfoBox: {
    flex: 1,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.s,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
    backgroundColor: colors.surface.white,
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
    fontSize: 20,
    lineHeight: 24,
    color: colors.text.basic,
    includeFontPadding: false,
    marginRight: spacing.s,
  },

  // 도로명 주소 — 작은 회색 텍스트
  placeAddress: {
    marginTop: spacing.s,
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 17,
    color: '#6B7280',
    includeFontPadding: false,
  },

  // 하단 버튼 영역
  bottomButtonBox: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 33,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  // '아니에요' 버튼 — yesButton과 14:25 비율(기존 126dp:225dp) 유지
  noButton: {
    flex: 14,
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: colors.button.tertiaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // '네 맞아요' 버튼 — noButton과 25:14 비율(기존 225dp:126dp) 유지
  yesButton: {
    flex: 25,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
    yesButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    },

    // Body/B3 - 리뷰 플로우 하단 버튼 공통
    noButtonText: {
    ...typography.b3,
    color: '#B8BDC7',
    includeFontPadding: false,
    },

    checkText: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 21,
    color: colors.text.inverse,
    includeFontPadding: false,
    marginRight: spacing.s,
    },

    // Body/B3 - 리뷰 플로우 하단 버튼 공통
    yesButtonText: {
    ...typography.b3,
    color: colors.text.inverse,
    includeFontPadding: false,
    },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },

  locationFailModal: {
    width: '100%',
    height: 358,
    backgroundColor: colors.surface.white,

    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,

    paddingTop: 45,
    paddingRight: spacing.lg,
    paddingBottom: 44,
    paddingLeft: 17,

    alignItems: 'center',
  },

  cautionIcon: {
    width: 74,
    height: 74,
    resizeMode: 'contain',
    marginBottom: spacing.lg,
  },

  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 29,
    color: colors.text.basic,
    textAlign: 'center',
    includeFontPadding: false,
    marginBottom: spacing.md,
  },

  modalDescription: {
    fontFamily: fontFamily.medium,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text.subtle,
    textAlign: 'center',
    includeFontPadding: false,
    marginBottom: 44,
  },

  modalButton: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Body/B3 - 리뷰 플로우 하단 버튼 공통
  modalButtonText: {
    ...typography.b3,
    color: colors.text.inverse,
    includeFontPadding: false,
  },
});