import TeacherRoomClient from "@/app/teacher/room/TeacherRoomClient";
import { getCurrentAppUser } from "@/lib/current-user";
import type { RoomRecord } from "@/lib/rooms";
import { createSupabaseAccessTokenClient } from "@/lib/supabase";

export default async function TeacherRoomPage() {
  let initialRooms: RoomRecord[] = [];
  let initialLoadError = "";

  const currentUser = await getCurrentAppUser();

  if (currentUser?.role === "teacher") {
    const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);
    const { data, error } = await supabase
      .from("rooms")
      .select("id, name, qualification, join_code, is_active, created_at")
      .eq("teacher_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      initialLoadError =
        "Unable to load rooms yet. Make sure the `rooms` table and its RLS policies are created in Supabase.";
    } else {
      const rooms = (data ?? []) as RoomRecord[];

      if (rooms.length > 0) {
        const { data: memberships } = await supabase
          .from("room_members")
          .select("room_id")
          .in(
            "room_id",
            rooms.map((room) => room.id),
          );

        const counts = new Map<string, number>();

        for (const membership of memberships ?? []) {
          const roomId = (membership as { room_id: string }).room_id;
          counts.set(roomId, (counts.get(roomId) ?? 0) + 1);
        }

        initialRooms = rooms.map((room) => ({
          ...room,
          member_count: counts.get(room.id) ?? 0,
        }));
      } else {
        initialRooms = rooms;
      }
    }
  }

  return <TeacherRoomClient initialLoadError={initialLoadError} initialRooms={initialRooms} />;
}
