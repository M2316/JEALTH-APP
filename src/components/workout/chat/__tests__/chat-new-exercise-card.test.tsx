import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChatNewExerciseCard } from '../chat-new-exercise-card';
import type { ChatMessage } from '@/types/chat';

const baseMsg = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 1,
  date: '2026-04-19',
  role: 'assistant',
  content: '스쿼트 신규 추가할까요?',
  draft: {
    exercises: [{
      exerciseId: '', name: '푸쉬업',
      sets: [
        { round: 1, reps: 100, weight: 0, weightUnit: 'kg' },
      ],
    }],
  },
  status: 'pending',
  createdAt: 1,
  kind: 'new_exercise',
  muscleGroups: [
    { id: 'mg-leg', name: '하체' },
    { id: 'mg-chest', name: '가슴' },
    { id: 'mg-core', name: '코어' },
  ],
  suggestedMuscleGroupIds: ['mg-chest'],
  suggestedEquipment: '맨몸',
  ...overrides,
});

describe('ChatNewExerciseCard', () => {
  describe('Step 1 (name confirm)', () => {
    it('shows Step 1 when originalName differs from name', () => {
      const { getByTestId, getByText } = render(
        <ChatNewExerciseCard
          message={baseMsg({ originalName: '푸귀업' })}
          saving={false}
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />,
      );
      expect(getByText(/이게 맞나요/)).toBeTruthy();
      expect(getByTestId('name-btn-original').props.children).toBeDefined();
      expect(getByTestId('name-btn-corrected').props.children).toBeDefined();
    });

    it('skips Step 1 when originalName is undefined', () => {
      const { queryByTestId } = render(
        <ChatNewExerciseCard
          message={baseMsg()}
          saving={false}
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />,
      );
      expect(queryByTestId('name-btn-original')).toBeNull();
      expect(queryByTestId('approve-btn')).toBeTruthy();
    });

    it('skips Step 1 when originalName equals name', () => {
      const { queryByTestId } = render(
        <ChatNewExerciseCard
          message={baseMsg({ originalName: '푸쉬업' })}
          saving={false}
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />,
      );
      expect(queryByTestId('name-btn-original')).toBeNull();
    });

    it('choosing original name proceeds to Step 2 with that name', () => {
      const onApprove = jest.fn();
      const { getByTestId } = render(
        <ChatNewExerciseCard
          message={baseMsg({ originalName: '푸귀업' })}
          saving={false}
          onApprove={onApprove}
          onReject={jest.fn()}
        />,
      );
      fireEvent.press(getByTestId('name-btn-original'));
      fireEvent.press(getByTestId('approve-btn'));
      expect(onApprove).toHaveBeenCalledWith(
        expect.objectContaining({ name: '푸귀업' }),
      );
    });

    it('choosing corrected name proceeds to Step 2 with that name', () => {
      const onApprove = jest.fn();
      const { getByTestId } = render(
        <ChatNewExerciseCard
          message={baseMsg({ originalName: '푸귀업' })}
          saving={false}
          onApprove={onApprove}
          onReject={jest.fn()}
        />,
      );
      fireEvent.press(getByTestId('name-btn-corrected'));
      fireEvent.press(getByTestId('approve-btn'));
      expect(onApprove).toHaveBeenCalledWith(
        expect.objectContaining({ name: '푸쉬업' }),
      );
    });
  });

  describe('Step 2 (meta)', () => {
    it('initially selects suggestedMuscleGroupIds and suggestedEquipment', () => {
      const { getByTestId } = render(
        <ChatNewExerciseCard
          message={baseMsg()}
          saving={false}
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />,
      );
      expect(getByTestId('mg-chip-mg-chest').props.accessibilityState.selected).toBe(true);
      expect(getByTestId('mg-chip-mg-leg').props.accessibilityState.selected).toBe(false);
      expect(getByTestId('eq-chip-맨몸').props.accessibilityState.selected).toBe(true);
      expect(getByTestId('eq-chip-바벨').props.accessibilityState.selected).toBe(false);
    });

    it('equipment chips single-select toggle (tapping another replaces)', () => {
      const { getByTestId } = render(
        <ChatNewExerciseCard
          message={baseMsg()}
          saving={false}
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />,
      );
      fireEvent.press(getByTestId('eq-chip-바벨'));
      expect(getByTestId('eq-chip-바벨').props.accessibilityState.selected).toBe(true);
      expect(getByTestId('eq-chip-맨몸').props.accessibilityState.selected).toBe(false);
    });

    it('tapping selected equipment deselects it', () => {
      const { getByTestId } = render(
        <ChatNewExerciseCard
          message={baseMsg()}
          saving={false}
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />,
      );
      fireEvent.press(getByTestId('eq-chip-맨몸'));
      expect(getByTestId('eq-chip-맨몸').props.accessibilityState.selected).toBe(false);
    });

    it('approve passes muscleGroupIds, equipment, and name to onApprove', () => {
      const onApprove = jest.fn();
      const { getByTestId } = render(
        <ChatNewExerciseCard
          message={baseMsg()}
          saving={false}
          onApprove={onApprove}
          onReject={jest.fn()}
        />,
      );
      fireEvent.press(getByTestId('mg-chip-mg-leg'));
      fireEvent.press(getByTestId('eq-chip-바벨'));
      fireEvent.press(getByTestId('approve-btn'));
      expect(onApprove).toHaveBeenCalledWith({
        muscleGroupIds: ['mg-chest', 'mg-leg'],
        equipment: '바벨',
        name: '푸쉬업',
      });
    });

    it('approve passes equipment=undefined when none selected', () => {
      const onApprove = jest.fn();
      const { getByTestId } = render(
        <ChatNewExerciseCard
          message={baseMsg({ suggestedEquipment: undefined })}
          saving={false}
          onApprove={onApprove}
          onReject={jest.fn()}
        />,
      );
      fireEvent.press(getByTestId('approve-btn'));
      expect(onApprove).toHaveBeenCalledWith({
        muscleGroupIds: ['mg-chest'],
        equipment: undefined,
        name: '푸쉬업',
      });
    });

    it('approve button disabled when no muscle group selected', () => {
      const onApprove = jest.fn();
      const { getByTestId } = render(
        <ChatNewExerciseCard
          message={baseMsg({ suggestedMuscleGroupIds: [] })}
          saving={false}
          onApprove={onApprove}
          onReject={jest.fn()}
        />,
      );
      const btn = getByTestId('approve-btn');
      expect(btn.props.accessibilityState.disabled).toBe(true);
      fireEvent.press(btn);
      expect(onApprove).not.toHaveBeenCalled();
    });

    it('shows warning banner when suggestedMuscleGroupIds is empty', () => {
      const { getByText } = render(
        <ChatNewExerciseCard
          message={baseMsg({ suggestedMuscleGroupIds: [] })}
          saving={false}
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />,
      );
      expect(getByText(/근육 그룹을 추정하지 못했어요/)).toBeTruthy();
    });

    it('renders all sets', () => {
      const { getByText } = render(
        <ChatNewExerciseCard
          message={baseMsg()}
          saving={false}
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />,
      );
      expect(getByText(/1세트/)).toBeTruthy();
    });
  });

  describe('Common', () => {
    it('calls onReject on reject button press', () => {
      const onReject = jest.fn();
      const { getByTestId } = render(
        <ChatNewExerciseCard
          message={baseMsg()}
          saving={false}
          onApprove={jest.fn()}
          onReject={onReject}
        />,
      );
      fireEvent.press(getByTestId('reject-btn'));
      expect(onReject).toHaveBeenCalled();
    });

    it('renders saved state when status === saved', () => {
      const { queryByTestId, getByText } = render(
        <ChatNewExerciseCard
          message={baseMsg({ status: 'saved' })}
          saving={false}
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />,
      );
      expect(queryByTestId('approve-btn')).toBeNull();
      expect(getByText(/저장됨/)).toBeTruthy();
    });
  });
});
