import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { LedgerColors, LedgerFonts } from '@/constants/ledgerColors';

/**
 * 앱 전역 토스트. 저장/삭제/일괄 등 DB 쓰기 결과를 화면 하단 중앙에서 잠깐 알려준다.
 * 화면과 DB가 따로 노는 걸 막기 위해, 쓰기 실패 시 이 토스트로 알리고 호출부에서 화면을 되돌린다.
 */
type Tone = 'default' | 'error';
type ToastContextValue = { showToast: (message: string, tone?: Tone) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<Tone>('default');
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, t: Tone = 'default') => {
    setMessage(msg);
    setTone(t);
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 1800);
  }, []);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? 200 : 450,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Animated.View style={[styles.wrap, { opacity }]} pointerEvents="none">
        <View style={[styles.pill, tone === 'error' && styles.pillError]}>
          <Text style={styles.text}>{message}</Text>
        </View>
      </Animated.View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: '15%', alignItems: 'center' },
  pill: { backgroundColor: 'rgba(21,19,15,0.88)', paddingVertical: 9, paddingHorizontal: 18, borderRadius: 20, maxWidth: '86%' },
  pillError: { backgroundColor: LedgerColors.expense },
  text: { fontFamily: LedgerFonts.bodySemiBold, fontSize: 12.5, color: '#fff', textAlign: 'center' },
});
