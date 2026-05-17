import NotificationBanner from "@/components/notifications/NotificationBanner";
import type { CurrentAppUser } from "@/lib/current-user";
import type { UserProfileView } from "@/lib/user-profile";

type UserProfilePageProps = {
  currentUser: CurrentAppUser;
  profileView: UserProfileView;
};

function getRoleHeading(role: CurrentAppUser["role"]) {
  if (role === "assessment_center") {
    return "Assessment Center Profile";
  }

  return `${role.charAt(0).toUpperCase() + role.slice(1)} Profile`;
}

export default function UserProfilePage({ currentUser, profileView }: UserProfilePageProps) {
  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content-narrow">
        <section className="mb-5">
          <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">{getRoleHeading(currentUser.role)}</h1>
          <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
            Review the account details currently linked to your portal access.
          </p>
        </section>

        {profileView.notice ? <NotificationBanner className="mb-5" message={profileView.notice} variant="warning" /> : null}

        <section className="mb-5 rounded-[12px] border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Account Overview</p>
          <div className="mt-3">
            <div>
              <h2 className="text-[24px] font-bold leading-[1.2] text-[#0b1c30]">{profileView.displayName}</h2>
              <p className="mt-1 text-[14px] leading-[1.55] text-[#444653]">{currentUser.email}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {profileView.sections.map((section) => (
            <article key={section.title} className="rounded-[12px] border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">{section.title}</p>
              <div className="mt-4 space-y-3">
                {section.fields.map((field) => (
                  <div key={field.label} className="rounded-[10px] border border-[#e3ebfb] bg-[#fbfdff] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">{field.label}</p>
                    <p className="mt-1.5 text-[14px] font-semibold leading-[1.55] text-[#0b1c30]">{field.value}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
