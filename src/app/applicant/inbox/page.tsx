import PortalNotificationsView from "@/components/PortalNotificationsView";
import { requireCurrentAppUserRole } from "@/lib/server-auth";
import { loadNotificationsForUser, markNotificationsRead } from "@/lib/workflow-history";

export default async function ApplicantNotificationsPage() {
  const currentUser = await requireCurrentAppUserRole("applicant");

  const notifications = await loadNotificationsForUser({
    email: currentUser.email,
    userId: currentUser.id,
  });
  const unreadNotificationIds = notifications.filter((notification) => !notification.is_read).map((notification) => notification.id);

  if (unreadNotificationIds.length > 0) {
    await markNotificationsRead({
      email: currentUser.email,
      notificationIds: unreadNotificationIds,
      userId: currentUser.id,
    }).catch(() => undefined);
  }

  const displayedNotifications =
    unreadNotificationIds.length > 0 ? notifications.map((notification) => ({ ...notification, is_read: true })) : notifications;

  return (
    <PortalNotificationsView
      description="Review status-change alerts for your submitted applications."
      emptyMessage="You have no workflow alerts yet. New updates will appear here after your applications move between queues or receive a status update."
      notifications={displayedNotifications}
      relatedHref="/applicant/submissions"
      relatedLabel="Open Submissions"
      title="Inbox"
      unreadCount={0}
    />
  );
}
