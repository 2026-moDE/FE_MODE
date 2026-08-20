import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, StatusBar, Pressable, TextInput, FlatList, Image, ActivityIndicator} from 'react-native';
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
          <IconArrowLeft size={22} color="#1F2933" />
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
    height: 64,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },

  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
  },

  searchBox: {
    flex: 1,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.default,
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    padding: 0,
    margin: 0,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: '#111827',
    lineHeight: 14,
  },

  searchIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginLeft: 6,
  },

  locationBar: {
    height: 44,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface.subtle,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  locationIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },

  locationText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.text.inverse,
  },

  savedText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.text.inverse,
  },

  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: {
    paddingTop: spacing.s,
    paddingBottom: spacing['2xl'],
  },

  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F3',
  },

  placeTextBox: {
    flex: 1,
    marginRight: spacing.md,
  },

  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: 2,
  },

  placeCategoryBadge: {
    height: 22,
    paddingHorizontal: spacing.s,
    borderRadius: radius.md,
    backgroundColor: colors.button.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
  },

  placeCategory: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.text.brand,
    lineHeight: 14,
  },

  placeAddress: {
    marginTop: spacing.s,
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: '#8A919E',
    lineHeight: 17,
  },

  placeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  placeName: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.text.basic,
    lineHeight: 24,
    marginRight: spacing.s,
  },

  placeDistance: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.brand,
    lineHeight: 17,
  },

  placeThumbnail: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    resizeMode: 'cover',
    backgroundColor: colors.navy[50],
  },

  placeThumbnailEmpty: {
    backgroundColor: colors.navy[50],
  },
});
