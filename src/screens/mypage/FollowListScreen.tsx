import React, {useMemo, useState} from 'react';
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
import {useNavigation, useRoute} from '@react-navigation/native';

import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconSearch from '../../assets/icons/IconSearch';

const peopleIcon = require('../../assets/image/people.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type FollowListType = 'follower' | 'following';

type FollowUser = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
};

export default function FollowListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const type: FollowListType = route.params?.type ?? 'following';
  const [keyword, setKeyword] = useState('');

  const title = type === 'follower' ? '팔로워' : '팔로잉';

  // TODO: api 연결 - type에 따라 팔로워/팔로잉 목록 조회
  const users: FollowUser[] = [];

  const filteredUsers = useMemo(() => {
    const trimmed = keyword.trim();

    if (!trimmed) {
      return users;
    }

    return users.filter(user => user.nickname.includes(trimmed));
  }, [users, keyword]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.white} />

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <IconArrowLeft size={px(20)} color={colors.icon.basic} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{title}</Text>

        <TouchableOpacity activeOpacity={0.7} style={styles.headerButton}>
          <Image source={peopleIcon} style={styles.peopleIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="닉네임을 검색해주세요"
          placeholderTextColor={colors.text.tertiary}
          value={keyword}
          onChangeText={setKeyword}
        />
        <IconSearch size={px(16)} color={colors.icon.tertiary} />
      </View>

      <Text style={styles.listLabel}>{title}</Text>

      <FlatList
        data={filteredUsers}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({item}: {item: FollowUser}) => (
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              {item.profileImageUrl ? (
                <Image
                  source={{uri: item.profileImageUrl}}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : null}
            </View>

            <Text style={styles.userName}>{item.nickname}</Text>
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
    height: px(54),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: px(spacing.lg),
  },

  headerButton: {
    width: px(34),
    height: px(34),
    alignItems: 'center',
    justifyContent: 'center',
  },

  peopleIcon: {
    width: px(24),
    height: px(24),
  },

  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: px(18),
    color: colors.text.basic,
  },

  searchBox: {
    marginHorizontal: px(spacing['2xl']),
    marginTop: px(spacing.sm),
    height: px(40),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: px(spacing.lg),
    borderRadius: px(radius.lg),
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.white,
  },

  searchInput: {
    flex: 1,
    fontSize: px(14),
    fontFamily: fontFamily.regular,
    color: colors.text.disabled,
    padding: 0,
  },

  listLabel: {
    marginTop: px(spacing.xl),
    marginBottom: px(spacing.sm),
    marginHorizontal: px(spacing['2xl']),
    fontSize: px(14),
    fontFamily: fontFamily.medium,
    color: colors.text.tertiary,
  },

  listContent: {
    paddingHorizontal: px(spacing['2xl']),
    paddingBottom: px(spacing['2xl']),
  },

  separator: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: px(spacing.md),
  },

  avatar: {
    width: px(40),
    height: px(40),
    borderRadius: px(radius.full),
    backgroundColor: colors.surface.default,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  userName: {
    marginLeft: px(spacing.md),
    fontSize: px(14),
    fontFamily: fontFamily.medium,
    color: colors.text.basic,
  },
});
