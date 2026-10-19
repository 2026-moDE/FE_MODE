import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

import {fetchBlockedUsers, unblockUser, type BlockedUser} from '../../api/block';
import {notifyBlockChanged} from '../../store/blockEvents';
import {formatKstDate} from '../../utils/date';
import {fontFamily, typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import Header from '../../components/common/Header';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import UserBlockModal from '../../components/mypage/UserBlockModal';
import {useToast} from '../../components/common/Toast';

function BlockedUserItem({
  item,
  onPressUnblock,
}: {
  item: BlockedUser;
  onPressUnblock: (user: BlockedUser) => void;
}) {
  return (
    <View style={styles.userRow}>
      <View style={styles.profileGroup}>
        <View style={styles.profile}>
          <ProfileAvatar
            profileImageUrl={item.profile_image_url}
            style={styles.profileImage}
          />
        </View>

        <View style={styles.userTexts}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.nickname}
          </Text>
          <Text style={styles.blockedAt}>{formatKstDate(item.blocked_at)} 차단</Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.unblockButton}
        onPress={() => onPressUnblock(item)}>
        <Text style={styles.unblockButtonText}>차단 해제</Text>
      </TouchableOpacity>
    </View>
  );
}

// 설정 > 차단한 사용자. 최근 차단순으로 서버가 정렬해서 주고 페이지네이션은 없다
export default function BlockedUsersScreen() {
  const navigation = useNavigation();
  const {showToast} = useToast();

  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unblockTarget, setUnblockTarget] = useState<BlockedUser | null>(null);

  const loadBlocks = useCallback(async () => {
    try {
      const data = await fetchBlockedUsers();
      setBlocks(data);
    } catch (error) {
      console.log('[차단 목록 조회 실패]', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBlocks();
    }, [loadBlocks]),
  );

  const handleUnblockConfirm = async () => {
    if (!unblockTarget) return;

    const target = unblockTarget;
    setUnblockTarget(null);

    try {
      await unblockUser(target.user_id);
      setBlocks(prev => prev.filter(user => user.user_id !== target.user_id));

      // 해제하면 그 사용자 콘텐츠가 다시 보여야 하니 캐시를 쓰는 화면들도 재조회
      notifyBlockChanged();

      showToast('차단을 해제했습니다');
    } catch (error) {
      console.log('[차단 해제 실패]', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.white} />

      <Header title="차단한 사용자" onBack={() => navigation.goBack()} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.secondary} />
        </View>
      ) : (
        <FlatList
          data={blocks}
          keyExtractor={item => String(item.user_id)}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            blocks.length === 0 && styles.listContentEmpty,
          ]}
          renderItem={({item}: {item: BlockedUser}) => (
            <BlockedUserItem item={item} onPressUnblock={setUnblockTarget} />
          )}
          // 심사자가 차단한 사용자 없이 들어와도 화면이 비어 보이지 않게
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>차단한 사용자가 없습니다</Text>
              <Text style={styles.emptyDescription}>
                프로필의 ⋮ 메뉴에서 사용자를 차단할 수 있어요
              </Text>
            </View>
          }
        />
      )}

      <UserBlockModal
        visible={unblockTarget !== null}
        mode="unblock"
        nickname={unblockTarget?.nickname ?? ''}
        onClose={() => setUnblockTarget(null)}
        onConfirm={handleUnblockConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.white,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingTop: spacing.s,
    paddingBottom: spacing['2xl'],
  },

  listContentEmpty: {
    flexGrow: 1,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.white,
  },

  profileGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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

  userTexts: {
    flex: 1,
    marginLeft: spacing.lg,
    marginRight: spacing.s,
  },

  userName: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    color: colors.text.basic,
  },

  blockedAt: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.text.tertiary,
  },

  unblockButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.button.tertiaryFill,
  },

  unblockButtonText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.text.basic,
  },

  emptyTitle: {
    ...typography.b4,
    color: colors.text.tertiary,
  },

  emptyDescription: {
    marginTop: spacing.s,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.text.disabled,
  },
});
