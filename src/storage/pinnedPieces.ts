import AsyncStorage from '@react-native-async-storage/async-storage';

const PINNED_PIECE_IDS_KEY = 'PINNED_PIECE_IDS';

export const MAX_PINNED_PIECES = 3;

// 조각 고정 API가 아직 없어서 이 기기에만 저장한다. 서버 필드가 생기면 이 파일만 바꾸면 된다.
// 삭제된 조각이나 다른 계정의 조각 id가 남아 있을 수 있으니, 쓰는 쪽에서 조각 목록과 대조할 것
export const getPinnedPieceIds = async (): Promise<number[]> => {
  try {
    const saved = await AsyncStorage.getItem(PINNED_PIECE_IDS_KEY);

    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.log('[고정 조각 조회 실패]', error);
    return [];
  }
};

export const savePinnedPieceIds = async (pieceIds: number[]) => {
  await AsyncStorage.setItem(PINNED_PIECE_IDS_KEY, JSON.stringify(pieceIds));
};
