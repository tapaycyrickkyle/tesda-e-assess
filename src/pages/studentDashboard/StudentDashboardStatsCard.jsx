import React from "react";

const StudentDashboardStatsCard = ({
  title,
  value,
  description,
  icon,
  progress,
  status,
}) => {
  return (
    <article className="ui-card rounded-2xl border border-slate-200 p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {title}
      </p>

      {typeof progress === "number" ? (
        <div className="mt-4 flex items-center gap-4">
          <p className="text-4xl font-bold leading-none text-blue-700">{value}</p>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
            <span
              className="block h-full rounded-full bg-blue-600"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : status ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <p>{value}</p>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            {icon}
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">{value}</p>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
      )}
    </article>
  );
};

export default StudentDashboardStatsCard;
