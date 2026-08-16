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
import {useNavigation} from '@react-navigation/native';

import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {gap, spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconSearch from '../../assets/icons/IconSearch';
import IconFriendAdd from '../../assets/icons/IconFriendAdd';

const emptyProfileIcon = require('../../assets/image/empty_profile.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type FriendTab = 'friends' | 'requests';

type FriendUser = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
};

export default function FollowListScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<FriendTab>('friends');
  const [keyword, setKeyword] = useState('');

  // TODO: api 연결 - 친구 목록 / 친구 요청 목록 조회
  const friends: FriendUser[] = [{id: 1, nickname: '서루', profileImageUrl: null}];
  const requests: FriendUser[] = [];

  const users = activeTab === 'friends' ? friends : requests;

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

        <Text style={styles.headerTitle}>친구</Text>

        <TouchableOpacity activeOpacity={0.7} style={styles.headerButton}>
          <IconFriendAdd size={px(22)} color={colors.icon.basic} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.tabItem, activeTab === 'friends' && styles.tabItemActive]}
          onPress={() => setActiveTab('friends')}>
          <Text style={[styles.tabLabel, activeTab === 'friends' && styles.tabLabelActive]}>친구</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.tabItem, activeTab === 'requests' && styles.tabItemActive]}
          onPress={() => setActiveTab('requests')}>
          <Text style={[styles.tabLabel, activeTab === 'requests' && styles.tabLabelActive]}>요청</Text>
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

      <Text style={styles.listLabel}>{activeTab === 'friends' ? '친구 목록' : '받은 요청'}</Text>

      <FlatList
        data={filteredUsers}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({item}: {item: FriendUser}) => (
          <View style={styles.userRow}>
            <View style={styles.profile}>
              <Image
                source={item.profileImageUrl ? {uri: item.profileImageUrl} : emptyProfileIcon}
                style={styles.profileImage}
                resizeMode="cover"
              />
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

  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: px(18),
    color: colors.text.basic,
  },

  tabRow: {
    flexDirection: 'row',
    width: '100%',
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: px(spacing.md),
    borderBottomWidth: 2,
    borderBottomColor: colors.border.default,
  },

  tabItemActive: {
    borderBottomColor: colors.border.black,
  },

  tabLabel: {
    fontSize: px(15),
    fontFamily: fontFamily.medium,
    color: colors.text.tertiary,
  },

  tabLabelActive: {
    fontFamily: fontFamily.bold,
    color: colors.text.basic,
  },

  searchBox: {
    marginHorizontal: px(spacing.lg),
    marginTop: px(20),
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
    marginTop: px(gap['2xl']),
    marginBottom: px(spacing.lg),
    marginHorizontal: px(spacing['2xl']),
    fontSize: px(14),
    fontFamily: fontFamily.medium,
    color: colors.text.tertiary,
  },

  listContent: {
    paddingHorizontal: px(spacing.lg),
    paddingBottom: px(spacing['2xl']),
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: px(spacing.md),
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
