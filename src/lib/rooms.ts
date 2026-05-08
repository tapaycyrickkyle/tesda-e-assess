export const ROOM_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type RoomRecord = {
  id: string;
  name: string;
  qualification: string;
  join_code: string;
  is_active: boolean;
  created_at: string;
  member_count?: number;
};

export function generateRoomCode(length = 6) {
  const values = crypto.getRandomValues(new Uint32Array(length));
  let code = "";

  for (const value of values) {
    code += ROOM_CODE_CHARSET[value % ROOM_CODE_CHARSET.length];
  }

  return code;
}

export function normalizeRoomCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
