import { redirect } from "next/navigation";

type RouteProps = {
  params: Promise<{
    roomId: string;
  }>;
  searchParams: Promise<{ edit?: string | string[]; submissionId?: string | string[] }>;
};

export default async function RoomApplicationPage({ params, searchParams }: RouteProps) {
  const { roomId } = await params;
  const resolvedSearchParams = await searchParams;
  const editParam = Array.isArray(resolvedSearchParams.edit) ? resolvedSearchParams.edit[0] : resolvedSearchParams.edit;
  const submissionId = Array.isArray(resolvedSearchParams.submissionId)
    ? resolvedSearchParams.submissionId[0]
    : resolvedSearchParams.submissionId;

  const redirectParams = new URLSearchParams();
  redirectParams.set("roomId", roomId);

  if (editParam) {
    redirectParams.set("edit", editParam);
  }

  if (submissionId?.trim()) {
    redirectParams.set("submissionId", submissionId.trim());
  }

  redirect(`/applicant/apply/individual?${redirectParams.toString()}`);
}
