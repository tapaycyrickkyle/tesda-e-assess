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
          <Link className="transition hover:text-[#002576]" href="/applicant/room">
            Rooms
          </Link>
          <i aria-hidden="true" className="fa-solid fa-chevron-right text-[11px]" />
          <span className="font-bold text-[#002576]">{room.name}</span>
        </nav>

        <section className="mb-6 overflow-hidden rounded-2xl border border-[#c4c5d5] bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eff4ff] text-[#002576] sm:flex">
                  <i aria-hidden="true" className="fa-solid fa-door-open text-[16px]" />
                </div>

                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${
                        room.is_active ? "bg-[#dce1ff] text-[#093cab]" : "bg-[#dfe0e0] text-[#616363]"
                      }`}
                    >
                      {room.is_active ? "Active Room" : "Inactive Room"}
                    </span>
                    <span className="rounded-full bg-[#eff4ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#3056c4]">
                      {room.qualification}
                    </span>
                  </div>

                  <h1 className="text-[1.85rem] font-bold leading-[1.05] text-[#002576] sm:text-[2rem]">{room.name}</h1>
                  <p className="mt-2 max-w-[42rem] text-[15px] leading-[1.55] text-[#444653]">
                    You have successfully joined this assessment room. Keep the room code ready in case your teacher asks for confirmation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:max-w-[320px] sm:grid-cols-2 xl:min-w-[300px] xl:max-w-[300px] xl:grid-cols-1">
                <SummaryCard label="Joined At" value={formatJoinedAt(membership.joined_at)} />
                <SummaryCard label="Join Code" mono value={room.join_code} />
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

function SummaryCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#d9e3f7] bg-[#f8fbff] px-5 py-3.5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#747685]">{label}</p>
      <p className={`mt-1.5 text-[14px] font-bold leading-[1.45] text-[#0b1c30] ${mono ? "font-mono tracking-[0.14em] text-[#002576]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function formatJoinedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
