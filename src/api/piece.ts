import {apiClient} from './client';
import {getPresignedUrl} from './imageUpload';

type ApiResponse<T> = {success: boolean; message: string | null; data: T};

// 프로필(=남의 보드)에 보일지 여부
export type PieceVisibility = 'PUBLIC' | 'PRIVATE';

export type Piece = {
  id: number;
  review_id: number;
  // 배경이 투명한 누끼 PNG
  image_url: string;
  // 이름을 안 붙였으면 null
  name: string | null;
  // 친구 보드 조회(getUserPieces)에는 이 키가 아예 없다
  visibility?: PieceVisibility;
  // 아직 보드에 올린 적 없으면 null. 보드 크기 대비 0~1 비율 (조각 좌상단 기준)
  position_x: number | null;
  position_y: number | null;
  // 기울기(도). -16 ~ 16
  rotation: number;
  // 원래 크기 배수. 0.5 ~ 2.0, 소수 2자리. 미배치 조각도 항상 1.00이 오고 null은 없다
  scale: number;
  place: {id: number; name: string};
  // 조각을 만든 시각이 아니라 원본 리뷰의 작성 시각. 목록도 이 값 기준 최신순
  created_at: string;
};

export type PiecesResponse = {
  pieces: Piece[];
  total_count: number;
};

export type CreatePieceRequest = {
  // 본인 리뷰여야 하고, 리뷰 1건당 조각 1개만 만들 수 있다
  review_id: number;
  image_url: string;
  // 최대 30자. 빈 문자열을 보내면 서버가 null로 저장
  name?: string;
  // 생략하면 PUBLIC
  visibility?: PieceVisibility;
};

export type UpdatePieceRequest = {
  name?: string;
  visibility?: PieceVisibility;
};

// rotation / scale 은 빼고 보내면 서버가 기본값(0, 1.00)으로 덮어쓴다(PUT이라 전체 대체).
// 그래서 전부 필수로 두고 항상 현재 값을 같이 보낸다
export type PiecePlacement = {
  piece_id: number;
  position_x: number;
  position_y: number;
  rotation: number;
  scale: number;
};

const ROTATION_LIMIT = 16;
export const MIN_SCALE = 0.5;
export const MAX_SCALE = 2;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// 서버는 범위를 벗어나거나 null이면 400을 주고 보낸 것 전부를 롤백한다(부분 저장 없음).
// 또 position은 소수 4자리, scale은 2자리까지만 저장하므로,
// 보낼 때부터 맞춰서 저장값과 로컬 상태가 어긋나지 않게 한다
const normalizePlacement = (placement: PiecePlacement): PiecePlacement => ({
  piece_id: placement.piece_id,
  position_x: Math.round(clamp(placement.position_x, 0, 1) * 10000) / 10000,
  position_y: Math.round(clamp(placement.position_y, 0, 1) * 10000) / 10000,
  rotation: clamp(Math.round(placement.rotation), -ROTATION_LIMIT, ROTATION_LIMIT),
  scale: Math.round(clamp(placement.scale, MIN_SCALE, MAX_SCALE) * 100) / 100,
});

// 보드 크기를 아직 못 쟀을 때 0으로 나눠서 NaN이 섞여 들어가면 전체 400이 난다
const isSendablePlacement = (placement: PiecePlacement) =>
  Number.isFinite(placement.position_x) &&
  Number.isFinite(placement.position_y) &&
  Number.isFinite(placement.rotation) &&
  Number.isFinite(placement.scale);

// 조각 이미지는 누끼 PNG라 리뷰 사진(JPEG)과 다른 경로/타입으로 올린다.
// piece/ 접두사를 프론트가 직접 붙여야 하고(서버가 안 붙임), piece/ 는 썸네일 변환을
// 타지 않아서 투명 배경이 유지된다
export async function getPieceImagePresignedUrl(fileName: string) {
  return getPresignedUrl({
    file_name: `piece/${fileName}`,
    content_type: 'image/png',
  });
}

// 내 조각 전체. 페이징 없이 한 번에 내려온다 (보드를 한 번에 그려야 해서)
export async function getMyPieces(): Promise<PiecesResponse> {
  const response = await apiClient.get<ApiResponse<PiecesResponse>>(
    '/api/users/me/pieces',
  );

  return response.data.data;
}

// 친구 보드. PUBLIC만 내려오고 visibility 키는 빠져 있다.
// 내 보드는 PRIVATE까지 봐야 하므로 여기 말고 getMyPieces를 쓸 것
export async function getUserPieces(userId: number): Promise<PiecesResponse> {
  const response = await apiClient.get<ApiResponse<PiecesResponse>>(
    `/api/users/${userId}/pieces`,
  );

  return response.data.data;
}

export async function createPiece(body: CreatePieceRequest): Promise<number> {
  const response = await apiClient.post<ApiResponse<{piece_id: number}>>(
    '/api/pieces',
    body,
  );

  return response.data.data.piece_id;
}

export async function updatePiece(
  pieceId: number,
  body: UpdatePieceRequest,
): Promise<void> {
  await apiClient.patch(`/api/pieces/${pieceId}`, body);
}

export async function deletePiece(pieceId: number): Promise<void> {
  await apiClient.delete(`/api/pieces/${pieceId}`);
}

// 보드 배치를 한 번에 저장. 한 트랜잭션이라 하나라도 잘못되면 전부 롤백된다
export async function updatePiecePositions(
  placements: PiecePlacement[],
): Promise<void> {
  const positions = placements.map(normalizePlacement).filter(isSendablePlacement);

  if (positions.length === 0) {
    return;
  }

  await apiClient.put('/api/users/me/pieces/positions', {positions});
}
