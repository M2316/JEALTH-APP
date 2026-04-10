import React, { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { GlassSurface } from '../glass-surface';

import { DarkTheme } from '@/constants/theme';

interface NumberInputOverlayProps {
  visible: boolean;
  value: number;
  onConfirm: (value: number) => void;
  onClose: () => void;
  keyboardType?: 'number-pad' | 'decimal-pad';
  decimalPlaces?: number;
}

export function NumberInputOverlay({
  visible,
  value,
  onConfirm,
  onClose,
  keyboardType = 'number-pad',
  decimalPlaces = 0,
}: NumberInputOverlayProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleShow = useCallback(() => {
    const display = value > 0 ? value.toFixed(decimalPlaces) : '';
    setText(display);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [value, decimalPlaces]);

  const handleSubmit = useCallback(() => {
    const parsed = parseFloat(text) || 0;
    const rounded = Number(parsed.toFixed(decimalPlaces));
    onConfirm(rounded);
    onClose();
  }, [text, decimalPlaces, onConfirm, onClose]);

  const handleBlur = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={handleShow}
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}} style={styles.cardWrapper}>
          <GlassSurface
            variant="elevated"
            bordered
            borderRadius={12}
            style={styles.card}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={text}
              onChangeText={setText}
              keyboardType={keyboardType}
              placeholder="0"
              placeholderTextColor={DarkTheme.textTertiary}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              onBlur={handleBlur}
              selectTextOnFocus
            />
          </GlassSurface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cardWrapper: {
    width: 160,
  },
  card: {
    padding: 16,
  },
  input: {
    backgroundColor: DarkTheme.bgElevated,
    color: DarkTheme.textPrimary,
    height: 48,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
});
