import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

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
  "ui-card group rounded-2xl border border-slate-300 transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-[0_14px_30px_rgba(30,64,175,0.08)] sm:p-8";

const RegistrationTypePage = () => {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-content">
        <div className="mx-auto w-full max-w-5xl">
          <div className="text-center">
            <h1 className="page-title md:text-[2.5rem]">
              Choose Registration Type
            </h1>
            <p className="page-description mx-auto max-w-2xl sm:text-[17px] sm:leading-8">
              Please select how you want to register to access our specialized
              tools and resources.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:mt-12 lg:mt-14 lg:grid-cols-2">
            <Link to="/teacher-registration" className={cardClassName}>
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 sm:h-17 sm:w-17">
                <TeacherIcon />
              </span>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 sm:mt-8 sm:text-[2rem]">
                Register as Teacher
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600 sm:mt-6 sm:text-base sm:leading-8">
                Create an account as a teacher to manage assessments, create
                evaluation metrics, and view applicant records.
              </p>
              <p className="mt-6 text-base font-semibold text-blue-700 group-hover:text-blue-800 sm:mt-7 sm:text-base">
                Get started as an Educator
              </p>
            </Link>

            <Link to="/applicant-registration" className={cardClassName}>
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 sm:h-17 sm:w-17">
                <ApplicantIcon />
              </span>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 sm:mt-8 sm:text-[2rem]">
                Register as Applicant
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600 sm:mt-6 sm:text-base sm:leading-8">
                Create an account as an applicant to apply for assessments,
                track your application status, and download certificates.
              </p>
              <p className="mt-6 text-base font-semibold text-blue-700 group-hover:text-blue-800 sm:mt-7 sm:text-base">
                Get started as an Applicant
              </p>
            </Link>
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/"
              className="back-link"
            >
              <span aria-hidden="true">&larr;</span>
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RegistrationTypePage;
