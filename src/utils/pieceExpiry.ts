export const PIECE_LIFETIME_MS = 72 * 60 * 60 * 1000;

// 조각 API의 created_at은 원본 리뷰의 작성 시각이다.
export const getPieceExpiresAt = (piece: {
  created_at: string;
  is_pinned?: boolean;
}) =>
  piece.is_pinned ? Infinity : Date.parse(piece.created_at) + PIECE_LIFETIME_MS;

export function getActivePieces<
  T extends {created_at: string; is_pinned?: boolean},
>(pieces: T[], now = Date.now()): T[] {
  return pieces.filter(piece => {
    const expiresAt = getPieceExpiresAt(piece);
    // 잘못된 날짜만으로 조각을 숨기지는 않는다.
    return !Number.isFinite(expiresAt) || expiresAt > now;
  });
}
