import React, {useEffect, useMemo} from 'react';
import {View, Text, StyleSheet, Image, Pressable} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import {MIN_SCALE, MAX_SCALE, type Piece, type PiecePlacement} from '../../api/piece';
import {typography, fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {padding, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import IconPlaceLocation from '../../assets/icons/IconPlaceLocation';
import DashedBorder from '../common/DashedBorder';

const pencilIcon = require('../../assets/image/pencil.png');

// 조각 하나가 떨어지는 데 걸리는 시간과, 다음 조각이 출발하기까지의 간격.
// 하나씩 순서대로 쌓이는 게 보여야 해서 간격을 낙하 시간보다 짧게 둔다
const DROP_DURATION_MS = 520;
const DROP_STAGGER_MS = 110;
// 떨어지는 느낌이 나려면 보드 위쪽(화면 밖)에서 출발해야 한다
const DROP_FROM_RATIO = 0.75;
const DROP_EASING = Easing.bezier(0.3, 0.1, 0.2, 1);

// 롱프레스로 집었을 때: 집은 조각은 살짝 커지고, 나머지는 흐려진다
const LONG_PRESS_MS = 220;
const LIFT_SCALE = 0.08;
const DIMMED_OPACITY = 0.3;
const DIM_DURATION_MS = 160;

// 기울기 범위 (시안: 부자연스럽지 않은 선에서 랜덤)
const MAX_ANGLE_DEG = 16;

// 조각 기본 크기 (보드 너비 대비). 조각이 많아지면 보드가 꽉 차서 작게 줄인다
const BASE_SIZE_RATIO = 0.3;
const SIZE_SHRINK_PER_PIECE = 0.012;
const MIN_SIZE_RATIO = 0.16;

// 쌓임 판정. 가로로 이만큼 겹치면 위에 얹히고, 얹힐 때 세로로 조금 파묻히게 둔다
const STACK_OVERLAP_X = 0.86;
const STACK_STEP_Y = 0.74;

// 손을 뗀 뒤 제자리로 떨어지는 동작. 떨어지는 느낌이 나게 점점 빨라지는 easing을 쓴다
const SETTLE_DURATION_MS = 260;
const SETTLE_EASING = Easing.in(Easing.quad);

export const pieceSizeFor = (boardWidth: number, count: number) => {
  const ratio = Math.max(
    MIN_SIZE_RATIO,
    BASE_SIZE_RATIO - count * SIZE_SHRINK_PER_PIECE,
  );

  return boardWidth * ratio;
};

// 조각 id로 고정된 난수열. Math.random을 쓰면 다시 그릴 때마다 자리가 바뀌어서,
// 서버에 자리가 저장되기 전까지 같은 조각이 같은 곳에 오도록 id를 씨앗으로 쓴다
const seededRandom = (seed: string) => {
  let state = 0;

  for (let i = 0; i < seed.length; i += 1) {
    state = (state * 31 + seed.charCodeAt(i)) % 2147483647;
  }

  // Lehmer 난수. 씨앗이 0이면 계속 0만 나와서 1 이상으로 올려둔다
  state = (state % 2147483646) + 1;

  return () => {
    state = (state * 16807) % 2147483647;

    return (state - 1) / 2147483646;
  };
};

// 화면에 그릴 때 쓰는 값. 서버는 position_x / position_y / rotation 으로 평평하게 주고받는다
type Placement = {x: number; y: number; angle: number; scale: number};
type Placements = Record<number, Placement>;

type Occupant = {id: number; left: number; top: number; size: number};

// 주어진 가로 위치에서 아래로 떨어뜨렸을 때 멈추는 높이.
// 가로로 겹치는 조각이 있으면 그 위에, 없으면 바닥에 닿는다.
// 조각마다 크기가 다를 수 있어서 겹침 판정은 두 조각 크기의 평균으로 본다.
// 처음 배치와 드래그 후 안착이 같은 규칙을 써야 해서 워크릿에서도 이 식을 그대로 쓴다
const restingTopFor = (
  left: number,
  size: number,
  boardHeight: number,
  occupants: Occupant[],
  ignoreId?: number,
) => {
  'worklet';

  let top = Math.max(boardHeight - size, 0);
  const center = left + size / 2;

  for (let i = 0; i < occupants.length; i += 1) {
    const other = occupants[i];

    if (other.id === ignoreId) {
      continue;
    }

    const otherCenter = other.left + other.size / 2;
    const reach = ((size + other.size) / 2) * STACK_OVERLAP_X;

    if (Math.abs(otherCenter - center) < reach) {
      top = Math.min(top, other.top - size * STACK_STEP_Y);
    }
  }

  return Math.max(top, 0);
};

// 자리가 없는 조각을 위에서 떨어뜨려 쌓는다.
// 가로로 겹치는 조각이 이미 있으면 그 위에, 없으면 바닥에 놓인다
const buildPlacements = (
  pieces: Piece[],
  size: number,
  boardWidth: number,
  boardHeight: number,
): {placements: Placements; created: PiecePlacement[]} => {
  const placements: Placements = {};
  const created: PiecePlacement[] = [];
  const occupied: Occupant[] = [];

  pieces.forEach(piece => {
    const pieceSize = size * piece.scale;
    const maxLeft = Math.max(boardWidth - pieceSize, 0);

    // position_x / position_y 가 null 이면 아직 보드에 올린 적 없는 조각이다
    if (piece.position_x != null && piece.position_y != null) {
      placements[piece.id] = {
        x: piece.position_x,
        y: piece.position_y,
        angle: piece.rotation,
        scale: piece.scale,
      };
      occupied.push({
        id: piece.id,
        left: piece.position_x * boardWidth,
        top: piece.position_y * boardHeight,
        size: pieceSize,
      });
      return;
    }

    const random = seededRandom(String(piece.id));
    const left = random() * maxLeft;
    const angle = random() * MAX_ANGLE_DEG * 2 - MAX_ANGLE_DEG;

    const top = restingTopFor(left, pieceSize, boardHeight, occupied);

    occupied.push({id: piece.id, left, top, size: pieceSize});

    placements[piece.id] = {
      x: left / boardWidth,
      y: top / boardHeight,
      angle,
      scale: piece.scale,
    };
    created.push({
      piece_id: piece.id,
      position_x: left / boardWidth,
      position_y: top / boardHeight,
      rotation: angle,
      scale: piece.scale,
    });
  });

  return {placements, created};
};

// 받쳐주던 조각이 빠지면 그 위에 있던 조각들이 내려와야 한다.
// 아래(top이 큰 것)부터 순서대로 다시 떨어뜨리면서, 이미 자리를 확정한 것만 지지대로 삼는다
const collapseStack = (occupants: Occupant[], boardHeight: number) => {
  const sorted = [...occupants].sort((a, b) => b.top - a.top);
  const settled: Occupant[] = [];

  sorted.forEach(occupant => {
    const top = restingTopFor(
      occupant.left,
      occupant.size,
      boardHeight,
      settled,
      occupant.id,
    );

    settled.push({...occupant, top});
  });

  return settled;
};

type BoardPieceProps = {
  piece: Piece;
  placement: Placement;
  // 배율 1일 때의 크기. 실제 크기는 여기에 scale을 곱한 값
  baseSize: number;
  boardWidth: number;
  boardHeight: number;
  index: number;
  // 다른 조각들의 현재 자리. 손을 뗐을 때 무엇 위에 얹힐지 워크릿에서 바로 계산해야 해서 공유값으로 받는다
  occupants: SharedValue<Occupant[]>;
  // 다른 조각이 움직여서 이 조각도 내려와야 할 때 쓰는 목표 높이 (id -> top)
  collapseTargets: SharedValue<Record<number, number>>;
  collapseTick: SharedValue<number>;
  isDimmed: boolean;
  isRevealed: boolean;
  // 남의 보드에서는 옮기거나 크기를 바꿀 수 없다 (위치 저장 API가 내 보드 전용)
  readOnly: boolean;
  onPickUp: (id: number) => void;
  onDrop: (placement: PiecePlacement) => void;
  onReveal: (id: number) => void;
  onEdit: (piece: Piece) => void;
};

function BoardPiece({
  piece,
  placement,
  baseSize,
  boardWidth,
  boardHeight,
  index,
  occupants,
  collapseTargets,
  collapseTick,
  isDimmed,
  isRevealed,
  readOnly,
  onPickUp,
  onDrop,
  onReveal,
  onEdit,
}: BoardPieceProps) {
  // 자리는 마운트 시점 값으로만 잡는다. 드래그 중에 부모가 다시 그려도
  // 좌표가 되돌아가지 않게, 이후로는 제스처만 이 값을 움직인다
  const x = useSharedValue(placement.x * boardWidth);
  const y = useSharedValue(placement.y * boardHeight);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const scale = useSharedValue(placement.scale);
  const startScale = useSharedValue(1);
  const isHeld = useSharedValue(false);

  const drop = useSharedValue(1);
  const lift = useSharedValue(0);
  const dim = useSharedValue(1);

  useEffect(() => {
    drop.value = withDelay(
      index * DROP_STAGGER_MS,
      withTiming(0, {duration: DROP_DURATION_MS, easing: DROP_EASING}),
    );
    // 마운트할 때 한 번만 떨어뜨린다 (화면에 다시 들어오면 보드째 새로 마운트됨)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dim.value = withTiming(isDimmed ? DIMMED_OPACITY : 1, {
      duration: DIM_DURATION_MS,
    });
  }, [dim, isDimmed]);

  const dropFrom = boardHeight * DROP_FROM_RATIO + baseSize;

  // 크기가 바뀌면 보드 안에 머물 수 있는 범위도 같이 바뀌어서, 워크릿에서 매번 다시 잰다
  const settle = () => {
    'worklet';

    const currentSize = baseSize * scale.value;

    x.value = Math.min(Math.max(x.value, 0), Math.max(boardWidth - currentSize, 0));

    const resting = restingTopFor(
      x.value,
      currentSize,
      boardHeight,
      occupants.value,
      piece.id,
    );

    y.value = withTiming(resting, {
      duration: SETTLE_DURATION_MS,
      easing: SETTLE_EASING,
    });

    runOnJS(onDrop)({
      piece_id: piece.id,
      position_x: x.value / boardWidth,
      position_y: resting / boardHeight,
      rotation: placement.angle,
      scale: scale.value,
    });
  };

  const pan = Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_MS)
    .onStart(() => {
      isHeld.value = true;
      startX.value = x.value;
      startY.value = y.value;
      lift.value = withTiming(1, {duration: 120});
      runOnJS(onPickUp)(piece.id);
    })
    .onChange(event => {
      const currentSize = baseSize * scale.value;

      x.value = Math.min(
        Math.max(startX.value + event.translationX, 0),
        Math.max(boardWidth - currentSize, 0),
      );
      y.value = Math.min(
        Math.max(startY.value + event.translationY, 0),
        Math.max(boardHeight - currentSize, 0),
      );
    })
    .onEnd(() => {
      isHeld.value = false;
      lift.value = withTiming(0, {duration: 140});

      // 손을 뗀 자리에 그대로 떠 있지 않고, 아래로 떨어져 바닥이나 다른 조각 위에 얹힌다
      settle();
    });

  // 두 손가락으로 조각 크기 조절. 크기가 바뀌면 자리도 달라져서 뗄 때 다시 떨어뜨린다
  const pinch = Gesture.Pinch()
    .onStart(() => {
      isHeld.value = true;
      startScale.value = scale.value;
      runOnJS(onPickUp)(piece.id);
    })
    .onChange(event => {
      scale.value = Math.min(
        Math.max(startScale.value * event.scale, MIN_SCALE),
        MAX_SCALE,
      );
    })
    .onEnd(() => {
      isHeld.value = false;
      // 흐려진 다른 조각은 settle -> onDrop -> handleDrop 에서 되돌린다
      settle();
    });

  // 다른 조각이 빠져서 받칠 게 없어지면 여기로 목표 높이가 내려온다
  useAnimatedReaction(
    () => collapseTick.value,
    (tick, previous) => {
      if (tick === previous || isHeld.value) {
        return;
      }

      const target = collapseTargets.value[piece.id];

      if (target == null || Math.abs(target - y.value) < 0.5) {
        return;
      }

      y.value = withTiming(target, {
        duration: SETTLE_DURATION_MS,
        easing: SETTLE_EASING,
      });
    },
  );

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(onReveal)(piece.id);
  });

  // 핀치(두 손가락)는 롱프레스 드래그와 동시에 인식돼도 서로 방해하지 않는다.
  // 읽기 전용이면 이름표를 띄우는 탭만 받는다
  const gesture = readOnly
    ? tap
    : Gesture.Simultaneous(Gesture.Exclusive(pan, tap), pinch);

  // 크기를 transform scale로 주면 중심 기준으로 커져서 좌상단이 밀린다.
  // 좌표 계산이 전부 좌상단 기준이라, 크기는 width/height로 직접 바꾼다
  const pieceStyle = useAnimatedStyle(() => ({
    width: baseSize * scale.value,
    height: baseSize * scale.value,
    opacity: dim.value,
    transform: [
      {translateX: x.value},
      {translateY: y.value - drop.value * dropFrom},
      {rotate: `${placement.angle}deg`},
      {scale: 1 + lift.value * LIFT_SCALE},
    ],
  }));

  // 이름표는 조각을 따라다니되 같이 기울어지면 안 읽혀서 회전은 빼고 위치만 공유한다
  const labelStyle = useAnimatedStyle(() => ({
    width: baseSize * scale.value,
    height: baseSize * scale.value,
    opacity: dim.value,
    transform: [{translateX: x.value}, {translateY: y.value - drop.value * dropFrom}],
  }));

  return (
    <>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.piece, pieceStyle]}>
          <Image source={{uri: piece.image_url}} style={styles.pieceImage} />
        </Animated.View>
      </GestureDetector>

      {isRevealed && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.labelAnchor, labelStyle]}>
          <Pressable
            style={styles.labelChip}
            disabled={readOnly}
            onPress={() => onEdit(piece)}>
            <View style={styles.labelTitleRow}>
              <Text style={styles.labelText} numberOfLines={1}>
                {piece.name ?? '이름 없음'}
              </Text>
              {!readOnly && <Image source={pencilIcon} style={styles.labelPencil} />}
            </View>

            <View style={styles.labelPlaceRow}>
              <IconPlaceLocation size={10} color={colors.icon.tertiary} />
              <Text style={styles.labelPlace} numberOfLines={1}>
                {piece.place.name}
              </Text>
            </View>

            <DashedBorder radius={radius.lg} color={colors.border.default} />
          </Pressable>
        </Animated.View>
      )}
    </>
  );
}

type Props = {
  pieces: Piece[];
  width: number;
  height: number;
  // 자리가 바뀐 조각들을 한 번에 저장한다 (첫 배치, 드래그/크기조절 후 더미 재안착 모두)
  onPlacePieces: (placements: PiecePlacement[]) => void;
  onEditPiece: (piece: Piece) => void;
  // 남의 보드 - 보기만 가능
  readOnly?: boolean;
};

export default function PieceBoard({
  pieces,
  width,
  height,
  onPlacePieces,
  onEditPiece,
  readOnly = false,
}: Props) {
  const [activeId, setActiveId] = React.useState<number | null>(null);
  const [revealedId, setRevealedId] = React.useState<number | null>(null);

  const size = useMemo(
    () => pieceSizeFor(width, pieces.length),
    [width, pieces.length],
  );

  const {placements, created} = useMemo(
    () => buildPlacements(pieces, size, width, height),
    [pieces, size, width, height],
  );

  // 드래그를 놓았을 때 무엇 위에 얹힐지 계산할 재료. 자리가 바뀔 때마다 갱신된다
  const occupants = useSharedValue<Occupant[]>([]);
  // 받침이 빠져서 같이 내려와야 하는 조각들의 목표 높이
  const collapseTargets = useSharedValue<Record<number, number>>({});
  const collapseTick = useSharedValue(0);

  useEffect(() => {
    occupants.value = pieces.map(piece => ({
      id: piece.id,
      left: placements[piece.id].x * width,
      top: placements[piece.id].y * height,
      size: size * placements[piece.id].scale,
    }));
  }, [occupants, pieces, placements, width, height, size]);

  useEffect(() => {
    // 남의 보드는 자리를 저장할 수 없다(403). 화면에만 중력 배치해서 보여준다
    if (!readOnly && created.length > 0) {
      onPlacePieces(created);
    }
  }, [created, onPlacePieces, readOnly]);

  const handleDrop = (placement: PiecePlacement) => {
    setActiveId(null);
    // 길게 눌렀다 떼면 그 조각의 이름표가 뜬다
    setRevealedId(placement.piece_id);

    // 움직인 조각의 새 자리를 반영한 뒤, 더미 전체를 다시 떨어뜨린다.
    // 밑에 있던 걸 빼면 그 위에 있던 조각들이 받칠 게 없어지므로
    const moved = occupants.value.map(occupant =>
      occupant.id === placement.piece_id
        ? {
            ...occupant,
            left: placement.position_x * width,
            top: placement.position_y * height,
            size: size * placement.scale,
          }
        : occupant,
    );

    const settled = collapseStack(moved, height);
    const byId = new Map(settled.map(occupant => [occupant.id, occupant]));

    // 움직인 조각은 제스처 쪽에서 이미 떨어뜨렸으니 여기선 제외한다
    const targets: Record<number, number> = {};

    settled.forEach(occupant => {
      if (occupant.id !== placement.piece_id) {
        targets[occupant.id] = occupant.top;
      }
    });

    occupants.value = settled;
    collapseTargets.value = targets;
    collapseTick.value += 1;

    // 자리가 바뀐 조각을 한 번에 저장 (벌크 API라 요청은 한 번)
    const changed: PiecePlacement[] = pieces
      .map(piece => {
        const occupant = byId.get(piece.id);

        if (occupant == null) {
          return null;
        }

        const isMoved = piece.id === placement.piece_id;
        const next: PiecePlacement = isMoved
          ? placement
          : {
              piece_id: piece.id,
              position_x: occupant.left / width,
              position_y: occupant.top / height,
              rotation: placements[piece.id].angle,
              scale: placements[piece.id].scale,
            };

        // 안 움직인 조각까지 보내면 요청만 커진다
        const stayed =
          !isMoved &&
          Math.abs(next.position_y - placements[piece.id].y) < 0.0005 &&
          Math.abs(next.position_x - placements[piece.id].x) < 0.0005;

        return stayed ? null : next;
      })
      .filter((item): item is PiecePlacement => item != null);

    onPlacePieces(changed);
  };

  const handleReveal = (pieceId: number) => {
    setRevealedId(prev => (prev === pieceId ? null : pieceId));
  };

  return (
    // 배경 탭으로 이름표를 닫지 않는다 - 여기에 Pressable을 두면 조각의 탭 제스처와
    // 서로 먹어서 이름표가 뜨자마자 닫힌다. 같은 조각을 한 번 더 누르면 닫히는 방식
    <View style={[styles.board, {width, height}]}>
      {pieces.map((piece, index) => (
        <BoardPiece
          key={piece.id}
          piece={piece}
          placement={placements[piece.id]}
          baseSize={size}
          boardWidth={width}
          boardHeight={height}
          index={index}
          occupants={occupants}
          collapseTargets={collapseTargets}
          collapseTick={collapseTick}
          isDimmed={activeId != null && activeId !== piece.id}
          readOnly={readOnly}
          isRevealed={revealedId === piece.id}
          onPickUp={setActiveId}
          onDrop={handleDrop}
          onReveal={handleReveal}
          onEdit={onEditPiece}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
  },

  piece: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  pieceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  labelAnchor: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },

  // 조각 오른쪽 아래에 걸치는 흰색 이름표 (조각 등록 완료 화면과 같은 생김새)
  labelChip: {
    position: 'absolute',
    left: '45%',
    bottom: 0,
    minWidth: 76,
    paddingHorizontal: padding.s,
    paddingVertical: 6,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.white,
    alignItems: 'center',
    gap: 2,
  },

  labelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.xs,
  },

  labelText: {
    ...typography.c1,
    flexShrink: 1,
    color: colors.text.basic,
    includeFontPadding: false,
  },

  labelPencil: {
    width: 10,
    height: 10,
    resizeMode: 'contain',
    tintColor: colors.icon.tertiary,
  },

  labelPlaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  labelPlace: {
    ...typography.c3,
    fontFamily: fontFamily.medium,
    flexShrink: 1,
    color: colors.text.tertiary,
    includeFontPadding: false,
  },
});
