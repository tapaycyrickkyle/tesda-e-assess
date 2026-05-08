import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAccessTokenClient } from "@/lib/supabase";

type RouteProps = {
  params: Promise<{
    roomId: string;
  }>;
};

type JoinedRoomRecord = {
  id: string;
  joined_at: string;
  rooms:
    | {
        id: string;
        name: string;
        qualification: string;
        join_code: string;
        is_active: boolean;
        created_at: string;
      }
    | {
        id: string;
        name: string;
        qualification: string;
        join_code: string;
        is_active: boolean;
        created_at: string;
      }[]
    | null;
};

export default async function ApplicantRoomDetailPage({ params }: RouteProps) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "student") {
    notFound();
  }

  const { roomId } = await params;
  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);

  const { data, error } = await supabase
    .from("room_members")
    .select("id, joined_at, rooms(id, name, qualification, join_code, is_active, created_at)")
    .eq("applicant_id", currentUser.id)
    .eq("room_id", roomId)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const membership = data as JoinedRoomRecord;
  const room = Array.isArray(membership.rooms) ? membership.rooms[0] : membership.rooms;

  if (!room) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 pb-8 pt-8 sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#747685]">
          <Link className="transition hover:text-[#002576]" href="/applicant/dashboard">
            Dashboard
          </Link>
          <i aria-hidden="true" className="fa-solid fa-chevron-right text-[11px]" />
          <Link className="transition hover:text-[#002576]" href="/applicant/join-room">
            Rooms
          </Link>
          <i aria-hidden="true" className="fa-solid fa-chevron-right text-[11px]" />
          <span className="font-bold text-[#002576]">{room.name}</span>
        </nav>

        <section className="mb-8 rounded-2xl border border-[#c4c5d5] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${
                    room.is_active ? "bg-[#dce1ff] text-[#093cab]" : "bg-[#dfe0e0] text-[#616363]"
                  }`}
                >
                  {room.is_active ? "Active Room" : "Inactive Room"}
                </span>
                <span className="rounded-full bg-[#eff4ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5d5f5f]">
                  {room.qualification}
                </span>
              </div>

              <h1 className="text-[2rem] font-bold leading-[1.15] text-[#002576]">{room.name}</h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-[1.6] text-[#444653]">
                You have successfully joined this assessment room. Keep the room code ready in case your teacher asks for confirmation.
              </p>
            </div>

            <div className="rounded-2xl border border-[#d9e3f7] bg-[#f8fbff] px-5 py-4">
              <p className="text-[12px] font-semibold text-[#747685]">Joined At</p>
              <p className="mt-1 text-[14px] font-medium text-[#0b1c30]">
                {new Date(membership.joined_at).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6">
          <section className="rounded-2xl border border-[#c4c5d5] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[22px] font-semibold text-[#0b1c30]">Room Details</h2>
                <p className="mt-1 text-[14px] leading-[1.55] text-[#444653]">
                  Keep these details handy while you wait for your assessment instructions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <DetailCard label="Room Name" value={room.name} />
              <DetailCard label="Qualification" value={room.qualification} />
              <DetailCard label="Join Code" mono value={room.join_code} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function DetailCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-[#d9e3f7] bg-[#f8fbff] p-4 transition hover:border-[#c9d7f5] hover:bg-white">
      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#747685]">{label}</p>
      <p className={`mt-2 text-[15px] font-bold leading-[1.35] text-[#0b1c30] ${mono ? "font-mono tracking-[0.14em] text-[#002576]" : ""}`}>{value}</p>
    </div>
  );
}
