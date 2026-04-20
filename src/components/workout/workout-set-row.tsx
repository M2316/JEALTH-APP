import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';

import { DialNumberInput } from './dial-number-input';
import { NumberInputOverlay } from './number-input-overlay';

import { DarkTheme } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import type { WorkoutSet, WeightUnit } from '@/types/workout';

interface Props {
  set: WorkoutSet;
  roundNumber: number;
  onUpdate: (field: 'reps' | 'weight' | 'weightUnit', value: number | WeightUnit) => void;
  onDelete: () => void;
  onDragStart?: () => void;
}

export function WorkoutSetRow({ set, roundNumber, onUpdate, onDelete, onDragStart }: Props) {
  const [overlayField, setOverlayField] = useState<'reps' | 'weight' | null>(null);

  return (
    <View style={styles.row}>
      {onDragStart ? (
        <Pressable
          onLongPress={() => { haptic.heavy(); onDragStart(); }}
          delayLongPress={250}
          hitSlop={4}
          style={styles.roundHandle}>
          <Text style={styles.round}>{roundNumber}</Text>
        </Pressable>
      ) : (
        <Text style={styles.round}>{roundNumber}</Text>
      )}

      <DialNumberInput
        value={set.weight}
        onChange={(v) => onUpdate('weight', v)}
        step={0.5}
        decimalPlaces={1}
        width={80}
        onTap={() => setOverlayField('weight')}
      />

      <Pressable
        onPress={() => {
          haptic.selection();
          onUpdate('weightUnit', set.weightUnit === 'kg' ? 'lbs' : 'kg');
        }}
        style={styles.unitBtn}
        hitSlop={4}>
        <Text
          style={[
            styles.unitText,
            {
              color:
                set.weightUnit === 'kg' ? DarkTheme.accentCyan : DarkTheme.textSecondary,
            },
          ]}>
          {set.weightUnit}
        </Text>
      </Pressable>

      <Text style={styles.times}>×</Text>

      <DialNumberInput
        value={set.reps}
        onChange={(v) => onUpdate('reps', v)}
        step={1}
        decimalPlaces={0}
        width={64}
        onTap={() => setOverlayField('reps')}
      />

      <Pressable onPress={() => { haptic.warning(); onDelete(); }} style={styles.deleteBtn} hitSlop={8}>
        <Text style={styles.deleteIcon}>✕</Text>
      </Pressable>

      <NumberInputOverlay
        visible={overlayField !== null}
        value={overlayField === 'reps' ? set.reps : set.weight}
        onConfirm={(v) => {
          if (overlayField) onUpdate(overlayField, v);
          setOverlayField(null);
        }}
        onClose={() => setOverlayField(null)}
        keyboardType={overlayField === 'weight' ? 'decimal-pad' : 'number-pad'}
        decimalPlaces={overlayField === 'weight' ? 1 : 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  round: {
    color: DarkTheme.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    width: 24,
    textAlign: 'center',
  },
  roundHandle: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  times: {
    color: DarkTheme.textTertiary,
    fontSize: 14,
  },
  unitBtn: {
    minWidth: 32,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitText: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    color: DarkTheme.textTertiary,
    fontSize: 14,
  },
});
