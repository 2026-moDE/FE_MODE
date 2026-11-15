import {useEffect, useMemo, useState} from 'react';
import {AppState} from 'react-native';
import type {Piece} from '../api/piece';
import {getActivePieces, getPieceExpiresAt} from '../utils/pieceExpiry';

export function useActivePieces(pieces: Piece[]): Piece[] {
  const [now, setNow] = useState(Date.now);
  const activePieces = useMemo(
    () => getActivePieces(pieces, Math.max(now, Date.now())),
    [pieces, now],
  );

  useEffect(() => {
    const nextExpiry = Math.min(
      ...activePieces.map(getPieceExpiresAt).filter(Number.isFinite),
    );
    if (!Number.isFinite(nextExpiry)) return;

    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(Math.max(nextExpiry - Date.now(), 0), 2147483647),
    );
    return () => clearTimeout(timer);
  }, [activePieces]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') setNow(Date.now());
    });
    return () => subscription.remove();
  }, []);

  return activePieces;
}
