import React from "react";
import SecretaryDashboardSidebar from "./SecretaryDashboardSidebar";
import SecretaryDashboardHeader from "./SecretaryDashboardHeader";

const applications = [
  {
    id: "M1",
    name: "Juan Dela Cruz",
    school: "Manila Training Center",
    course: "Automotive Servicing NC II",
    teacher: "Ms. Elena Santos",
  },
  {
    id: "M2",
    name: "Carlo Reyes",
    school: "Manila Training Center",
    course: "Computer Systems Servicing",
    teacher: "Mr. Paolo Reyes",
  },
  {
    id: "M3",
    name: "Liza de Vera",
    school: "Manila Training Center",
    course: "Electrical Installation",
    teacher: "Engr. Dominic Lopez",
  },
  {
    id: "M4",
    name: "Nico Villanueva",
    school: "Manila Training Center",
    course: "Welding NC II",
    teacher: "Mr. Arvin Bautista",
  },
  {
    id: "M5",
    name: "Sheena Galang",
    school: "Manila Training Center",
    course: "Bread and Pastry Production",
    teacher: "Chef Marjorie Lim",
  },
  {
    id: "M6",
    name: "Paolo Ignacio",
    school: "Manila Training Center",
    course: "Plumbing NC I",
    teacher: "Mr. Jerome Cruz",
  },
  {
    id: "Q1",
    name: "Maria Clara",
    school: "Quezon Skills Institute",
    course: "Computer Systems Servicing",
    teacher: "Mr. Roberto Diaz",
  },
  {
    id: "Q2",
    name: "Rex Delos Santos",
    school: "Quezon Skills Institute",
    course: "Electrical Installation",
    teacher: "Ms. Trina Morales",
  },
  {
    id: "Q3",
    name: "Aira Gomez",
    school: "Quezon Skills Institute",
    course: "Automotive Servicing NC II",
    teacher: "Mr. Joel Navarro",
  },
  {
    id: "Q4",
    name: "Bryan Cruz",
    school: "Quezon Skills Institute",
    course: "Masonry NC II",
    teacher: "Engr. Vincent Tan",
  },
  {
    id: "Q5",
    name: "Hazel Tan",
    school: "Quezon Skills Institute",
    course: "Bookkeeping NC III",
    teacher: "Ms. Kim Dizon",
  },
  {
    id: "Q6",
    name: "Mika Abad",
    school: "Quezon Skills Institute",
    course: "Cookery NC II",
    teacher: "Chef Noel Aquino",
  },
  {
    id: "D1",
    name: "Ricardo Dalisay",
    school: "Davao Tech School",
    course: "Electrical Installation",
    teacher: "Ms. Sarah Geronimo",
  },
  {
    id: "D2",
    name: "Jules Monta",
    school: "Davao Tech School",
    course: "Shielded Metal Arc Welding",
    teacher: "Mr. Carlo Uy",
  },
  {
    id: "D3",
    name: "Mona Reyes",
    school: "Davao Tech School",
    course: "Visual Graphics Design",
    teacher: "Ms. Andrea Lim",
  },
  {
    id: "D4",
    name: "Benito Cruz",
    school: "Davao Tech School",
    course: "Mechatronics Servicing",
    teacher: "Engr. Philip Ramos",
  },
  {
    id: "D5",
    name: "Jonel Rivera",
    school: "Davao Tech School",
    course: "Computer Hardware Servicing",
    teacher: "Mr. Leo Chavez",
  },
  {
    id: "D6",
    name: "Ariane Co",
    school: "Davao Tech School",
    course: "Housekeeping NC II",
    teacher: "Ms. Denise Pardo",
  },
  {
    id: "C1",
    name: "Andres Soriano",
    school: "Cebu Technical College",
    course: "Cookery NC II",
    teacher: "Chef Mario Lopez",
  },
  {
    id: "C2",
    name: "Janine Flores",
    school: "Cebu Technical College",
    course: "Front Office Services",
    teacher: "Ms. Camille Ong",
  },
  {
    id: "C3",
    name: "Neil Vergara",
    school: "Cebu Technical College",
    course: "Bartending NC II",
    teacher: "Mr. Paolo Mendez",
  },
  {
    id: "C4",
    name: "Rina Sulit",
    school: "Cebu Technical College",
    course: "Food and Beverage Services",
    teacher: "Ms. Aileen Mercado",
  },
  {
    id: "C5",
    name: "Mark Sison",
    school: "Cebu Technical College",
    course: "Dressmaking NC II",
    teacher: "Ms. Leah Cabrera",
  },
  {
    id: "C6",
    name: "Daphne Lao",
    school: "Cebu Technical College",
    course: "Tile Setting NC II",
    teacher: "Engr. Ronan Gutierrez",
  },
];

const tabs = [
  { label: "All Applications (124)", active: true },
  { label: "Pending Review (42)" },
  { label: "Verified (82)" },
];

const schoolsWithTeachers = Object.values(
  applications.reduce((acc, item) => {
    if (!acc[item.school]) {
      acc[item.school] = {
        school: item.school,
        teachers: {},
      };
    }

    if (!acc[item.school].teachers[item.teacher]) {
      acc[item.school].teachers[item.teacher] = [];
    }

    acc[item.school].teachers[item.teacher].push({
      id: item.id,
      name: item.name,
      course: item.course,
    });

    return acc;
  }, {}),
).map((school) => ({
  ...school,
  teachers: Object.entries(school.teachers).map(([name, applicants]) => ({
    name,
    applicants,
  })),
  totalApplicants: Object.values(school.teachers).reduce(
    (sum, applicants) => sum + applicants.length,
    0,
  ),
}));

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-current"
    >
      <path d="M3 5h18v2H3V5Zm3 6h12v2H6v-2Zm4 6h4v2h-4v-2Z" />
    </svg>
  );
}

const SecretaryDashboardPage = () => {
  const [selectedSchool, setSelectedSchool] = React.useState(null);
  const [expandedTeacher, setExpandedTeacher] = React.useState(null);
  const [teacherSearchQuery, setTeacherSearchQuery] = React.useState("");
  const filteredTeachers = selectedSchool
    ? selectedSchool.teachers.filter((teacher) =>
        teacher.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()),
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[300px_1fr]">
      <SecretaryDashboardSidebar />

      <div className="min-w-0">
        <SecretaryDashboardHeader />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <section>
            <h1 className="page-title">Application Management</h1>
            <p className="page-description">
              Review and manage incoming vocational scholarship applications for
              the current semester.
            </p>
          </section>

          <section className="ui-card mt-6 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 pt-2 sm:px-6">
              <div className="flex w-full items-center gap-1 overflow-x-auto whitespace-nowrap sm:w-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    className={`border-b-2 px-3 py-3 text-base font-medium transition ${
                      tab.active
                        ? "border-blue-600 text-blue-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="mb-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-base font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <FilterIcon />
                Filters
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[480px] w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      School
                    </th>
                    <th className="border-b border-slate-200 px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Total Applicants
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schoolsWithTeachers.map((item) => (
                    <tr key={item.school}>
                      <td className="border-b border-slate-200 px-6 py-4 text-base text-slate-700">
                        <button
                          type="button"
                          className="font-semibold text-blue-700 transition hover:text-blue-800 hover:underline"
                          onClick={() => {
                            setSelectedSchool(item);
                            setExpandedTeacher(null);
                            setTeacherSearchQuery("");
                          }}
                        >
                          {item.school}
                        </button>
                      </td>
                      <td className="border-b border-slate-200 px-6 py-4 text-right text-base font-semibold text-slate-700">
                        {item.totalApplicants}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-base text-slate-500 sm:px-6">
              <p>Showing {schoolsWithTeachers.length} schools with applicants</p>
            </div>
          </section>
        </main>
      </div>

      {selectedSchool ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="teachers-modal-title"
            className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="teachers-modal-title"
                  className="text-xl font-bold text-slate-900"
                >
                  {selectedSchool.school}
                </h2>
                <p className="mt-1 text-base text-slate-600">
                  Click the applicant count per teacher to view assigned
                  applicants.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSchool(null);
                  setExpandedTeacher(null);
                  setTeacherSearchQuery("");
                }}
                className="rounded-md px-2 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close teachers list"
              >
                X
              </button>
            </div>

            <div className="mt-4">
              <label className="sr-only" htmlFor="teacher-search">
                Search teacher
              </label>
              <input
                id="teacher-search"
                type="search"
                value={teacherSearchQuery}
                onChange={(event) => setTeacherSearchQuery(event.target.value)}
                placeholder="Search teacher name..."
                className="ui-input border-slate-200 bg-slate-100"
              />
            </div>

            <ul className="mt-5 space-y-2">
              {filteredTeachers.map((teacher) => (
                <li
                  key={teacher.name}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">
                      {teacher.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTeacher((current) =>
                          current === teacher.name ? null : teacher.name,
                        )
                      }
                      className="rounded-md bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                    >
                      {teacher.applicants.length} applicant
                      {teacher.applicants.length > 1 ? "s" : ""}
                    </button>
                  </div>
                  {expandedTeacher === teacher.name ? (
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <ul className="space-y-2">
                        {teacher.applicants.map((applicant) => (
                          <li
                            key={applicant.id}
                            className="rounded-md bg-white px-3 py-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-base font-medium text-slate-800">
                                {applicant.name}
                              </p>
                              <button
                                type="button"
                                className="shrink-0 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 text-sm font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:from-blue-100 hover:to-indigo-100 hover:text-blue-800"
                              >
                                View Document
                              </button>
                            </div>
                            <p className="text-sm text-slate-500">
                              {applicant.course}
                            </p>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Approve All Applicants
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
              {filteredTeachers.length === 0 ? (
                <li className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-500">
                  No teachers found.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SecretaryDashboardPage;
