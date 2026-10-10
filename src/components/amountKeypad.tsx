import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BackspaceIcon } from '@/components/icons';
import type { ColorPalette } from '@/constants/themePalettes';
import { createStyles } from '@/styles/amountKeypadStyles';

const ROWS: string[][] = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['C', '0', 'back', '+'],
];
const OPERATORS = new Set(['÷', '×', '−', '+']);

type AmountKeypadProps = {
  visible: boolean;
  colors: ColorPalette;
  doneLabel: string;
  onKey: (key: string) => void;
};

/** 금액용 커스텀 계산기 키패드. OS 키보드 대신 떠서 사칙연산 입력을 받는다. */
export function AmountKeypad({ visible, colors, doneLabel, onKey }: AmountKeypadProps) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!visible) return null;
  return (
    <View style={styles.container}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((key) => {
            const isOp = OPERATORS.has(key);
            const isUtil = key === 'C';
            return (
              <Pressable
                key={key}
                style={[styles.key, isOp && styles.keyOp, isUtil && styles.keyUtil]}
                onPress={() => onKey(key)}>
                {key === 'back' ? (
                  <BackspaceIcon size={22} color={colors.ink} />
                ) : (
                  <Text style={[styles.keyText, isUtil && styles.keyUtilText]}>{key}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={styles.row}>
        <Pressable style={[styles.key, styles.keyEquals]} onPress={() => onKey('=')}>
          <Text style={[styles.keyText, styles.keyEqualsText]}>=</Text>
        </Pressable>
        <Pressable style={[styles.key, styles.keyDone]} onPress={() => onKey('done')}>
          <Text style={[styles.keyText, styles.keyDoneText]}>{doneLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
