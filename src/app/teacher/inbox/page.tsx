import { notFound } from "next/navigation";
import PortalNotificationsView from "@/components/PortalNotificationsView";
import { getCurrentAppUser } from "@/lib/current-user";
import { loadNotificationsForUser, markNotificationsRead } from "@/lib/workflow-history";

export default async function TeacherNotificationsPage() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "teacher") {
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
      description="Review the latest workflow alerts tied to your room-based submission flow."
      emptyMessage="You have no teacher workflow alerts yet. Room-related updates will appear here when additional notifications are generated for your account."
      notifications={displayedNotifications}
      relatedHref="/teacher/rooms"
      relatedLabel="Open Rooms"
      title="Inbox"
      unreadCount={0}
    />
  );
}
