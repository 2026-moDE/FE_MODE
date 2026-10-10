import React, {useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {padding, gap} from '../../constants/spacing';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconChevronDown from '../../assets/icons/IconChevronDown';
import IconFriend from '../../assets/icons/IconFriend';
import IconArchive from '../../assets/icons/IconArchive';
import type {MyProfile} from '../../api/mypage';
import type {Piece, PiecePlacement} from '../../api/piece';
import ProfileAvatar from '../common/ProfileAvatar';
import PieceBoard from './PieceBoard';

const settingIcon = require('../../assets/image/setting.png');
const menuIcon = require('../../assets/image/vertical_ellipis.png');

// 시안 393x852 기준 (node 2859:4632)
const BOARD_HEIGHT = 448;
// 보드 상단(48)이 세이프에어리어 상단(59)보다 11 위에서 시작한다
const BOARD_TOP_LIFT = 11;
// 보드 안쪽 헤더 아이콘 줄 (화면 기준 67 - 보드 상단 48)
const HEADER_ICON_TOP = 19;
// 빈 상태 묶음 (화면 기준 239 - 보드 상단 48)
const EMPTY_STATE_TOP = 191;
// 프로필 사진이 보드 아래 모서리에 걸치는 깊이 (보드 하단 496 - 사진 상단 461)
const AVATAR_SIZE = 78;
const AVATAR_OVERLAP = 35;
// 사진 아래 12 간격으로 닉네임 줄이 온다
const IDENTITY_TOP = AVATAR_OVERLAP + gap.md;

const BOARD_PADDING = padding.lg;
const BOARD_GRADIENT_TOP = 'rgba(27, 33, 41, 0)';

type ProfileInfo = Pick<
  MyProfile,
  'nickname' | 'profile_image_url' | 'profile_url' | 'friend_count'
>;

type Props = {
  profile: ProfileInfo | null;
  isProfileLoading: boolean;
  pieces: Piece[];
  // 조각이 다시 떨어지는 애니메이션을 재생시키려고 보드를 통째로 새로 마운트하는 데 쓴다
  boardRunId: number;
  onPressBack: () => void;
  onPressSettings?: () => void;
  // 없으면 친구 수를 눌러도 갈 곳이 없다는 뜻 - 화살표를 숨기고 탭도 막는다 (남의 프로필)
  onPressFriends?: () => void;
  // 남의 프로필에서는 조각을 모으러 갈 수 없어서 빈 상태 버튼을 숨긴다
  onPressCollect?: () => void;
  // 이미 친구인 상대 프로필에서 닉네임 앞에 별 배지를 띄운다
  isFriend?: boolean;
  showSettings?: boolean;
  // 친구 프로필에서만 넘겨줌 - 있으면 설정 톱니 대신 ⋮ 메뉴 버튼을 보여준다.
  // 드롭다운이 버튼 바로 밑에 붙도록 실제 화면 좌표를 같이 넘긴다
  onPressMenu?: (anchor: {top: number; right: number}) => void;
  // 남의 보드는 보기만 가능
  readOnly?: boolean;
  onPlacePieces: (placements: PiecePlacement[]) => void;
  onEditPiece: (piece: Piece) => void;
};

export default function PieceProfileHeader({
  profile,
  isProfileLoading,
  pieces,
  boardRunId,
  onPressBack,
  onPressSettings,
  onPressFriends,
  onPressCollect,
  onPlacePieces,
  onEditPiece,
  isFriend = false,
  showSettings = true,
  onPressMenu,
  readOnly = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const [boardWidth, setBoardWidth] = React.useState(0);
  const menuButtonRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  const boardTop = Math.max(insets.top - BOARD_TOP_LIFT, 0);

  const handlePressMenu = () => {
    menuButtonRef.current?.measureInWindow(
      (x: number, y: number, width: number, height: number) => {
        onPressMenu?.({
          top: y + height,
          right: Dimensions.get('window').width - (x + width),
        });
      },
    );
  };

  return (
    <View>
      <LinearGradient
        colors={[BOARD_GRADIENT_TOP, colors.surface.subtle]}
        style={[styles.board, {marginTop: boardTop}]}
        onLayout={event =>
          setBoardWidth(event.nativeEvent.layout.width - BOARD_PADDING * 2)
        }>
        {pieces.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>아직 모은 조각이 없어요</Text>

            {!!onPressCollect && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.emptyButton}
                onPress={onPressCollect}>
                <IconArchive size={16} color={colors.icon.inverse} />
                <Text style={styles.emptyButtonText}>리뷰쓰고 조각 모으기</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          boardWidth > 0 && (
            <View style={styles.boardInner}>
              <PieceBoard
                key={boardRunId}
                pieces={pieces}
                width={boardWidth}
                height={BOARD_HEIGHT - HEADER_ICON_TOP}
                onPlacePieces={onPlacePieces}
                onEditPiece={onEditPiece}
                readOnly={readOnly}
              />
            </View>
          )
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.iconButton, styles.backButton]}
          onPress={onPressBack}
          hitSlop={12}>
          <IconArrowLeft size={20} color={colors.icon.inverse} />
        </TouchableOpacity>

        {onPressMenu ? (
          <TouchableOpacity
            ref={menuButtonRef}
            activeOpacity={0.7}
            style={[styles.iconButton, styles.settingButton]}
            onPress={handlePressMenu}
            hitSlop={12}>
            <Image source={menuIcon} style={styles.settingIcon} resizeMode="contain" />
          </TouchableOpacity>
        ) : (
          showSettings && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.iconButton, styles.settingButton]}
              onPress={onPressSettings}
              hitSlop={12}>
              <Image
                source={settingIcon}
                style={styles.settingIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )
        )}
      </LinearGradient>

      {/* 보드 아래 모서리에 걸치는 프로필 사진 */}
      <View style={[styles.avatar, {top: boardTop + BOARD_HEIGHT - AVATAR_OVERLAP}]}>
        <ProfileAvatar
          profileUrl={profile?.profile_url}
          profileImageUrl={profile?.profile_image_url}
          style={styles.avatarImage}
        />
      </View>

      <View style={styles.identityRow}>
        {isProfileLoading && !profile ? (
          <ActivityIndicator size="small" color={colors.icon.inverse} />
        ) : (
          <View style={styles.nicknameRow}>
            {isFriend && <IconFriend size={24} color={colors.icon.brand} />}
            <Text style={[styles.nickname, isFriend && styles.nicknameFriend]}>
              {profile?.nickname ?? '닉네임'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.friendRow}
          disabled={!onPressFriends}
          onPress={onPressFriends}>
          <Text style={styles.friendLabel}>친구</Text>
          <Text style={styles.friendCount}>{profile?.friend_count ?? 0}</Text>
          {/* 이동할 곳이 있을 때만 화살표 - 없으면 눌리는 것처럼 보이기만 한다 */}
          {!!onPressFriends && (
            <IconChevronDown
              size={16}
              color={colors.icon.inverse}
              style={styles.friendArrow}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    width: '100%',
    height: BOARD_HEIGHT,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },

  // 위로는 헤더 아이콘 줄만 피한다.
  // 아래는 프로필 사진이 걸치지만 사진이 왼쪽 일부에만 있어서, 그만큼 비우면 조각이
  // 가운데로 몰려 보인다 - 바닥까지 쓰고 왼쪽 아래 조각이 사진에 조금 겹치게 둔다
  boardInner: {
    position: 'absolute',
    left: BOARD_PADDING,
    right: BOARD_PADDING,
    top: HEADER_ICON_TOP,
    bottom: 0,
  },

  emptyState: {
    position: 'absolute',
    top: EMPTY_STATE_TOP,
    alignSelf: 'center',
    alignItems: 'center',
    gap: gap.md,
  },

  emptyText: {
    ...typography.b6,
    color: colors.text.disabled,
    textAlign: 'center',
    includeFontPadding: false,
  },

  emptyButton: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: gap.sm,
    paddingHorizontal: padding.md,
    borderRadius: radius.full,
    backgroundColor: colors.button.secondaryFill,
  },

  emptyButtonText: {
    ...typography.b5,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  iconButton: {
    position: 'absolute',
    top: HEADER_ICON_TOP,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButton: {
    left: padding.lg,
  },

  settingButton: {
    right: padding.lg,
  },

  settingIcon: {
    width: 20,
    height: 20,
    tintColor: colors.icon.inverse,
  },

  avatar: {
    position: 'absolute',
    left: padding.lg,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.surface.default,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },

  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },

  identityRow: {
    marginTop: IDENTITY_TOP,
    marginHorizontal: padding.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  nickname: {
    ...typography.h1,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  nicknameFriend: {
    color: colors.icon.brand,
  },

  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.sm,
  },

  friendLabel: {
    ...typography.b5,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  friendCount: {
    ...typography.b6,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  friendArrow: {
    marginLeft: gap.xs,
    transform: [{rotate: '-90deg'}],
  },
});
