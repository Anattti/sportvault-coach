import { format } from 'date-fns';
import { fi } from 'date-fns/locale';

export type WorkoutUpdaterRole = 'coach' | 'athlete' | 'self';

export function resolveWorkoutUpdaterRole(
  updatedBy: string | null | undefined,
  ownerId: string,
  viewerId?: string,
): WorkoutUpdaterRole {
  const editorId = updatedBy ?? ownerId;

  if (editorId !== ownerId) {
    return 'coach';
  }

  if (viewerId && editorId === viewerId) {
    return 'self';
  }

  return 'athlete';
}

export function getWorkoutUpdaterLabel(
  role: WorkoutUpdaterRole,
  nickname: string | null | undefined,
): string {
  if (role === 'coach') return nickname ?? 'Valmentaja';
  if (role === 'self') return 'Sinä';
  return nickname ?? 'Urheilija';
}

export function formatWorkoutUpdatedAt(updatedAt: string): string {
  return format(new Date(updatedAt), 'd.M.yyyy HH:mm', { locale: fi });
}

export function formatWorkoutUpdateMeta({
  updatedAt,
  updatedBy,
  ownerId,
  updaterNickname,
  viewerId,
}: {
  updatedAt: string;
  updatedBy?: string | null;
  ownerId: string;
  updaterNickname?: string | null;
  viewerId?: string;
}): string {
  const role = resolveWorkoutUpdaterRole(updatedBy, ownerId, viewerId);
  const who = getWorkoutUpdaterLabel(role, updaterNickname);
  const when = formatWorkoutUpdatedAt(updatedAt);

  return `Päivitetty ${when} · ${who}`;
}

export function buildUpdaterNicknameMap(
  profiles: Array<{ id: string; nickname: string | null }> | null | undefined,
): Record<string, string | null> {
  return Object.fromEntries((profiles ?? []).map((profile) => [profile.id, profile.nickname]));
}

export function collectWorkoutEditorIds(
  workouts: Array<{ updated_by?: string | null; user_id: string }>,
): string[] {
  return [
    ...new Set(
      workouts.map((workout) => workout.updated_by ?? workout.user_id).filter(Boolean),
    ),
  ] as string[];
}
