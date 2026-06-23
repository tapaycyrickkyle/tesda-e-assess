import PortalNotificationsView from "@/components/PortalNotificationsView";
import { requireCurrentAppUserRole } from "@/lib/server-auth";
import { loadNotificationsForUser, markNotificationsRead } from "@/lib/workflow-history";

export default async function AssessmentCenterNotificationsPage() {
  const currentUser = await requireCurrentAppUserRole("assessment_center");

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
      description="Review center assignment alerts and workflow messages for your portal."
      emptyMessage="You have no center workflow alerts yet. New TESDA assignments and related status messages will appear here."
      notifications={displayedNotifications}
      relatedHref="/assessment-center/reviews"
      relatedLabel="Open Reviews"
      title="Inbox"
      unreadCount={0}
    />
  );
}
