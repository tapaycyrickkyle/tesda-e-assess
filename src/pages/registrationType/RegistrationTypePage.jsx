import React from "react";
import RegistrationTypeNavbar from "./components/RegistrationTypeNavbar";
import RegistrationTypeFooter from "./components/RegistrationTypeFooter";

function TeacherIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-10 w-10 fill-current"
    >
      <path d="M12 3 1.5 8.25 12 13.5l8.63-4.31v5.96H22V8.25L12 3Zm-6.75 8.49V15c0 2.14 3.2 3.75 6.75 3.75s6.75-1.61 6.75-3.75v-3.51L12 14.86l-6.75-3.37Z" />
    </svg>
  );
}

function ApplicantIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-10 w-10 fill-current"
    >
      <path d="M12 2.5a4.45 4.45 0 1 1 0 8.9 4.45 4.45 0 0 1 0-8.9Zm0 10.95c-4.25 0-7.7 2.65-7.7 5.92 0 1.18.97 2.13 2.16 2.13h11.08a2.13 2.13 0 0 0 2.16-2.13c0-3.27-3.45-5.92-7.7-5.92Zm.95-1.7h-1.9a6.84 6.84 0 0 0-6.87 6.75h15.64a6.84 6.84 0 0 0-6.87-6.75Z" />
    </svg>
  );
}

const cardClassName =
  "group rounded-2xl border border-slate-300 bg-white p-8 shadow-[0_2px_6px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_14px_30px_rgba(30,64,175,0.08)]";

const RegistrationTypePage = () => {
  return (
    <div className="min-h-screen bg-[#f3f5f7]">
      <RegistrationTypeNavbar />
      <main className="px-6 py-20 md:px-10">
        <div className="mx-auto w-full max-w-[980px]">
          <div className="text-center">
            <h1 className="text-[44px] font-bold tracking-tight text-slate-900 md:text-[4rem]">
              Choose Registration Type
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-8 text-slate-600">
              Please select how you want to register to access our specialized
              tools and resources.
            </p>
          </div>

          <div className="mt-14 grid gap-7 lg:grid-cols-2">
            <a href="#" className={cardClassName}>
              <span className="inline-flex h-17 w-17 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <TeacherIcon />
              </span>
              <h2 className="mt-8 text-[17px] font-semibold tracking-tight text-slate-900 md:text-[2.3rem]">
                Register as Teacher
              </h2>
              <p className="mt-6 text-[17px] leading-9 text-slate-600">
                Create an account as a teacher to manage assessments, create
                evaluation metrics, and view applicant records.
              </p>
              <p className="mt-7 text-[17px] font-semibold text-blue-700 group-hover:text-blue-800">
                Get started as an Educator
              </p>
            </a>

            <a href="#" className={cardClassName}>
              <span className="inline-flex h-17 w-17 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <ApplicantIcon />
              </span>
              <h2 className="mt-8 text-[37px] font-semibold tracking-tight text-slate-900 md:text-[2.3rem]">
                Register as Applicant
              </h2>
              <p className="mt-6 text-[17px] leading-9 text-slate-600">
                Create an account as an applicant to apply for assessments,
                track your application status, and download certificates.
              </p>
              <p className="mt-7 text-[17px] font-semibold text-blue-700 group-hover:text-blue-800">
                Get started as an Applicant
              </p>
            </a>
          </div>

          <div className="mt-12 text-center">
            <a
              href="#"
              className="inline-flex items-center gap-2 text-[15px] font-medium text-slate-600 transition hover:text-slate-800"
            >
              <span aria-hidden="true">&larr;</span>
              Back to Login
            </a>
          </div>
        </div>
      </main>
      <RegistrationTypeFooter />
    </div>
  );
};

export default RegistrationTypePage;
