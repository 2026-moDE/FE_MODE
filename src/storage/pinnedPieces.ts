import {updatePiecePins, type Piece} from '../api/piece';

export const MAX_PINNED_PIECES = 3;

// 목록 정렬(created_at)과 고정 슬롯 정렬(pin_order)은 서로 다르다.
export const getPinnedPieceIds = (pieces: Piece[]): number[] =>
  pieces
    .filter(piece => piece.is_pinned && piece.pin_order != null)
    .sort((a, b) => a.pin_order! - b.pin_order!)
    .map(piece => piece.id);

export const savePinnedPieceIds = (pieceIds: number[]) =>
  updatePiecePins(pieceIds);
