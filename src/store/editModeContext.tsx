import { createContext, useContext, useMemo, useState } from 'react';

/**
 * 리스트 탭의 "편집모드"(다중 선택 일괄 삭제)를 탭 네비게이터와 공유하기 위한 일시적 전역 상태.
 * 편집모드 동안에는 (tabs)/_layout.tsx가 이 값을 읽어 스와이프/탭바 이동을 막는다.
 * 테마/언어와 달리 세션 한정 상태라 AsyncStorage에 영속화하지 않는다.
 */
type EditModeContextValue = {
  editMode: boolean;
  setEditMode: (on: boolean) => void;
};

const EditModeContext = createContext<EditModeContextValue | null>(null);

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [editMode, setEditMode] = useState(false);
  const value = useMemo(() => ({ editMode, setEditMode }), [editMode]);
  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>;
}

export function useEditMode() {
  const ctx = useContext(EditModeContext);
  if (!ctx) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return ctx;
}
