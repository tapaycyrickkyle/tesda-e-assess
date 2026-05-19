export function formatPortalNotificationDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatPortalNotificationRelativeTime(value: string) {
  const now = Date.now();
  const timestamp = new Date(value).getTime();
  const diffSeconds = Math.round((timestamp - now) / 1000);
  const absoluteSeconds = Math.abs(diffSeconds);

  if (absoluteSeconds < 60) {
    return "Just now";
  }

  const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absoluteSeconds < 3600) {
    return relativeTimeFormatter.format(Math.round(diffSeconds / 60), "minute");
  }

  if (absoluteSeconds < 86400) {
    return relativeTimeFormatter.format(Math.round(diffSeconds / 3600), "hour");
  }

  if (absoluteSeconds < 604800) {
    return relativeTimeFormatter.format(Math.round(diffSeconds / 86400), "day");
  }

  return formatPortalNotificationDateTime(value);
}

export function getPortalNotificationDateBucket(value: string) {
  const createdAt = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const createdDay = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
  const diffInDays = Math.round((today.getTime() - createdDay.getTime()) / 86400000);

  if (diffInDays <= 0) {
    return "Today";
  }

  if (diffInDays === 1) {
    return "Yesterday";
  }

  if (diffInDays < 7) {
    return "Earlier This Week";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(createdAt);
}

export function getPortalNotificationAccentClass(notificationType: string) {
  if (notificationType === "success") {
    return "border-[#cce9d8] bg-[#edf9f1] text-[#166534]";
  }

  if (notificationType === "error") {
    return "border-[#f2d1d1] bg-[#fff4f4] text-[#b42318]";
  }

  if (notificationType === "warning") {
    return "border-[#f1d8bf] bg-[#fff8e8] text-[#8a5200]";
  }

  return "border-[#d9e3f7] bg-[#eef4ff] text-[#3056c4]";
}

export function getPortalNotificationIconClass(notificationType: string) {
  if (notificationType === "success") {
    return "fa-solid fa-circle-check";
  }

  if (notificationType === "error") {
    return "fa-solid fa-circle-xmark";
  }

  if (notificationType === "warning") {
    return "fa-solid fa-triangle-exclamation";
  }

  return "fa-solid fa-bell";
}

export function getPortalNotificationLabel(notificationType: string) {
  if (notificationType === "success") {
    return "Success";
  }

  if (notificationType === "warning") {
    return "Warning";
  }

  if (notificationType === "error") {
    return "Alert";
  }

  return "Update";
}
