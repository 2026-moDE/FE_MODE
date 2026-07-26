import React, {useEffect, useState} from 'react';
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
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {ReviewStackParamList} from '../../types/navigation';
import type {NearbyPlace} from '../../types/place';
import {CATEGORY_LABEL} from '../../types/place';
import {fetchNearbyPlaces} from '../../api/place';
import {useLocation} from '../../context/LocationContext';
import {getDistance, formatDistance} from '../../utils/distance';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';

type Props = NativeStackScreenProps<ReviewStackParamList, 'ReviewLocationSelect'>;

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

const placePinIcon = require('../../assets/image/place_pin.png');
const searchIcon = require('../../assets/image/search.png');

const ReviewLocationSelectScreen = ({navigation, route}: Props) => {
  const {photoUri} = route.params;
  const {location} = useLocation();

  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!location) return;

    setIsLoading(true);
    fetchNearbyPlaces({
      latitude: location.latitude,
      longitude: location.longitude,
      radius: 150000,
    })
      .then(res => {
        const unique = (res.places ?? [])
          .filter(p => p.latitude != null && p.longitude != null)
          .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
        setPlaces(unique);
      })
      .catch(err => {
        console.warn('주변 장소 조회 실패:', err?.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [location]);

  const handleSelectPlace = (place: NearbyPlace) => {
    if (place.latitude == null || place.longitude == null) return;

    const distanceM = location
      ? getDistance(location, {latitude: place.latitude, longitude: place.longitude})
      : 0;

    navigation.navigate('ReviewLocationConfirm', {
      photoUri,
      placeId: place.id,
      placeName: place.name,
      placeCategory: place.category ? CATEGORY_LABEL[place.category] : '',
      placeDistance: formatDistance(distanceM),
      placeAddress: place.address ?? '',
      latitude: place.latitude,
      longitude: place.longitude,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.white} />

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
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.text.brand} />
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => {
            const distanceM =
              location && item.latitude != null && item.longitude != null
                ? getDistance(location, {latitude: item.latitude, longitude: item.longitude})
                : 0;

            return (
              <Pressable
                style={styles.placeItem}
                onPress={() => handleSelectPlace(item)}>
                <View style={styles.placeTextBox}>
                  <View style={styles.placeTitleRow}>
                    {!!item.category && (
                      <View style={styles.placeCategoryBadge}>
                        <Text style={styles.placeCategory}>{CATEGORY_LABEL[item.category]}</Text>
                      </View>
                    )}
                    <View style={styles.placeNameRow}>
                      <Text style={styles.placeName}>{item.name}</Text>
                      <Text style={styles.placeDistance}>{formatDistance(distanceM)}</Text>
                    </View>
                  </View>
                  {!!item.address && (
                    <Text style={styles.placeAddress}>{item.address}</Text>
                  )}
                </View>
                {item.thumbnail_url ? (
                  <Image
                    source={{uri: item.thumbnail_url}}
                    style={styles.placeThumbnail}
                  />
                ) : (
                  <View style={[styles.placeThumbnail, styles.placeThumbnailEmpty]} />
                )}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default ReviewLocationSelectScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.white,
  },

  header: {
    height: px(64),
    paddingHorizontal: px(spacing.lg),
    paddingBottom: px(spacing.lg),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },

  backButton: {
    width: px(32),
    height: px(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: px(spacing.s),
  },

  searchBox: {
    flex: 1,
    height: px(40),
    borderRadius: px(radius.lg),
    backgroundColor: colors.surface.default,
    paddingLeft: px(spacing.md),
    paddingRight: px(spacing.lg),
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
    marginHorizontal: px(spacing.lg),
    marginTop: px(spacing.md),
    borderRadius: px(radius.md),
    backgroundColor: colors.surface.subtle,
    paddingHorizontal: px(spacing.lg),
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
    color: colors.text.inverse,
  },

  savedText: {
    fontFamily: fontFamily.medium,
    fontSize: px(13),
    color: colors.text.inverse,
  },

  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: {
    paddingTop: px(spacing.s),
    paddingBottom: px(spacing['2xl']),
  },

  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: px(14),
    paddingHorizontal: px(spacing.lg),
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F3',
  },

  placeTextBox: {
    flex: 1,
    marginRight: px(spacing.md),
  },

  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: px(spacing.xs),
    marginBottom: px(2),
  },

  placeCategoryBadge: {
    height: px(22),
    paddingHorizontal: px(spacing.s),
    borderRadius: px(radius.md),
    backgroundColor: colors.button.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: px(spacing.s),
  },

  placeCategory: {
    fontFamily: fontFamily.bold,
    fontSize: px(12),
    color: colors.text.brand,
    lineHeight: px(14),
  },

  placeAddress: {
    marginTop: px(spacing.s),
    fontFamily: fontFamily.medium,
    fontSize: px(14),
    color: '#8A919E',
    lineHeight: px(17),
  },

  placeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(6),
  },

  placeName: {
    fontFamily: fontFamily.bold,
    fontSize: px(20),
    color: colors.text.basic,
    lineHeight: px(24),
    marginRight: px(spacing.s),
  },

  placeDistance: {
    fontFamily: fontFamily.regular,
    fontSize: px(14),
    color: colors.text.brand,
    lineHeight: px(17),
  },

  placeThumbnail: {
    width: px(80),
    height: px(80),
    borderRadius: px(radius.lg),
    resizeMode: 'cover',
    backgroundColor: colors.navy[50],
  },

  placeThumbnailEmpty: {
    backgroundColor: colors.navy[50],
  },
});
