import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

import {searchUsers, sendFriendRequest, FriendStatus} from '../../api/friend';
import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconSearch from '../../assets/icons/IconSearch';

const emptyProfileIcon = require('../../assets/image/empty_profile.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type SearchResultUser = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  friendStatus: FriendStatus;
};

export default function FriendSearchScreen() {
  const navigation = useNavigation<any>();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchResultUser[]>([]);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const trimmed = keyword.trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!trimmed) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const users = await searchUsers(trimmed);
        setResults(
          users.map(user => ({
            id: user.user_id,
            nickname: user.nickname,
            profileImageUrl: user.profile_image_url,
            friendStatus: user.friend_status,
          })),
        );
      } catch (error) {
        console.log('[유저 검색 실패]', error);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [keyword]);

  const handleSendRequest = async (id: number) => {
    try {
      await sendFriendRequest(id);
      setResults(prev =>
        prev.map(user => (user.id === id ? {...user, friendStatus: 'PENDING'} : user)),
      );
    } catch (error) {
      console.log('[친구 요청 전송 실패]', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.white} />

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <IconArrowLeft size={px(20)} color={colors.icon.basic} />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="닉네임을 입력해주세요"
            placeholderTextColor={colors.text.disabled}
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
          />
          <IconSearch size={px(16)} color={colors.icon.tertiary} />
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={item => String(item.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        renderItem={({item}: {item: SearchResultUser}) => (
          <View style={styles.userRow}>
            <View style={styles.profileGroup}>
              <View style={styles.profile}>
                <Image
                  source={item.profileImageUrl ? {uri: item.profileImageUrl} : emptyProfileIcon}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              </View>

              <Text style={styles.userName}>{item.nickname}</Text>
            </View>

            {item.friendStatus === 'NONE' && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.requestButton}
                onPress={() => handleSendRequest(item.id)}>
                <Text style={styles.requestButtonText}>친구 요청</Text>
              </TouchableOpacity>
            )}

            {item.friendStatus === 'PENDING' && (
              <Text style={styles.requestedLabel}>요청됨</Text>
            )}

            {item.friendStatus === 'ACCEPTED' && (
              <Text style={styles.requestedLabel}>친구</Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.white,
  },

  header: {
    height: px(72),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: px(spacing.lg),
    paddingVertical: px(spacing.lg),
    gap: px(spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },

  backButton: {
    width: px(34),
    height: px(34),
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBox: {
    flex: 1,
    height: px(40),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: px(spacing.lg),
    borderRadius: px(radius.lg),
    borderWidth: 1,
    borderColor: colors.surface.default,
    backgroundColor: colors.surface.default,
  },

  searchInput: {
    flex: 1,
    fontSize: px(14),
    fontFamily: fontFamily.regular,
    color: colors.text.basic,
    padding: 0,
  },

  listContent: {
    paddingHorizontal: px(spacing.lg),
    paddingBottom: px(spacing['2xl']),
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: px(spacing.md),
  },

  profileGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },

  requestButton: {
    paddingHorizontal: px(spacing.md),
    paddingVertical: px(spacing.s),
    borderRadius: px(radius.md),
    backgroundColor: colors.brand.secondary,
  },

  requestButtonText: {
    fontSize: px(13),
    fontFamily: fontFamily.semiBold,
    color: colors.text.inverse,
  },

  requestedLabel: {
    fontSize: px(13),
    fontFamily: fontFamily.medium,
    color: colors.text.tertiary,
  },

  profile: {
    width: px(40),
    height: px(40),
    borderRadius: px(radius.lg),
    backgroundColor: colors.surface.default,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },

  profileImage: {
    width: '100%',
    height: '100%',
  },

  userName: {
    marginLeft: px(spacing.lg),
    fontSize: px(16),
    fontFamily: fontFamily.semiBold,
    color: colors.text.basic,
  },
});
