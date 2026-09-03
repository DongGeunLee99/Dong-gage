import { useCallback, useRef, useState } from 'react';
import { Animated } from 'react-native';

/**
 * 당겨서 새로고침 시 "완료 신호"(토스트 + 화면 살짝 페이드)를 실제 데이터 로딩이 끝난
 * 시점이 아니라 "로딩도 끝났고 + 사용자가 손도 뗀" 시점에 맞춰 보여준다.
 *
 * 네이티브 RefreshControl은 당김 임계값을 넘는 즉시(손을 떼기 전에도) onRefresh를 실행한다.
 * 이 앱의 조회는 빨라서 아직 드래그 중인데 완료 신호가 먼저 떠버리는 문제가 있었음 —
 * 실제 새로고침 트리거 자체(임계값 통과)는 네이티브 동작이라 건드리지 않고, 우리가 붙이는
 * 부가 피드백(토스트/페이드)만 release 시점까지 늦춰서 체감 타이밍을 맞춘다.
 *
 * `contentOpacity`는 새로고침 완료 시 살짝 어두워졌다 밝아지는 페이드를 위한 Animated.Value —
 * 데이터가 실제로 바뀌었는지와 무관하게 매번 눈에 보이는 "새로 불러왔다" 신호를 준다
 * (LayoutAnimation은 레이아웃이 실제로 달라질 때만 보이므로 이 용도엔 부족했음).
 */
export function useRefreshFeedback() {
  const [refreshing, setRefreshing] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const draggingRef = useRef(false);
  const pendingRef = useRef(false);

  const fire = useCallback(() => {
    setJustRefreshed(true);
    setTimeout(() => setJustRefreshed(false), 1500);
    // 페이드는 살짝 뜸을 들인 뒤 시작 — 손을 떼자마자 바로 튀는 것보다 자연스러움.
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(contentOpacity, { toValue: 0.35, duration: 120, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    }, 300);
  }, [contentOpacity]);

  const run = useCallback(
    async (task: () => Promise<void>) => {
      setRefreshing(true);
      await task();
      setRefreshing(false);
      if (draggingRef.current) {
        pendingRef.current = true;
      } else {
        fire();
      }
    },
    [fire],
  );

  const onScrollBeginDrag = useCallback(() => {
    draggingRef.current = true;
  }, []);

  const onScrollEndDrag = useCallback(() => {
    draggingRef.current = false;
    if (pendingRef.current) {
      pendingRef.current = false;
      fire();
    }
  }, [fire]);

  return { refreshing, justRefreshed, contentOpacity, run, onScrollBeginDrag, onScrollEndDrag };
}
