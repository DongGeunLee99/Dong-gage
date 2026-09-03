import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { LedgerFonts } from '@/constants/ledgerColors';

type RefreshToastProps = { visible: boolean; label: string };

/**
 * 당겨서 새로고침 완료를 화면 하단 중앙에서 살짝 페이드 인/아웃으로 알려준다.
 * 항상 마운트된 채로 opacity만 애니메이션하는 이유: visible이 꺼지자마자 언마운트되면
 * 사라지는 애니메이션(500ms)이 재생될 시간이 없다.
 */
export function RefreshToast({ visible, label }: RefreshToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 500,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  return (
    <Animated.View style={[styles.wrap, { opacity }]} pointerEvents="none">
      <Animated.View style={styles.pill}>
        <Text style={styles.text}>{label}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '15%',
    alignItems: 'center',
  },
  pill: {
    backgroundColor: 'rgba(21,19,15,0.8)',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  text: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 12.5, color: '#fff' },
});
