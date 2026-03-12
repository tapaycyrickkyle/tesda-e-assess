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
    <article className="student-dashboard-stat-card">
      <p className="student-dashboard-stat-title">
        {title}
      </p>

      {typeof progress === "number" ? (
        <div className="mt-5 flex items-center gap-5">
          <p className="student-dashboard-stat-value is-progress">
            {value}
          </p>
          <div className="student-dashboard-progress-track flex-1">
            <span
              className="student-dashboard-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : status ? (
        <div className="mt-5 flex items-center gap-4">
          <span className="student-dashboard-inline-status-dot" />
          <p className="student-dashboard-stat-value is-status">
            {value}
          </p>
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-4">
          <span className="student-dashboard-stat-icon">
            {icon}
          </span>
          <div>
            <p className="student-dashboard-stat-value">
              {value}
            </p>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </article>
  );
};

export default StudentDashboardStatsCard;
