import { Pressable, StyleSheet, View } from 'react-native';

import type { ColorPalette } from '@/constants/themePalettes';

type ToggleSwitchProps = { on: boolean; onToggle?: () => void; colors: ColorPalette };

export function ToggleSwitch({ on, onToggle, colors }: ToggleSwitchProps) {
  return (
    <Pressable onPress={onToggle} hitSlop={8}>
      <View style={[styles.track, { backgroundColor: on ? colors.ink : colors.line }]}>
        <View style={[styles.knob, { left: on ? 18 : 2 }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 38, height: 22, borderRadius: 11 },
  knob: {
    position: 'absolute',
    top: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});
