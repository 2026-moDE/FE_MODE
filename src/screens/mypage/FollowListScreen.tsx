import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, Text, StyleSheet, StatusBar, TouchableOpacity, Pressable, TextInput, FlatList, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {AppStackParamList} from '../../types/navigation';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';

import {
  acceptFriendRequest,
  deleteFriend,
  fetchFriendRequests,
  fetchFriends,
  rejectFriendRequest,
} from '../../api/friend';
import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {gap, spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconSearch from '../../assets/icons/IconSearch';
import IconFriendAdd from '../../assets/icons/IconFriendAdd';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import FriendDeleteModal from '../../components/mypage/FriendDeleteModal';


type FriendTab = 'friends' | 'requests';

type FriendUser = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
};

const DELETE_ACTION_WIDTH = 64;

function FriendListItem({
  item,
  isOpen,
  onOpenChange,
  onDelete,
  onPress,
}: {
  item: FriendUser;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDelete: (id: number) => void;
  onPress: (item: FriendUser) => void;
}) {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  useEffect(() => {
    if (!isOpen) {
      translateX.value = withTiming(0);
    }
  }, [isOpen, translateX]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate(event => {
      translateX.value = Math.min(
        0,
        Math.max(-DELETE_ACTION_WIDTH, startX.value + event.translationX),
      );
    })
    .onEnd(() => {
      const shouldOpen = translateX.value < -DELETE_ACTION_WIDTH / 2;
      translateX.value = withTiming(shouldOpen ? -DELETE_ACTION_WIDTH : 0);
      runOnJS(onOpenChange)(shouldOpen);
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (isOpen) {
      runOnJS(onOpenChange)(false);
    } else {
      runOnJS(onPress)(item);
    }
  });

  const rowGesture = Gesture.Race(panGesture, tapGesture);

  const rowAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      translateX.value,
      [-DELETE_ACTION_WIDTH, 0],
      [colors.surface.default, colors.background.white],
    ),
  }));

  const nameAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      translateX.value,
      [-DELETE_ACTION_WIDTH, 0],
      [colors.text.disabled, colors.text.basic],
    ),
  }));

  const deleteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value + DELETE_ACTION_WIDTH}],
  }));

  return (
    <View style={styles.rowContainer}>
      <GestureDetector gesture={rowGesture}>
        <Reanimated.View style={[styles.userRow, rowAnimatedStyle]}>
          <View style={styles.profile}>
            <ProfileAvatar
              profileImageUrl={item.profileImageUrl}
              style={styles.profileImage}
            />
          </View>

          <Reanimated.Text style={[styles.userName, nameAnimatedStyle]}>
            {item.nickname}
          </Reanimated.Text>
        </Reanimated.View>
      </GestureDetector>

      <Reanimated.View style={[styles.deleteAction, deleteAnimatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.deleteButton}
          onPress={() => onDelete(item.id)}>
          <Text style={styles.deleteText}>삭제</Text>
        </TouchableOpacity>
      </Reanimated.View>
    </View>
  );
}

function FriendRequestItem({
  item,
  onAccept,
  onReject,
  onPress,
}: {
  item: FriendUser;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  // 요청 온 사람도 수락 전에 프로필을 보고 판단할 수 있어야 함 - 친구 목록과 동일하게 이동
  onPress: (user: FriendUser) => void;
}) {
  return (
    <View style={styles.requestRow}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.profileGroup}
        onPress={() => onPress(item)}>
        <View style={styles.profile}>
          <ProfileAvatar
            profileImageUrl={item.profileImageUrl}
            style={styles.profileImage}
          />
        </View>

        <Text style={styles.userName}>{item.nickname}</Text>
      </TouchableOpacity>

      <View style={styles.requestActions}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.acceptButton}
          onPress={() => onAccept(item.id)}>
          <Text style={styles.acceptButtonText}>수락하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.rejectButton}
          onPress={() => onReject(item.id)}>
          <Text style={styles.rejectButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FollowListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppStackParamList, 'FollowList'>>();
  const [activeTab, setActiveTab] = useState<FriendTab>(route.params?.initialTab ?? 'friends');

  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendUser[]>([]);
  const [openFriendId, setOpenFriendId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const loadFriends = useCallback(async () => {
    try {
      const data = await fetchFriends();
      setFriends(
        data.map(friend => ({
          id: friend.user_id,
          nickname: friend.nickname,
          profileImageUrl: friend.profile_image_url,
        })),
      );
    } catch (error) {
      console.log('[친구 목록 조회 실패]', error);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      const data = await fetchFriendRequests();
      setRequests(
        data.map(request => ({
          id: request.user_id,
          nickname: request.nickname,
          profileImageUrl: request.profile_image_url,
        })),
      );
    } catch (error) {
      console.log('[받은 친구 요청 목록 조회 실패]', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFriends();
      loadRequests();
    }, [loadFriends, loadRequests]),
  );

  const users = activeTab === 'friends' ? friends : requests;

  const filteredUsers = useMemo(() => {
    if (activeTab !== 'friends') {
      return users;
    }

    const trimmed = keyword.trim();

    if (!trimmed) {
      return users;
    }

    return users.filter(user => user.nickname.includes(trimmed));
  }, [users, keyword, activeTab]);

  const handleDeleteRequest = (id: number) => {
    setOpenFriendId(null);
    setDeleteTargetId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetId === null) {
      return;
    }

    const id = deleteTargetId;
    setDeleteTargetId(null);

    try {
      await deleteFriend(id);
      setFriends(prev => prev.filter(user => user.id !== id));
    } catch (error) {
      console.log('[친구 취소 실패]', error);
    }
  };

  const handleAcceptRequest = async (id: number) => {
    try {
      await acceptFriendRequest(id);
      setRequests(prev => {
        const accepted = prev.find(user => user.id === id);
        if (accepted) {
          setFriends(friendsPrev => [...friendsPrev, accepted]);
        }
        return prev.filter(user => user.id !== id);
      });
    } catch (error) {
      console.log('[친구 요청 수락 실패]', error);
    }
  };

  const handleRejectRequest = async (id: number) => {
    try {
      await rejectFriendRequest(id);
      setRequests(prev => prev.filter(user => user.id !== id));
    } catch (error) {
      console.log('[친구 요청 거절 실패]', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.white} />

      <Pressable style={styles.flexFill} onPress={() => setOpenFriendId(null)}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerButton}
            onPress={() => navigation.goBack()}>
            <IconArrowLeft size={20} color={colors.icon.basic} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>친구</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerButton}
            onPress={() => navigation.navigate('FriendSearch')}>
            <IconFriendAdd size={22} color={colors.icon.basic} />
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

        {activeTab === 'friends' && (
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="닉네임을 검색해주세요"
              placeholderTextColor={colors.text.tertiary}
              value={keyword}
              onChangeText={setKeyword}
            />
            <IconSearch size={16} color={colors.icon.tertiary} />
          </View>
        )}

        <Text style={styles.listLabel}>{activeTab === 'friends' ? '친구 목록' : '친구 요청'}</Text>

        <FlatList
          data={filteredUsers}
          extraData={openFriendId}
          keyExtractor={item => String(item.id)}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({item}: {item: FriendUser}) =>
            activeTab === 'friends' ? (
              <FriendListItem
                item={item}
                isOpen={item.id === openFriendId}
                onOpenChange={isOpen => setOpenFriendId(isOpen ? item.id : null)}
                onDelete={handleDeleteRequest}
                onPress={friend =>
                  navigation.navigate('UserMyPage', {
                    userId: friend.id,
                  })
                }
              />
            ) : (
              <FriendRequestItem
                item={item}
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
                onPress={friend =>
                  navigation.navigate('UserMyPage', {
                    userId: friend.id,
                  })
                }
              />
            )
          }
        />
      </Pressable>

      <FriendDeleteModal
        visible={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onDelete={handleDeleteConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.white,
  },

  flexFill: {
    flex: 1,
  },

  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },

  headerButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.text.basic,
  },

  tabRow: {
    flexDirection: 'row',
    width: '100%',
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border.default,
  },

  tabItemActive: {
    borderBottomColor: colors.border.black,
  },

  tabLabel: {
    fontSize: 15,
    fontFamily: fontFamily.medium,
    color: colors.text.tertiary,
  },

  tabLabelActive: {
    fontFamily: fontFamily.bold,
    color: colors.text.basic,
  },

  searchBox: {
    marginHorizontal: spacing.lg,
    marginTop: 20,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.white,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.text.basic,
    padding: 0,
  },

  listLabel: {
    marginTop: gap['2xl'],
    marginBottom: spacing.lg,
    marginHorizontal: spacing['2xl'],
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.text.tertiary,
  },

  list: {
    flex: 1,
    marginTop: (-spacing.md),
  },

  listContent: {
    paddingBottom: spacing['2xl'],
  },

  rowContainer: {
    overflow: 'hidden',
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.white,
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

  deleteAction: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 64,
    backgroundColor: colors.brand.secondary,
  },

  deleteButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: colors.text.inverse,
  },

  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.white,
  },

  profileGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },

  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  acceptButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s,
    borderRadius: radius.md,
    backgroundColor: colors.brand.secondary,
  },

  acceptButtonText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.text.inverse,
  },

  rejectButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rejectButtonText: {
    fontSize: 18,
    fontFamily: fontFamily.regular,
    color: colors.icon.subtle,
  },
});
