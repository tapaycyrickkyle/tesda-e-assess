import { notFound } from "next/navigation";
import PortalNotificationsView from "@/components/PortalNotificationsView";
import { getCurrentAppUser } from "@/lib/current-user";
import { loadNotificationsForUser, markNotificationsRead } from "@/lib/workflow-history";

export default async function AdminNotificationsPage() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "admin") {
    notFound();
  }

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
      description="Review workflow alerts sent to the TESDA admin queue."
      emptyMessage="You have no admin workflow alerts yet. Teacher-forwarded room submissions and reassignment activity will appear here."
      notifications={displayedNotifications}
      relatedHref="/admin/overview"
      relatedLabel="Open Overview"
      title="Inbox"
      unreadCount={0}
    />
  );
}
