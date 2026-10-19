/**
 * 사용자 차단 플로우 (App Store 가이드라인 1.2) 스모크 테스트
 * @format
 */

import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';

const mockGoBack = jest.fn();
// 실제 useNavigation은 같은 객체를 돌려준다 - 렌더마다 새로 만들면 useFocusEffect가 계속 다시 돈다
const mockNavigation = {goBack: mockGoBack, navigate: jest.fn()};

jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({params: {userId: 7}}),
  // 테스트에서는 포커스 콜백을 마운트 시 한 번만 돌려주면 충분하다
  useFocusEffect: (callback: () => void) => {
    const {useEffect} = require('react');
    useEffect(callback, [callback]);
  },
}));

// 차단 로직만 보려는 테스트라, 네이티브 의존성(지도/스킨/바텀시트/FastImage)을 끌고 오는
// 무거운 자식 컴포넌트는 눌릴 자리만 남겨두고 전부 스텁으로 바꾼다
jest.mock('../src/components/mypage/PieceProfileHeader', () => {
  const React_ = require('react');
  const {Pressable: P, Text: T} = require('react-native');

  return function PieceProfileHeaderStub({onPressMenu}: any) {
    return React_.createElement(
      P,
      {onPress: () => onPressMenu?.({top: 0, right: 0})},
      React_.createElement(T, null, '메뉴열기'),
    );
  };
});

jest.mock('../src/components/mypage/FriendActionButton', () => {
  const React_ = require('react');
  const {Pressable: P, Text: T} = require('react-native');

  return function FriendActionButtonStub({onPressRequest}: any) {
    return React_.createElement(
      P,
      {onPress: onPressRequest},
      React_.createElement(T, null, '친구 요청'),
    );
  };
});

jest.mock('../src/components/mypage/RecentReviewSection', () => () => null);
jest.mock('../src/components/mypage/FriendLiveReviewSection', () => () => null);
jest.mock('../src/components/common/ProfileAvatar', () => () => null);

jest.mock('../src/api/block');
jest.mock('../src/api/user');
jest.mock('../src/api/friend');
jest.mock('../src/api/piece');

import {ToastProvider} from '../src/components/common/Toast';
import UserBlockModal from '../src/components/mypage/UserBlockModal';
import BlockedUsersScreen from '../src/screens/mypage/BlockedUsersScreen';
import UserMyPageScreen from '../src/screens/mypage/UserMyPageScreen';
import FriendProfileMenu from '../src/components/mypage/FriendProfileMenu';
import * as blockApi from '../src/api/block';
import * as userApi from '../src/api/user';
import * as friendApi from '../src/api/friend';
import * as pieceApi from '../src/api/piece';
import {useOnBlockChange} from '../src/store/blockEvents';

const blockMock = blockApi as jest.Mocked<typeof blockApi>;
const userMock = userApi as jest.Mocked<typeof userApi>;
const friendMock = friendApi as jest.Mocked<typeof friendApi>;
const pieceMock = pieceApi as jest.Mocked<typeof pieceApi>;

// axios 인스턴스를 거치지 않으므로 403 판정은 실제 구현을 그대로 쓴다
const {isBlockedError: realIsBlockedError} = jest.requireActual('../src/api/block');

const blockedError = {
  isAxiosError: true,
  response: {status: 403, data: {success: false, message: 'blocked', data: null}},
};

const profile = {
  id: 7,
  nickname: '커피조아',
  profile_image_url: null,
  profile_url: null,
  friend_count: 0,
  review_count: 0,
  is_friend: false,
  friend_status: 'NONE' as const,
};

// 한 요소가 품고 있는 모든 문자열을 이어붙인다
// ({formatKstDate(...)} 차단처럼 조각으로 나뉘어 렌더되는 문구도 한 덩어리로 보기 위함)
function flatText(node: ReactTestRenderer.ReactTestInstance): string {
  const walk = (children: unknown): string => {
    if (typeof children === 'string') return children;
    if (typeof children === 'number') return String(children);
    if (Array.isArray(children)) return children.map(walk).join('');

    const element = children as {props?: {children?: unknown}} | null;
    if (element && typeof element === 'object' && element.props) {
      return walk(element.props.children);
    }

    return '';
  };

  return walk(node.props.children);
}

function hasText(tree: ReactTestRenderer.ReactTestRenderer, needle: string): boolean {
  return tree.root.findAllByType(Text).some(node => flatText(node).includes(needle));
}

// 라벨이 들어 있는 누를 수 있는 요소를 찾아 누른다
// (Pressable/TouchableOpacity는 memo+forwardRef라 타입으로 못 찾아서 onPress 유무로 찾는다)
async function pressByLabel(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const candidates = tree.root
    .findAll(node => typeof node.props?.onPress === 'function', {deep: true})
    .filter(node =>
      node.findAllByType(Text).some(text => flatText(text).includes(label)),
    );

  // 라벨을 품은 가장 안쪽(= 가장 작은) 요소를 고른다 - 바깥 래퍼까지 잡히지 않게
  const target = candidates.sort(
    (a, b) => a.findAll(() => true).length - b.findAll(() => true).length,
  )[0];

  if (!target) {
    throw new Error(`"${label}" 누를 수 있는 요소를 못 찾음`);
  }

  await act(async () => {
    target.props.onPress();
  });
}

const mountedTrees: ReactTestRenderer.ReactTestRenderer[] = [];

async function render(element: React.ReactElement) {
  let tree!: ReactTestRenderer.ReactTestRenderer;

  await act(async () => {
    tree = ReactTestRenderer.create(<ToastProvider>{element}</ToastProvider>);
  });

  mountedTrees.push(tree);

  return tree;
}

// 트리를 남겨두면 차단 알림 구독(useOnBlockChange)이 다음 테스트까지 살아 있다 -
// 구독 해제가 제대로 되는지도 여기서 같이 확인되는 셈
afterEach(async () => {
  await act(async () => {
    mountedTrees.forEach(tree => tree.unmount());
  });

  mountedTrees.length = 0;
});

const onBlockChanged = jest.fn();

// 지도·탐색·친구 피드·댓글이 쓰는 재조회 구독이 실제로 호출되는지 확인하는 대역
function CacheSubscriber() {
  useOnBlockChange(onBlockChanged);
  return null;
}

beforeEach(() => {
  jest.clearAllMocks();
  blockMock.isBlockedError.mockImplementation(realIsBlockedError);
  pieceMock.getUserPieces.mockResolvedValue({pieces: []} as never);
  userMock.getUserReviews.mockResolvedValue({reviews: [], next_cursor: null});
});

describe('차단 확인 모달', () => {
  it('친구 관계가 끊기고 복구되지 않는다는 걸 안내한다', async () => {
    const tree = await render(
      <UserBlockModal
        visible
        mode="block"
        nickname="커피조아"
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );

    expect(hasText(tree, '커피조아님을 차단할까요?')).toBe(true);
    expect(hasText(tree, '서로의 리뷰와 댓글이 보이지 않습니다')).toBe(true);
    expect(hasText(tree, '친구 관계도 함께 해제되며')).toBe(true);
    expect(hasText(tree, '취소')).toBe(true);
  });

  it('해제 모달은 친구 관계가 복구되지 않는다고 안내한다', async () => {
    const tree = await render(
      <UserBlockModal
        visible
        mode="unblock"
        nickname="커피조아"
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );

    expect(hasText(tree, '커피조아님을 차단 해제할까요?')).toBe(true);
    expect(hasText(tree, '차단을 해제해도 친구 관계는 복구되지 않습니다')).toBe(true);
  });
});

describe('타인 프로필 차단', () => {
  it('친구가 아니어도 ⋮ 메뉴에 차단이 있다', async () => {
    const tree = await render(
      <FriendProfileMenu
        visible
        anchor={{top: 0, right: 0}}
        isFriend={false}
        onClose={jest.fn()}
        onPressReport={jest.fn()}
        onPressBlock={jest.fn()}
        onPressUnfriend={jest.fn()}
      />,
    );

    expect(hasText(tree, '차단')).toBe(true);
    // 친구가 아니면 친구 끊기는 숨긴다
    expect(hasText(tree, '친구 끊기')).toBe(false);
  });

  it('차단하면 토스트 + 캐시 무효화 + 화면 닫기까지 이어진다', async () => {
    userMock.getUserProfile.mockResolvedValue(profile);
    blockMock.blockUser.mockResolvedValue(undefined);

    const tree = await render(
      <>
        <CacheSubscriber />
        <UserMyPageScreen />
      </>,
    );

    // ⋮ → 메뉴의 '차단' → 확인 모달의 '차단'
    await pressByLabel(tree, '메뉴열기');
    await pressByLabel(tree, '차단');
    expect(hasText(tree, '커피조아님을 차단할까요?')).toBe(true);
    expect(blockMock.blockUser).not.toHaveBeenCalled();

    await pressByLabel(tree, '차단');

    expect(blockMock.blockUser).toHaveBeenCalledWith(7);
    expect(onBlockChanged).toHaveBeenCalledTimes(1);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(hasText(tree, '차단했습니다')).toBe(true);
  });

  it('차단된 사용자 프로필에 직접 들어가면 안내하고 되돌아간다', async () => {
    userMock.getUserProfile.mockRejectedValue(blockedError);

    const tree = await render(<UserMyPageScreen />);

    expect(hasText(tree, '차단한 사용자입니다')).toBe(true);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('차단 상태에서 친구 요청을 보내면 토스트로 안내한다', async () => {
    userMock.getUserProfile.mockResolvedValue(profile);
    friendMock.sendFriendRequest.mockRejectedValue(blockedError);

    const tree = await render(<UserMyPageScreen />);

    await pressByLabel(tree, '친구 요청');

    expect(hasText(tree, '차단한 사용자에게는 친구 요청을 보낼 수 없습니다')).toBe(true);
  });
});

describe('설정 > 차단한 사용자', () => {
  it('차단한 사용자가 없으면 빈 상태를 보여준다', async () => {
    blockMock.fetchBlockedUsers.mockResolvedValue([]);

    const tree = await render(<BlockedUsersScreen />);

    expect(hasText(tree, '차단한 사용자가 없습니다')).toBe(true);
  });

  it('목록을 닉네임 + KST 차단일로 보여주고, 해제하면 목록에서 빠진다', async () => {
    blockMock.fetchBlockedUsers.mockResolvedValue([
      {
        user_id: 7,
        nickname: '커피조아',
        profile_image_url: null,
        // UTC 11:00 → KST 20:00, 날짜는 그대로 10/19
        blocked_at: '2026-10-19T11:00:00Z',
      },
      {
        user_id: 8,
        nickname: '늦은밤',
        profile_image_url: null,
        // UTC 18:00 → KST 다음날 03:00이라 10/20으로 보여야 한다
        blocked_at: '2026-10-19T18:00:00Z',
      },
    ]);
    blockMock.unblockUser.mockResolvedValue(undefined);

    const tree = await render(
      <>
        <CacheSubscriber />
        <BlockedUsersScreen />
      </>,
    );

    expect(hasText(tree, '커피조아')).toBe(true);
    expect(hasText(tree, '2026.10.19 차단')).toBe(true);
    expect(hasText(tree, '2026.10.20 차단')).toBe(true);

    // 행의 '차단 해제' → 확인 모달 → 모달의 '차단 해제'
    await pressByLabel(tree, '차단 해제');
    expect(hasText(tree, '커피조아님을 차단 해제할까요?')).toBe(true);

    await pressByLabel(tree, '차단 해제');

    expect(blockMock.unblockUser).toHaveBeenCalledWith(7);
    expect(hasText(tree, '커피조아')).toBe(false);
    expect(hasText(tree, '늦은밤')).toBe(true);
    expect(onBlockChanged).toHaveBeenCalledTimes(1);
    expect(hasText(tree, '차단을 해제했습니다')).toBe(true);
  });
});
