import {useEffect, useRef} from 'react';

// 차단/차단 해제 직후엔 이미 받아둔 목록(지도 버블, 탐색 피드, 친구 리뷰, 댓글)에
// 그 사용자의 콘텐츠가 그대로 남아 있다. React Query 같은 캐시 레이어가 없어서,
// AuthContext의 notifySessionExpired 브릿지와 같은 방식으로 "다시 조회해라"만 알린다.
// 앱을 다시 켜야 반영되면 심사에서 걸리는 부분이라 구독한 화면은 즉시 재조회한다.
type Listener = () => void;

const listeners = new Set<Listener>();

export function notifyBlockChanged() {
  console.log('[차단 변경 알림] 구독 화면 재조회', {listeners: listeners.size});

  // 복사해서 돌린다 - 콜백 안에서 구독이 해제돼도 순회가 깨지지 않게
  [...listeners].forEach(listener => listener());
}

// 차단/해제가 일어나면 onChange를 호출한다. 포커스되지 않은 탭도 마운트돼 있으면
// 같이 재조회하므로 탭을 옮겨 갔을 때 이미 갱신된 목록이 보인다
export function useOnBlockChange(onChange: () => void) {
  // onChange가 매 렌더 새로 만들어져도 구독을 다시 걸지 않도록 ref로 최신 값만 들고 있는다
  const handlerRef = useRef(onChange);
  handlerRef.current = onChange;

  useEffect(() => {
    const listener = () => handlerRef.current();

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);
}
