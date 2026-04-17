import { api, getToken } from '@/lib/api';
import type {
  MuscleGroup,
  Exercise,
  WorkoutRoutine,
  CreateRoutinePayload,
} from '@/types/workout';

const BASE_URL = __DEV__
  ? 'https://test.jealth.shop'
  : 'https://jealth.shop';

export function fetchMuscleGroups() {
  return api<MuscleGroup[]>('/exercises/muscle-groups');
}

export function fetchExercises(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return api<Exercise[]>(`/exercises${query}`);
}

export function createExercise(data: {
  name: string;
  equipment?: string;
  muscleGroupIds?: string[];
}) {
  return api<Exercise>('/exercises', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function uploadExerciseImage(id: string, uri: string) {
  const token = await getToken();
  const formData = new FormData();

  const filename = uri.split('/').pop() ?? 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri,
    name: filename,
    type,
  } as unknown as Blob);

  const res = await fetch(`${BASE_URL}/exercises/${id}/image`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Image upload failed');
  }

  return res.json() as Promise<Exercise>;
}

export function fetchAllRoutines() {
  return api<WorkoutRoutine[]>('/routines');
}

export function fetchRoutinesByDate(date: string) {
  return api<WorkoutRoutine[]>(`/routines?date=${date}`);
}

export function fetchRoutinesByRange(start: string, end: string) {
  return api<WorkoutRoutine[]>(`/routines?start=${start}&end=${end}`);
}

export function createRoutine(data: CreateRoutinePayload) {
  return api<WorkoutRoutine>('/routines', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateRoutine(
  id: string,
  data: Partial<CreateRoutinePayload>,
) {
  return api<WorkoutRoutine>(`/routines/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteRoutine(id: string) {
  return api<void>(`/routines/${id}`, { method: 'DELETE' });
}

export function copyRoutine(id: string, date: string) {
  return api<WorkoutRoutine>(`/routines/${id}/copy`, {
    method: 'POST',
    body: JSON.stringify({ date }),
  });
}
