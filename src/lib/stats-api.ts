import { api } from '@/lib/api';
import type {
  VolumeData,
  PersonalRecord,
  MuscleBreakdownItem,
} from '@/types/workout';

export const fetchVolume = (start: string, end: string) =>
  api<VolumeData[]>(`/stats/volume?start=${start}&end=${end}`);

export const fetchRecords = (exerciseId?: string) =>
  api<PersonalRecord[]>(
    `/stats/records${exerciseId ? '?exerciseId=' + exerciseId : ''}`,
  );

export const fetchMuscleBreakdown = (start: string, end: string) =>
  api<MuscleBreakdownItem[]>(
    `/stats/muscle-breakdown?start=${start}&end=${end}`,
  );
