import React, {useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NaverMapView, NaverMapMarkerOverlay, NaverMapViewRef} from '@mj-studio/react-native-naver-map';

import type {ReviewStackParamList} from '../../types/navigation';
import {fontFamily} from '../../constants/typography';

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
  } = route.params;

  const mapRef = useRef<NaverMapViewRef>(null);

  const handleNo = () => {
    navigation.goBack();
  };

  const handleYes = () => {
    navigation.navigate('ReviewWrite', {
      photoUri,
      placeId,
      placeName,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
                <Text style={styles.placeName}>{placeName}</Text>
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
                onPress={() => navigation.goBack()}>
                <Text style={styles.noButtonText}>아니에요</Text>
            </Pressable>

            <Pressable style={styles.yesButton} onPress={handleYes}>
                <View style={styles.yesButtonContent}>
                <Text style={styles.checkText}>✓</Text>
                <Text style={styles.yesButtonText}>네 맞아요</Text>
                </View>
            </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ReviewLocationConfirmScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: px(16),
  },

  // 우상단 × 닫기 버튼
  closeButton: {
    position: 'absolute',
    top: px(20),
    right: px(16),
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
    color: '#111114',
    includeFontPadding: false,
  },

  // 안내 부제목
  subTitle: {
    marginTop: px(8),
    fontFamily: fontFamily.bold,
    fontSize: px(14),
    lineHeight: px(17),
    color: '#4B5563',
    includeFontPadding: false,
  },

  // 장소 카드 전체 컨테이너
  placeCard: {
    width: px(360),
    height: px(329),
    alignSelf: 'center',
    marginTop: px(40),
    borderWidth: 1,
    borderColor: '#E0E0E4',
    borderRadius: px(12),
    padding: px(4),
    backgroundColor: '#FFFFFF',
  },

  // 지도 표시 영역
  mapBox: {
    width: '100%',
    height: px(244),
    borderRadius: px(8),
  },

  naverMap: {
    flex: 1,
  },

  mapFallback: {
    flex: 1,
    backgroundColor: '#F1F3F5',
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
    paddingTop: px(12),
    paddingHorizontal: px(8),
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
  },

  // 카테고리 배지
  categoryBadge: {
    height: px(22),
    paddingHorizontal: px(8),
    borderRadius: px(8),
    backgroundColor: '#E1E9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: px(8),
    marginTop: px(2),
  },

  // 카테고리 텍스트 (파란 계열)
  categoryText: {
    fontFamily: fontFamily.bold,
    fontSize: px(12),
    lineHeight: px(14),
    color: '#6489F2',
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
    fontFamily: fontFamily.bold,
    fontSize: px(20),
    lineHeight: px(24),
    color: '#111114',
    includeFontPadding: false,
    marginRight: px(8),
  },

  // 거리 표시 (연파란 계열)
  placeDistance: {
    fontFamily: fontFamily.medium,
    fontSize: px(14),
    lineHeight: px(18),
    color: '#83A6FF',
    includeFontPadding: false,
  },

  // 도로명 주소 — 작은 회색 텍스트
  placeAddress: {
    marginTop: px(8),
    fontFamily: fontFamily.medium,
    fontSize: px(13),
    lineHeight: px(17),
    color: '#6B7280',
    includeFontPadding: false,
  },

  // 하단 버튼 영역
  bottomButtonBox: {
    position: 'absolute',
    left: px(16),
    right: px(16),
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
    borderRadius: px(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // '네 맞아요' 버튼
  yesButton: {
    width: px(225),
    height: px(48),
    borderRadius: px(12),
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
    color: '#6489F2',
    includeFontPadding: false,
    marginRight: px(8),
    },

    yesButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: px(18),
    lineHeight: px(21),
    color: '#6489F2',
    includeFontPadding: false,
    },
});