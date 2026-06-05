export function buildCoachInviteUrl(inviteCode: string): string {
  return `sportvault://invite/${inviteCode}`;
}
