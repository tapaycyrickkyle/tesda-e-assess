import Link from "next/link";
import type { PortalNotificationEntry } from "@/lib/workflow-history";
import {
  formatPortalNotificationDateTime,
  formatPortalNotificationRelativeTime,
  getPortalNotificationAccentClass,
  getPortalNotificationDateBucket,
  getPortalNotificationIconClass,
  getPortalNotificationLabel,
} from "@/lib/portal-notifications-ui";

type PortalNotificationsViewProps = {
  description: string;
  emptyMessage: string;
  notifications: PortalNotificationEntry[];
  relatedHref?: string;
  relatedLabel?: string;
  title: string;
  unreadCount?: number;
};

export default function PortalNotificationsView({
  description,
  emptyMessage,
  notifications,
  relatedHref,
  relatedLabel,
  title,
  unreadCount = 0,
}: PortalNotificationsViewProps) {
  const groupedNotifications = notifications.reduce<Map<string, PortalNotificationEntry[]>>((groups, notification) => {
    const bucketLabel = getPortalNotificationDateBucket(notification.created_at);
    const entries = groups.get(bucketLabel) ?? [];
    entries.push(notification);
    groups.set(bucketLabel, entries);
    return groups;
  }, new Map());
  const bucketEntries = Array.from(groupedNotifications.entries());

  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="ui-page-header">
          <h1 className="ui-page-title text-[#002576]">{title}</h1>
          <p className="ui-page-description">{description}</p>
        </section>

        <section className="ui-surface overflow-hidden">
          <div className="border-b border-[#eaf0f9] px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Inbox</p>
                <h2 className="mt-2 text-[24px] font-bold leading-[1.2] text-[#0b1c30]">Latest notifications</h2>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 ? (
                  <span className="inline-flex min-h-[32px] items-center justify-center rounded-md bg-[#d92d20] px-3 text-[11px] font-bold uppercase tracking-[0.04em] text-white shadow-[0_8px_18px_rgba(217,45,32,0.16)]">
                    {unreadCount} new
                  </span>
                ) : null}
                {relatedHref && relatedLabel ? (
                  <Link
                    className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-[#f8fbff] px-4 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                    href={relatedHref}
                  >
                    {relatedLabel}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#edf2fb]">
            {bucketEntries.map(([bucketLabel, bucketNotifications]) => (
              <div key={bucketLabel}>
                <div className="bg-[#fbfcff] px-4 py-3 sm:px-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7ca5]">{bucketLabel}</p>
                </div>

                <div className="divide-y divide-[#edf2fb] bg-white">
                  {bucketNotifications.map((notification) => (
                    <article
                      key={notification.id}
                      className={`group relative px-4 py-4 transition hover:bg-[#f8fbff] sm:px-5 ${
                        notification.is_read ? "bg-white" : "bg-[linear-gradient(180deg,#f9fbff_0%,#f1f6ff_100%)]"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="relative shrink-0 pt-0.5">
                          <span
                            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-[15px] shadow-[0_1px_2px_rgba(15,23,42,0.05)] ${getPortalNotificationAccentClass(
                              notification.notification_type,
                            )}`}
                          >
                            <i aria-hidden="true" className={getPortalNotificationIconClass(notification.notification_type)} />
                          </span>
                          {!notification.is_read ? (
                            <span className="absolute -right-0.5 top-0 inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-[#1877f2]" />
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[15px] font-bold leading-[1.35] text-[#0b1c30]">{notification.title}</p>
                                {!notification.is_read ? <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#1877f2]" /> : null}
                              </div>
                              <p className="mt-1 text-[13px] leading-[1.65] text-[#444653]">{notification.message}</p>
                            </div>

                            <div className="shrink-0 sm:pl-4 sm:text-right">
                              <p className="text-[12px] font-semibold text-[#5d6474]">{formatPortalNotificationRelativeTime(notification.created_at)}</p>
                              <p className="mt-1 text-[11px] text-[#8a91a4]">{formatPortalNotificationDateTime(notification.created_at)}</p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex min-h-[28px] items-center justify-center rounded-md border px-3 text-[11px] font-bold uppercase tracking-[0.04em] ${getPortalNotificationAccentClass(
                                notification.notification_type,
                              )}`}
                            >
                              {getPortalNotificationLabel(notification.notification_type)}
                            </span>
                            {!notification.is_read ? (
                              <span className="inline-flex min-h-[28px] items-center justify-center rounded-md border border-[#cfe0ff] bg-white px-3 text-[11px] font-bold uppercase tracking-[0.04em] text-[#0038a8]">
                                New
                              </span>
                            ) : (
                              <span className="inline-flex min-h-[28px] items-center justify-center rounded-md border border-[#e3ebfb] bg-[#fbfdff] px-3 text-[11px] font-bold uppercase tracking-[0.04em] text-[#747685]">
                                Seen
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}

            {notifications.length === 0 ? (
              <div className="px-4 py-8 sm:px-5">
                <div className="rounded-xl bg-[#f8fbff] px-5 py-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#d9e3f7] bg-white text-[#3056c4] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                    <i aria-hidden="true" className="fa-regular fa-bell-slash text-[18px]" />
                  </div>
                  <p className="mt-3 text-[15px] font-bold text-[#0b1c30]">No notifications yet</p>
                  <p className="mt-1 text-[14px] leading-[1.6] text-[#444653]">{emptyMessage}</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
