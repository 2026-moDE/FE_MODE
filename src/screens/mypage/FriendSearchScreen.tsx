import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, StatusBar, TouchableOpacity, TextInput, FlatList, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

import {searchUsers, sendFriendRequest, FriendStatus} from '../../api/friend';
import {isBlockedError} from '../../api/block';
import {useToast} from '../../components/common/Toast';
import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconSearch from '../../assets/icons/IconSearch';
import ProfileAvatar from '../../components/common/ProfileAvatar';


type SearchResultUser = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  friendStatus: FriendStatus;
};

export default function FriendSearchScreen() {
  const navigation = useNavigation<any>();
  const {showToast} = useToast();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchResultUser[]>([]);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keywordRef = useRef(keyword);

  useEffect(() => {
    keywordRef.current = keyword;
  }, [keyword]);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const runSearch = useCallback(async (trimmed: string) => {
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

    debounceRef.current = setTimeout(() => {
      runSearch(trimmed);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [keyword, runSearch]);

  // 프로필 화면 등을 다녀오면 friend_status가 바뀌었을 수 있어 focus될 때마다 재검색
  useFocusEffect(
    useCallback(() => {
      const trimmed = keywordRef.current.trim();

      if (trimmed) {
        runSearch(trimmed);
      }
    }, [runSearch]),
  );

  const handleSendRequest = async (id: number) => {
    try {
      await sendFriendRequest(id);
      setResults(prev =>
        prev.map(user => (user.id === id ? {...user, friendStatus: 'PENDING'} : user)),
      );
    } catch (error) {
      console.log('[친구 요청 전송 실패]', error);

      // 차단 관계면 서버가 403
      if (isBlockedError(error)) {
        showToast('차단한 사용자에게는 친구 요청을 보낼 수 없습니다');
      }
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
          <IconArrowLeft size={20} color={colors.icon.basic} />
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
          <IconSearch size={16} color={colors.icon.tertiary} />
        </View>
      </View>

      <FlatList
        data={results}
        extraData={results}
        keyExtractor={item => String(item.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        renderItem={({item}: {item: SearchResultUser}) => (
          <View style={styles.userRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.profileGroup}
              onPress={() => navigation.navigate('UserMyPage', {userId: item.id})}>
              <View style={styles.profile}>
                <ProfileAvatar
                  profileImageUrl={item.profileImageUrl}
                  style={styles.profileImage}
                />
              </View>

              <Text style={styles.userName}>{item.nickname}</Text>
            </TouchableOpacity>

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
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },

  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBox: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.default,
    backgroundColor: colors.surface.default,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.text.basic,
    padding: 0,
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },

  profileGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },

  requestButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s,
    borderRadius: radius.md,
    backgroundColor: colors.brand.secondary,
  },

  requestButtonText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.text.inverse,
  },

  requestedLabel: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.text.tertiary,
  },

  profile: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
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
    marginLeft: spacing.lg,
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    color: colors.text.basic,
  },
});
