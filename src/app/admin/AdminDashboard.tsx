"use client";

const verificationRows = [
  {
    initials: "RM",
    name: "Ricardo Mercader",
    email: "r.mercader@edu.ph",
    role: "TVET Instructor",
    institution: "Samar Tech Institute",
    idType: "PRC License",
  },
  {
    initials: "EL",
    name: "Elena Ledesma",
    email: "e.ledesma@gov.ph",
    role: "Assessor",
    institution: "TESDA Regional Center",
    idType: "National ID",
  },
  {
    initials: "JS",
    name: "Julian Salazar",
    email: "j.salazar@school.ph",
    role: "Master Trainer",
    institution: "Borongan Poly Academy",
    idType: "Passport",
  },
];
export default function AdminDashboard() {
  return (
    <main className="min-h-screen pt-6 lg:ml-64">
      <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Admin Overview</h1>
            <p className="mt-1 text-[#444653]">Management console for Eastern Samar regional assessment centers.</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["fa-solid fa-users", "+12%", "Total Applicants", "2,548", "#002576"],
            ["fa-solid fa-graduation-cap", "+3%", "Total Teachers", "342", "#002576"],
            ["fa-solid fa-user-check", "New", "Teacher Verifications", "24", "#5d5f5f"],
          ].map(([icon, tag, label, value, color]) => (
            <div
              key={String(label)}
              className="flex min-h-[170px] flex-col justify-between rounded-xl border border-[#c4c5d5]/30 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg p-2" style={{ backgroundColor: `${String(color)}1a`, color: String(color) }}>
                  <i className={String(icon)} />
                </div>
                <span className="text-xs font-bold" style={{ color: String(color) }}>
                  {tag}
                </span>
              </div>
              <div>
                <p className="mb-1 text-sm text-[#444653]">{label}</p>
                <h4 className="text-3xl font-semibold">{value}</h4>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 items-start gap-8">
          <div className="overflow-hidden rounded-xl border border-[#c4c5d5]/30 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#c4c5d5] bg-[#eff4ff]/50 px-6 py-4">
              <h3 className="text-2xl font-semibold">Teacher Verification Requests</h3>
              <button className="text-sm font-bold text-[#002576] hover:underline" type="button">
                View All Requests
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#c4c5d5] bg-[#eff4ff]/30">
                    <th className="px-6 py-4 text-sm text-[#444653]">Teacher Name</th>
                    <th className="px-6 py-4 text-sm text-[#444653]">Type/Institution</th>
                    <th className="px-6 py-4 text-sm text-[#444653]">Uploaded ID</th>
                    <th className="px-6 py-4 text-sm text-[#444653]">Status</th>
                    <th className="px-6 py-4 text-right text-sm text-[#444653]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c5d5]/20">
                  {verificationRows.map((row) => (
                    <tr key={row.email} className="transition-colors hover:bg-[#f8f9ff]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0038a8] text-xs font-bold text-white">
                            {row.initials}
                          </div>
                          <div>
                            <p className="font-bold">{row.name}</p>
                            <p className="text-xs text-[#444653]">{row.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">{row.role}</p>
                        <p className="text-xs text-[#444653]">{row.institution}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-[#002576]">
                          <i className="fa-solid fa-paperclip" />
                          {row.idType}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-[#002576]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#002576]">
                          Pending
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="rounded-lg p-2 text-[#002576] transition-all hover:bg-[#002576]/5" type="button">
                          <i className="fa-regular fa-eye" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
