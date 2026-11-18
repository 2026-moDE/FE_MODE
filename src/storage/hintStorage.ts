import AsyncStorage from '@react-native-async-storage/async-storage';

// 한 번 보여주고 끝나는 안내 말풍선들의 노출 상태. 서버에 둘 값이 아니라
// 기기별로만 기억하면 되므로 AsyncStorage에 둔다
const COLLECTION_HINT_SEEN_KEY = 'HINT_SEEN_PIECE_COLLECTION';
const COLLECTION_HINT_COUNT_KEY = 'HINT_COUNT_PIECE_COLLECTION';

// 도감을 끝내 누르지 않는 사용자에게도 안내가 영원히 남지 않도록,
// 이 횟수만큼 노출하고 나면 더는 띄우지 않는다
export const MAX_COLLECTION_HINT_VIEWS = 3;

export type CollectionHintState = {
  // 도감을 눌러서 안내 목적이 달성된 경우
  seen: boolean;
  shownCount: number;
};

export const getCollectionHintState =
  async (): Promise<CollectionHintState> => {
    const entries = await AsyncStorage.multiGet([
      COLLECTION_HINT_SEEN_KEY,
      COLLECTION_HINT_COUNT_KEY,
    ]);

    const values = Object.fromEntries(entries);

    return {
      seen: values[COLLECTION_HINT_SEEN_KEY] === 'true',
      shownCount: Number(values[COLLECTION_HINT_COUNT_KEY]) || 0,
    };
  };

// 도감을 눌렀으면 목적이 달성됐으므로 노출 횟수와 무관하게 끝낸다
export const shouldShowCollectionHint = ({
  seen,
  shownCount,
}: CollectionHintState) => !seen && shownCount < MAX_COLLECTION_HINT_VIEWS;

export const markCollectionHintSeen = async () => {
  await AsyncStorage.setItem(COLLECTION_HINT_SEEN_KEY, 'true');
};

// 방금 읽은 값을 넘겨받아 올린다. 다시 읽고 쓰면 화면이 연달아 포커스될 때 같은 값을 덮어쓴다
export const countCollectionHintShown = async (shownCount: number) => {
  await AsyncStorage.setItem(COLLECTION_HINT_COUNT_KEY, String(shownCount + 1));
};
