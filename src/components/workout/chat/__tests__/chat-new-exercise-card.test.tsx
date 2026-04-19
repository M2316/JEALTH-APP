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
      exerciseId: '', name: '스쿼트',
      sets: [
        { round: 1, reps: 10, weight: 100, weightUnit: 'kg' },
        { round: 2, reps: 8, weight: 105, weightUnit: 'kg' },
      ],
    }],
  },
  status: 'pending',
  createdAt: 1,
  kind: 'new_exercise',
  muscleGroups: [
    { id: 'mg-leg', name: '하체' },
    { id: 'mg-quad', name: '대퇴사두' },
    { id: 'mg-chest', name: '가슴' },
  ],
  suggestedMuscleGroupIds: ['mg-leg', 'mg-quad'],
  ...overrides,
});

describe('ChatNewExerciseCard', () => {
  it('initially selects suggested muscle group ids', () => {
    const { getByTestId } = render(
      <ChatNewExerciseCard
        message={baseMsg()}
        saving={false}
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />,
    );
    expect(getByTestId('mg-chip-mg-leg').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('mg-chip-mg-quad').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('mg-chip-mg-chest').props.accessibilityState.selected).toBe(false);
  });

  it('toggles muscle group selection on chip press', () => {
    const { getByTestId } = render(
      <ChatNewExerciseCard
        message={baseMsg()}
        saving={false}
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />,
    );
    fireEvent.press(getByTestId('mg-chip-mg-leg'));
    expect(getByTestId('mg-chip-mg-leg').props.accessibilityState.selected).toBe(false);
    fireEvent.press(getByTestId('mg-chip-mg-chest'));
    expect(getByTestId('mg-chip-mg-chest').props.accessibilityState.selected).toBe(true);
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

  it('calls onApprove with currently selected ids', () => {
    const onApprove = jest.fn();
    const { getByTestId } = render(
      <ChatNewExerciseCard
        message={baseMsg()}
        saving={false}
        onApprove={onApprove}
        onReject={jest.fn()}
      />,
    );
    fireEvent.press(getByTestId('mg-chip-mg-chest'));
    fireEvent.press(getByTestId('approve-btn'));
    expect(onApprove).toHaveBeenCalledWith(['mg-leg', 'mg-quad', 'mg-chest']);
  });

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
    expect(getByText(/2세트/)).toBeTruthy();
  });
});
