import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  TextInput,
  FlatList,
  Dimensions,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {ReviewStackParamList} from '../../types/navigation';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {fontFamily} from '../../constants/typography';

type Props = NativeStackScreenProps<ReviewStackParamList, 'ReviewLocationSelect'>;

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

const pinIcon = require('../../assets/image/pin.png');
const placePinIcon = require('../../assets/image/place_pin.png');
const searchIcon = require('../../assets/image/search.png');

const CURRENT_PLACES = [
  {id: 1, category: '음식점', name: '명화당', distance: '30m', address: '서울특별시 광진구 능동로 175 1층', thumbnail: require('../../assets/image/pin.png')},
  {id: 2, category: '소품', name: '명화당', distance: '30m', address: '서울특별시 광진구 능동로 175 1층', thumbnail: require('../../assets/image/pin.png')},
  {id: 3, category: '카페', name: '명화당', distance: '30m', address: '서울특별시 광진구 능동로 175 1층', thumbnail: require('../../assets/image/pin.png')},
  {id: 4, category: '소품', name: '명화당', distance: '30m', address: '서울특별시 광진구 능동로 175 1층', thumbnail: require('../../assets/image/pin.png')},
  {id: 5, category: '소품', name: '명화당', distance: '30m', address: '서울특별시 광진구 능동로 175 1층', thumbnail: require('../../assets/image/pin.png')},
];

const ReviewLocationSelectScreen = ({navigation, route}: Props) => {
  const {photoUri} = route.params;

  const handleSelectPlace = (place: (typeof CURRENT_PLACES)[number]) => {
    navigation.navigate('ReviewLocationConfirm', {
      photoUri,
      placeId: place.id,
      placeName: place.name,
      placeCategory: place.category,
      placeDistance: place.distance,
      placeAddress: place.address,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
            placeholder="후기를 쓸 장소를 검색해주세요"
            placeholderTextColor="#B8BEC8"
          />
          <Image source={searchIcon} style={styles.searchIcon} />
        </View>
      </View>

      {/* 현재 위치 바 */}
      <View style={styles.locationBar}>
        <View style={styles.locationLeft}>
          <Image source={placePinIcon} style={styles.locationIcon} />
          <Text style={styles.locationText}>현재 위치</Text>
        </View>
        <Text style={styles.savedText}>저장됨</Text>
      </View>

      {/* 장소 리스트 */}
      <FlatList
        data={CURRENT_PLACES}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({item}) => (
          <Pressable
            style={styles.placeItem}
            onPress={() => handleSelectPlace(item)}>
            <View style={styles.placeTextBox}>
              <View style={styles.placeTitleRow}>
                <View style={styles.placeCategoryBadge}>
                  <Text style={styles.placeCategory}>{item.category}</Text>
                </View>
                <View style={{flex: 1}}>
                  <View style={styles.placeNameRow}>
                    <Text style={styles.placeName}>{item.name}</Text>
                    <Text style={styles.placeDistance}>{item.distance}</Text>
                  </View>
                  <Text style={styles.placeAddress}>{item.address}</Text>
                </View>
              </View>
            </View>
            <Image source={item.thumbnail} style={styles.placeThumbnail} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
};

export default ReviewLocationSelectScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: px(64),
    paddingHorizontal: px(16),
    paddingBottom: px(16),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E4',
  },

  backButton: {
    width: px(32),
    height: px(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: px(8),
  },

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

  searchInput: {
    flex: 1,
    padding: 0,
    margin: 0,
    fontFamily: fontFamily.regular,
    fontSize: px(12),
    color: '#111827',
    lineHeight: px(14),
  },

  searchIcon: {
    width: px(24),
    height: px(24),
    resizeMode: 'contain',
    marginLeft: px(6),
  },

  locationBar: {
    height: px(44),
    marginHorizontal: px(16),
    marginTop: px(12),
    borderRadius: px(8),
    backgroundColor: '#2C343F',
    paddingHorizontal: px(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(6),
  },

  locationIcon: {
    width: px(14),
    height: px(14),
    resizeMode: 'contain',
  },

  locationText: {
    fontFamily: fontFamily.bold,
    fontSize: px(13),
    color: '#FFFFFF',
  },

  savedText: {
    fontFamily: fontFamily.medium,
    fontSize: px(13),
    color: '#FFFFFF',
  },

  listContent: {
    paddingTop: px(8),
    paddingBottom: px(24),
  },

  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: px(14),
    paddingHorizontal: px(16),
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F3',
  },

  placeTextBox: {
    flex: 1,
    marginRight: px(12),
    flexDirection: 'column',
  },

  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: px(4),
    marginBottom: px(2),
  },

  placeCategoryBadge: {
    height: px(22),
    paddingHorizontal: px(8),
    borderRadius: px(8),
    backgroundColor: '#E1E9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: px(8),
  },

  placeCategory: {
    fontFamily: fontFamily.bold,
    fontSize: px(12),
    color: '#6489F2',
    lineHeight: px(14),
  },

  placeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(6),
  },

  placeName: {
    fontFamily: fontFamily.bold,
    fontSize: px(20),
    color: '#111114',
    lineHeight: px(24),
    marginRight: px(8),
  },

  placeDistance: {
    fontFamily: fontFamily.regular,
    fontSize: px(14),
    color: '#6489F2',
    lineHeight: px(17),
  },

  placeAddress: {
    marginTop: px(8),
    fontFamily: fontFamily.medium,
    fontSize: px(14),
    color: '#8A919E',
    lineHeight: px(17),
  },

  placeThumbnail: {
    width: px(80),
    height: px(80),
    borderRadius: px(12),
    resizeMode: 'cover',
    backgroundColor: '#F1F3F5',
  },
});