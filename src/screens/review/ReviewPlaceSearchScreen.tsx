import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  TextInput,
  Platform,
  ScrollView,
  Dimensions,
  Image,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {ReviewStackParamList} from '../../types/navigation';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {fontFamily} from '../../constants/typography';
import {
  getReviewSearchPlacesMock,
  type ReviewPlaceMock,
} from '../../mocks/reviewPlacesMock';

type Props = NativeStackScreenProps<ReviewStackParamList, 'ReviewPlaceSearch'>;

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

// 아이콘 이미지
const pinIcon = require('../../assets/image/pin.png');
const placePinIcon = require('../../assets/image/place_pin.png');
const fireIcon = require('../../assets/image/fire.png');
const searchIcon = require('../../assets/image/search.png');
const crossIcon = require('../../assets/image/cross.png');

const INITIAL_RECENT_KEYWORDS = ['성수동', '가나디 팝업', '저쩌고', '어쩌고'];

const RECOMMEND_KEYWORDS = [
  {label: '성수동', icon: 'pin'},
  {label: '망원동', icon: 'pin'},
  {label: '가나디 팝업', icon: 'fire'},
  {label: '말빵', icon: 'fire'},
  {label: '군자', icon: 'pin'},
  {label: '서초', icon: 'pin'},
  {label: '콩국수', icon: 'fire'},
] as const;

const SEARCH_SUGGESTIONS = ['음식점', '한식', '음식'];

const ReviewPlaceSearchScreen = ({navigation, route}: Props) => {
  const {photoUri} = route.params;

  const [keyword, setKeyword] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [recentKeywords, setRecentKeywords] = useState(INITIAL_RECENT_KEYWORDS);

  // 검색창 포커스 중이거나 텍스트 입력 중이면 검색 모드
  const isSearching = isSearchFocused || keyword.trim().length > 0;

  // 키보드 높이 감지
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      },
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Demo mock returns results regardless of keyword until the real API is wired.
  const filteredPlaces = useMemo(() => {
    return getReviewSearchPlacesMock(keyword);
  }, [keyword]);

  // 장소 선택 시 후기 작성 화면으로 이동
  const handleSelectPlace = (place: ReviewPlaceMock) => {
    navigation.navigate('ReviewWrite', {
      photoUri,
      placeId: place.id,
      placeName: place.name,
    });
  };

  // 현재 위치로 찾기 버튼 → 지도 선택 화면으로 이동
  const handleCurrentLocation = () => {
    navigation.navigate('ReviewLocationSelect', {
      photoUri,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.keyboardView}>

        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={10}>
            <IconArrowLeft size={px(22)} color="#1F2933" />
          </Pressable>

          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              value={keyword}
              onChangeText={setKeyword}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="후기 쓸 장소를 입력해주세요"
              placeholderTextColor="#B8BEC8"
              returnKeyType="search"
              blurOnSubmit={false}
            />
            <Image source={searchIcon} style={styles.searchIcon} />
          </View>
        </View>

        {/* 스크롤 컨텐츠 */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled">
          {!isSearching ? (
            <>
              {/* 최근 검색어 섹션 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>최근 검색어</Text>
                <View style={styles.chipWrap}>
                  {recentKeywords.map(item => (
                    <Pressable
                      key={item}
                      style={styles.recentChip}
                      onPress={() => {
                        setKeyword(item);
                        setIsSearchFocused(true);
                      }}>
                      <Text style={styles.recentChipText}>{item}</Text>
                      <Pressable
                        hitSlop={6}
                        onPress={() =>
                          setRecentKeywords(prev => prev.filter(k => k !== item))
                        }>
                        <Image source={crossIcon} style={styles.recentChipClose} />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* 추천 검색어 섹션 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>추천 검색어</Text>
                <View style={styles.chipWrap}>
                  {RECOMMEND_KEYWORDS.map(item => {
                    const iconSource = item.icon === 'fire' ? fireIcon : pinIcon;
                    return (
                      <Pressable
                        key={item.label}
                        style={styles.recommendChip}
                        onPress={() => {
                          setKeyword(item.label);
                          setIsSearchFocused(true);
                        }}>
                        <Image source={iconSource} style={styles.recommendIcon} />
                        <Text style={styles.recommendChipText}>{item.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.resultSection}>
              {keyword.trim().length === 0 && (
                <View style={styles.suggestionBox}>
                  {SEARCH_SUGGESTIONS.map(item => (
                    <Pressable
                      key={item}
                      style={styles.suggestionItem}
                      onPress={() => setKeyword(item)}>
                      <Image source={searchIcon} style={styles.suggestionIcon} />
                      <Text style={styles.suggestionText}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {filteredPlaces.length > 0 ? (
                filteredPlaces.map(place => (
                  <Pressable
                    key={place.id}
                    style={styles.placeItem}
                    onPress={() => handleSelectPlace(place)}>
                    <View style={styles.placeTextBox}>
                      <View style={styles.placeTitleRow}>
                        <View style={styles.placeCategoryBadge}>
                          <Text style={styles.placeCategory}>{place.category}</Text>
                        </View>
                        <View style={{flex: 1}}>
                          <View style={styles.placeNameRow}>
                            <Text style={styles.placeName}>{place.name}</Text>
                            <Text style={styles.placeDistance}>{place.distance}</Text>
                          </View>
                          <Text style={styles.placeAddress}>{place.address}</Text>
                        </View>
                      </View>
                    </View>
                    <Image
                      source={{uri: place.thumbnailUrl}}
                      style={styles.placeThumbnail}
                    />
                  </Pressable>
                ))
              ) : (
                <Text style={styles.emptyText}>검색 결과가 없어요.</Text>
              )}
            </View>
          )}
        </ScrollView>

        {/* keyboardHeight만큼 paddingBottom 줘서 키보드 위에 붙게 */}
        <View
          style={[
            styles.currentLocationWrapper,
            {paddingBottom: keyboardHeight > 0 ? keyboardHeight + px(12) : px(12)},
          ]}>
          <Pressable
            style={styles.currentLocationButton}
            onPress={handleCurrentLocation}>
            <Image source={placePinIcon} style={styles.currentLocationIcon} />
            <Text style={styles.currentLocationText}>
              현재 위치로 장소 찾기
            </Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  );
};

export default ReviewPlaceSearchScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  keyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // 뒤로가기 + 검색창 있는 상단 헤더
  header: {
    height: px(64),
    paddingHorizontal: px(16),
    paddingBottom: px(16),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E4'
  },

  // 뒤로가기 버튼
  backButton: {
    width: px(32),
    height: px(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: px(8),
  },

  // 검색창 회색 박스
  searchBox: {
    flex: 1,
    height: px(40),
    borderRadius: px(12),
    backgroundColor: '#F1F1F4',
    paddingLeft: px(12),
    paddingRight: px(16),
    flexDirection: 'row',
    alignItems: 'center',
  },

  // 텍스트 입력 필드
  searchInput: {
    flex: 1,
    padding: 0,
    margin: 0,
    fontFamily: fontFamily.regular,
    fontSize: px(12),
    color: '#111827',
    lineHeight: px(14),
  },

  // 검색 돋보기 아이콘
  searchIcon: {
    width: px(24),
    height: px(24),
    resizeMode: 'contain',
    marginLeft: px(6),
  },

  // 스크롤 영역
  content: {
    flex: 1,
  },

  // 스크롤 내부 패딩
  contentContainer: {
    paddingHorizontal: px(16),
    paddingTop: px(16),
    paddingBottom: px(16),
  },

  // 최근/추천 검색어 섹션 간격
  section: {
    marginBottom: px(36),
  },

  // "최근 검색어" 같은 섹션 타이틀
  sectionTitle: {
    fontFamily: fontFamily.medium,
    fontSize: px(14),
    color: '#111114',
    lineHeight: px(18),
    marginBottom: px(8),
  },

  // 칩들을 가로로 줄바꿈해서 나열하는 컨테이너
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: px(8),
  },

  // 최근 검색어 칩 (회색)
  recentChip: {
    height: px(33),
    paddingHorizontal: px(12),
    borderRadius: px(8),
    backgroundColor: '#F1F3F5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(6),
  },

  // 최근 검색어 텍스트
  recentChipText: {
    fontFamily: fontFamily.medium,
    fontSize: px(14),
    color: '#4B5563',
    lineHeight: px(17),
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginRight: px(8),
  },

  // 최근 검색어 X 버튼 아이콘
  recentChipClose: {
    width: px(8),
    height: px(8),
    resizeMode: 'contain',
  },

  // 추천 검색어 칩 (연파랑)
  recommendChip: {
    height: px(33),
    paddingHorizontal: px(12),
    borderRadius: px(8),
    backgroundColor: '#E1E9FF',
    alignItems: 'center',
    flexDirection: 'row',
    gap: px(4),
  },

  // 추천 검색어 칩 내 아이콘
  recommendIcon: {
    width: px(16),
    height: px(16),
    resizeMode: 'contain',
  },

  // 추천 검색어 텍스트
  recommendChipText: {
    fontFamily: fontFamily.regular,
    fontSize: px(14),
    color: '#6489F2',
    lineHeight: px(17),
  },

  // 검색 결과 영역
  resultSection: {
    paddingTop: px(4),
    marginHorizontal: -px(16),
  },

  // 자동완성 힌트 목록 박스
  suggestionBox: {
    marginBottom: px(12),
  },

  // 자동완성 힌트 한 줄
  suggestionItem: {
    height: px(49),
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E4',
    paddingHorizontal: px(16),
  },

  // 자동완성 앞 돋보기 아이콘
  suggestionIcon: {
    width: px(16),
    height: px(16),
    resizeMode: 'contain',
    marginRight: px(12),
  },

  // 자동완성 힌트 텍스트
  suggestionText: {
    fontFamily: fontFamily.regular,
    fontSize: px(14),
    color: '#4B566D',
  },

  // 장소 결과 한 줄 (하단 구분선 있음)
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: px(14),
    paddingHorizontal: px(16),
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F3',
  },

  // 장소 텍스트 영역 (썸네일 왼쪽)
  placeTextBox: {
    flex: 1,
    marginRight: px(12),
    flexDirection: 'column'
  },

  // 카테고리 + 이름 + 거리 가로 배치
  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: px(4),
    marginBottom: px(2),
  },

  // 장소 카테고리 (파란색 배경)
  placeCategoryBadge: {
    height: px(22),
    paddingHorizontal: px(8),
    borderRadius: px(8),
    backgroundColor: '#E1E9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: px(8),
  },

  // 장소 카테고리 (파란 소문자)
  placeCategory: {
    fontFamily: fontFamily.bold,
    fontSize: px(12),
    color: '#6489F2',
    lineHeight: px(14),
  },

  // 장소 이름
  placeName: {
    fontFamily: fontFamily.bold,
    fontSize: px(20),
    color: '#111114',
    lineHeight: px(24),
    marginRight: px(8),
  },

  placeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(6),
  },

  // 현재 위치로부터 거리
  placeDistance: {
    fontFamily: fontFamily.regular,
    fontSize: px(14),
    color: '#6489F2',
    lineHeight: px(17),
  },

  // 장소 주소
  placeAddress: {
    marginTop: px(8),
    fontFamily: fontFamily.medium,
    fontSize: px(14),
    color: '#8A919E',
    lineHeight: px(17),
  },

  // 장소 썸네일 이미지
  placeThumbnail: {
    width: px(80),
    height: px(80),
    borderRadius: px(12),
    resizeMode: 'cover',
    backgroundColor: '#F1F3F5',
  },

  // 검색 결과 없을 때 안내 문구
  emptyText: {
    marginTop: px(40),
    textAlign: 'center',
    fontFamily: fontFamily.medium,
    fontSize: px(14),
    color: '#8A919E',
  },

  // "현재 위치로 장소 찾기" 버튼
  currentLocationWrapper: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: px(12),
  },

  // 현재 위치 버튼 (어두운 배경)
  currentLocationButton: {
    height: px(34),
    paddingHorizontal: px(16),
    borderRadius: px(8),
    backgroundColor: '#2C343F',
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(4),
  },

  // 현재 위치 버튼 핀 아이콘
  currentLocationIcon: {
    width: px(14),
    height: px(14),
    resizeMode: 'contain',
  },

  // 현재 위치 버튼 텍스트 (흰색)
  currentLocationText: {
    fontFamily: fontFamily.bold,
    fontSize: px(12),
    color: '#FFFFFF',
    lineHeight: px(16),
  },
});
