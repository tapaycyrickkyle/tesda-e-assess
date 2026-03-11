import React from "react";
import "./footer.css";

const Footer = () => {
  return (
    <footer className="bg-[#071733] text-slate-200">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 sm:py-12 md:px-12 lg:px-16 lg:py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3 text-white">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-blue-600">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current"
                >
                  <path d="M12 3 1.5 8.25 12 13.5l8.63-4.31v5.96H22V8.25L12 3Zm-6.75 8.49V15c0 2.14 3.2 3.75 6.75 3.75s6.75-1.61 6.75-3.75v-3.51L12 14.86l-6.75-3.37Z" />
                </svg>
              </span>
              <span className="text-[26px] font-bold">TESDA</span>
            </div>
            <p className="mt-6 max-w-sm text-[14px] leading-7 text-slate-300">
              Empowering the Filipino workforce through quality
              technical-vocational education and training since 1994.
            </p>
            <div className="mt-6 flex items-center gap-4 text-slate-300">
              <a href="#" className="transition hover:text-white">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4.5 w-4.5 fill-current"
                >
                  <path d="M11.99 2C6.47 2 2 6.48 2 12.01 2 16.85 5.44 20.87 10 21.8v-6.84H7.9v-2.95H10v-2.25c0-2.07 1.23-3.22 3.11-3.22.9 0 1.84.16 1.84.16v2.03h-1.04c-1.03 0-1.35.64-1.35 1.29v1.99h2.3l-.37 2.95h-1.93v6.84A10.02 10.02 0 0 0 22 12C22 6.48 17.52 2 11.99 2Z" />
                </svg>
              </a>
              <a href="#" className="transition hover:text-white">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4.5 w-4.5 fill-current"
                >
                  <path d="M18.24 2H5.76A3.76 3.76 0 0 0 2 5.76v12.48A3.76 3.76 0 0 0 5.76 22h12.48A3.76 3.76 0 0 0 22 18.24V5.76A3.76 3.76 0 0 0 18.24 2ZM8.75 18H6.2V9.8h2.55V18Zm-1.27-9.27c-.84 0-1.4-.6-1.4-1.34 0-.75.57-1.34 1.42-1.34s1.4.59 1.41 1.34c0 .74-.56 1.34-1.43 1.34ZM18 18h-2.55v-4.4c0-1.1-.4-1.86-1.39-1.86-.76 0-1.21.5-1.4 1a2 2 0 0 0-.1.66V18H10V9.8h2.45v1.12h.03c.34-.52.95-1.26 2.33-1.26 1.7 0 2.98 1.1 2.98 3.5V18Z" />
                </svg>
              </a>
              <a href="#" className="transition hover:text-white">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4.5 w-4.5 fill-current"
                >
                  <path d="M12 2.2c3.18 0 3.56.02 4.82.08 3.22.15 4.72 1.68 4.87 4.87.06 1.26.08 1.64.08 4.82s-.02 3.56-.08 4.82c-.15 3.2-1.65 4.72-4.87 4.87-1.26.06-1.64.08-4.82.08s-3.56-.02-4.82-.08c-3.22-.15-4.72-1.67-4.87-4.87A69.6 69.6 0 0 1 2.2 12c0-3.18.02-3.56.08-4.82.15-3.2 1.65-4.72 4.87-4.87C8.44 2.22 8.82 2.2 12 2.2Zm0 1.8c-3.13 0-3.5.01-4.74.07-2.3.1-3.15.96-3.25 3.25-.06 1.24-.07 1.61-.07 4.68 0 3.08.01 3.44.07 4.68.1 2.3.95 3.16 3.25 3.25 1.24.06 1.61.07 4.74.07s3.5-.01 4.74-.07c2.3-.1 3.15-.95 3.25-3.25.06-1.24.07-1.6.07-4.68 0-3.07-.01-3.44-.07-4.68-.1-2.3-.95-3.15-3.25-3.25C15.5 4.01 15.13 4 12 4Zm0 3.06a4.94 4.94 0 1 1 0 9.88 4.94 4.94 0 0 1 0-9.88Zm0 1.73a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm6.28-2.63a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-[16px] font-semibold text-white">Quick Links</h3>
            <ul className="mt-6 space-y-3 text-[14px] text-slate-300">
              <li>
                <a href="#" className="transition hover:text-white">
                  Career Opportunities
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  Program Accreditation
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  Online Courses
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  Transparency Seal
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  News and Updates
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[16px] font-semibold text-white">Contact Us</h3>
            <ul className="mt-6 space-y-4 text-[14px] text-slate-300">
              <li className="flex items-start gap-3">
                <span className="pt-0.5 text-blue-400">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4.5 w-4.5 fill-current"
                  >
                    <path d="M12 2.5a7.25 7.25 0 0 0-7.25 7.25c0 5.6 6.3 11.27 6.57 11.5a1 1 0 0 0 1.36 0c.27-.23 6.57-5.9 6.57-11.5A7.25 7.25 0 0 0 12 2.5Zm0 9.7a2.45 2.45 0 1 1 0-4.9 2.45 2.45 0 0 1 0 4.9Z" />
                  </svg>
                </span>
                <span>TESDA Complex, East Service Road, Taguig City, Philippines</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="pt-0.5 text-blue-400">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4.5 w-4.5 fill-current"
                  >
                    <path d="m21.5 16.2-3.26-1.4a1.75 1.75 0 0 0-1.85.35l-1.45 1.2a13.56 13.56 0 0 1-6.3-6.3l1.2-1.45a1.75 1.75 0 0 0 .35-1.85L8.8 2.5A1.75 1.75 0 0 0 7.13 1.4H3.7C2.76 1.4 2 2.16 2 3.1 2 13.54 10.46 22 20.9 22c.94 0 1.7-.76 1.7-1.7v-2.44a1.75 1.75 0 0 0-1.1-1.66Z" />
                  </svg>
                </span>
                <span>(02) 8887-7777</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="pt-0.5 text-blue-400">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4.5 w-4.5 fill-current"
                  >
                    <path d="M2.3 6.6A2.6 2.6 0 0 1 4.9 4h14.2a2.6 2.6 0 0 1 2.6 2.6v10.8a2.6 2.6 0 0 1-2.6 2.6H4.9a2.6 2.6 0 0 1-2.6-2.6V6.6Zm2.6-.9a.9.9 0 0 0-.58.2L12 11.86l7.68-5.96a.9.9 0 0 0-.58-.2H4.9Zm15.1 12.6v-10L12.5 14a.9.9 0 0 1-1.1 0L4 8.3v10a.9.9 0 0 0 .9.9h14.2a.9.9 0 0 0 .9-.9Z" />
                  </svg>
                </span>
                <span>contactcenter@tesda.gov.ph</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[16px] font-semibold text-white">Location</h3>
            <div className="footer-map mt-6 h-40 rounded-md border border-white/10 p-4">
              <div className="h-full rounded bg-slate-100/10" />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-[12px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2024 TESDA. An official website of the Philippine Government.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <a href="#" className="transition hover:text-slate-200">
              Privacy Policy
            </a>
            <a href="#" className="transition hover:text-slate-200">
              Terms of Service
            </a>
            <a href="#" className="transition hover:text-slate-200">
              Freedom of Information
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
