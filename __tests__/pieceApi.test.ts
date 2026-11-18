import {apiClient} from '../src/api/client';
import {
  getMyPieces,
  getUserPieces,
  updatePiecePositions,
  type Piece,
} from '../src/api/piece';
import {
  getPinnedPieceIds,
  savePinnedPieceIds,
} from '../src/storage/pinnedPieces';

jest.mock('../src/api/client', () => ({
  apiClient: {get: jest.fn(), put: jest.fn()},
}));
jest.mock('../src/api/imageUpload', () => ({getPresignedUrl: jest.fn()}));

const mockGet = apiClient.get as jest.Mock;
const mockPut = apiClient.put as jest.Mock;

beforeEach(() => jest.clearAllMocks());

test('도감 기본 조회는 전체 조각을 반환하고 보드 조회는 scope를 구분한다', async () => {
  const data = {
    total_count: 1,
    pieces: [{id: 7, created_at: '2026-10-03T06:20:00Z'}],
  };
  mockGet.mockResolvedValue({data: {success: true, data}});

  expect(await getMyPieces()).toEqual(data);
  expect(mockGet).toHaveBeenLastCalledWith('/api/users/me/pieces', {
    params: {scope: 'all'},
  });
  await getMyPieces('board');
  expect(mockGet).toHaveBeenLastCalledWith('/api/users/me/pieces', {
    params: {scope: 'board'},
  });
});

test('타인 보드는 board 범위로 요청하고 서버가 준 고정 순서를 유지한다', async () => {
  const data = {
    total_count: 1,
    pieces: [{id: 7, is_pinned: true, pin_order: 1}],
  };
  mockGet.mockResolvedValue({data: {success: true, data}});

  expect(await getUserPieces(42, 'board')).toEqual(data);
  expect(mockGet).toHaveBeenCalledWith('/api/users/42/pieces', {
    params: {scope: 'board'},
  });
});

test('고정 슬롯은 생성일 정렬 대신 pin_order를 따르고 원본 배열을 바꾸지 않는다', () => {
  const pieces = [
    {id: 12, is_pinned: true, pin_order: 2},
    {id: 9, is_pinned: false, pin_order: null},
    {id: 7, is_pinned: true, pin_order: 1},
  ] as Piece[];
  expect(getPinnedPieceIds(pieces)).toEqual([7, 12]);
  expect(pieces.map(piece => piece.id)).toEqual([12, 9, 7]);
});

test('고정 저장은 선택 순서 그대로 서버 목록을 교체하고 빈 배열로 전체 해제한다', async () => {
  const data = {
    pinned_count: 2,
    pins: [
      {piece_id: 7, pin_order: 1},
      {piece_id: 12, pin_order: 2},
    ],
  };
  mockPut.mockResolvedValue({data: {success: true, data}});

  expect(await savePinnedPieceIds([7, 12])).toEqual(data);
  expect(mockPut).toHaveBeenLastCalledWith('/api/users/me/pieces/pins', {
    piece_ids: [7, 12],
  });
  await savePinnedPieceIds([]);
  expect(mockPut).toHaveBeenLastCalledWith('/api/users/me/pieces/pins', {
    piece_ids: [],
  });
});

test('고정 저장 실패는 화면에서 처리할 수 있도록 전달한다', async () => {
  const error = new Error('403');
  mockPut.mockRejectedValue(error);
  await expect(savePinnedPieceIds([7])).rejects.toBe(error);
});

test('미배치 조각의 크기 저장에서 null 좌표를 0으로 바꾸지 않는다', async () => {
  mockPut.mockResolvedValue({
    data: {success: true, data: {updated_count: 1}},
  });
  await updatePiecePositions([
    {
      piece_id: 7,
      position_x: null,
      position_y: null,
      rotation: -8,
      scale: 1.2,
    },
  ]);
  expect(mockPut).toHaveBeenCalledWith('/api/users/me/pieces/positions', {
    positions: [
      {
        piece_id: 7,
        position_x: null,
        position_y: null,
        rotation: -8,
        scale: 1.2,
      },
    ],
  });
});

test('배치 값의 정밀도를 맞추고 계산 불가능한 좌표는 전송하지 않는다', async () => {
  mockPut.mockResolvedValue({
    data: {success: true, data: {updated_count: 1}},
  });
  await updatePiecePositions([
    {
      piece_id: 12,
      position_x: 0.412345,
      position_y: 0.235678,
      rotation: -8,
      scale: 1.234,
    },
    {
      piece_id: 7,
      position_x: Infinity,
      position_y: NaN,
      rotation: 0,
      scale: 1,
    },
  ]);
  expect(mockPut).toHaveBeenCalledWith('/api/users/me/pieces/positions', {
    positions: [
      {
        piece_id: 12,
        position_x: 0.4123,
        position_y: 0.2357,
        rotation: -8,
        scale: 1.23,
      },
    ],
  });
});
