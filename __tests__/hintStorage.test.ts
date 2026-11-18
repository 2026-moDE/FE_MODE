import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  countCollectionHintShown,
  getCollectionHintState,
  markCollectionHintSeen,
  shouldShowCollectionHint,
  MAX_COLLECTION_HINT_VIEWS,
} from '../src/storage/hintStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('도감을 누르지 않아도 정해진 횟수만큼만 노출하고 접는다', () => {
  expect(shouldShowCollectionHint({seen: false, shownCount: 0})).toBe(true);
  expect(
    shouldShowCollectionHint({
      seen: false,
      shownCount: MAX_COLLECTION_HINT_VIEWS - 1,
    }),
  ).toBe(true);
  expect(
    shouldShowCollectionHint({
      seen: false,
      shownCount: MAX_COLLECTION_HINT_VIEWS,
    }),
  ).toBe(false);
});

test('도감을 한 번 누르면 노출 횟수가 남아 있어도 더 띄우지 않는다', () => {
  expect(shouldShowCollectionHint({seen: true, shownCount: 0})).toBe(false);
});

test('마이페이지를 반복해서 열면 MAX번째까지만 뜬다', async () => {
  const shown: boolean[] = [];

  // 실제 화면이 포커스될 때마다 하는 일과 같은 순서로 돌린다
  for (let visit = 0; visit < MAX_COLLECTION_HINT_VIEWS + 2; visit += 1) {
    const state = await getCollectionHintState();
    const show = shouldShowCollectionHint(state);

    shown.push(show);

    if (show) {
      await countCollectionHintShown(state.shownCount);
    }
  }

  expect(shown).toEqual([true, true, true, false, false]);
  expect((await getCollectionHintState()).shownCount).toBe(
    MAX_COLLECTION_HINT_VIEWS,
  );
});

test('노출 도중 도감을 누르면 그 뒤로는 뜨지 않는다', async () => {
  const first = await getCollectionHintState();
  expect(shouldShowCollectionHint(first)).toBe(true);
  await countCollectionHintShown(first.shownCount);

  await markCollectionHintSeen();

  expect(shouldShowCollectionHint(await getCollectionHintState())).toBe(false);
});

test('저장된 값이 없으면 노출 횟수를 0으로 읽는다', async () => {
  expect(await getCollectionHintState()).toEqual({seen: false, shownCount: 0});
});
