import {getActivePieces, PIECE_LIFETIME_MS} from '../src/utils/pieceExpiry';

const createdAt = '2026-11-10T03:00:00Z';
const expiresAt = Date.parse(createdAt) + PIECE_LIFETIME_MS;
const piece = {id: 1, created_at: createdAt};

test('고정된 조각은 72시간이 지나도 보드에 남고 고정 해제하면 제외된다', () => {
  const pinned = {...piece, is_pinned: true};
  expect(getActivePieces([pinned], expiresAt + PIECE_LIFETIME_MS)).toEqual([
    pinned,
  ]);
  expect(getActivePieces([{...pinned, is_pinned: false}], expiresAt)).toEqual(
    [],
  );
});

test('리뷰 작성 72시간 직전까지 보이고 정확히 72시간부터 사라진다', () => {
  expect(getActivePieces([piece], expiresAt - 1)).toEqual([piece]);
  expect(getActivePieces([piece], expiresAt)).toEqual([]);
  expect(getActivePieces([piece], expiresAt + 1)).toEqual([]);
});

test('같은 시각의 다른 타임존 표현에도 만료 시점이 같다', () => {
  expect(
    getActivePieces(
      [{...piece, created_at: '2026-11-10T12:00:00+09:00'}],
      expiresAt,
    ),
  ).toEqual([]);
});

test('만료된 조각만 제외하고 남은 목록의 순서를 유지한다', () => {
  const recent = {id: 2, created_at: '2026-11-12T03:00:00Z'};
  const invalid = {id: 3, created_at: 'invalid'};
  expect(getActivePieces([recent, piece, invalid], expiresAt)).toEqual([
    recent,
    invalid,
  ]);
});
