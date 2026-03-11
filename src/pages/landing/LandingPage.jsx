import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const serviceCards = [
  {
    title: "Skills Development",
    description:
      "Enhancing vocational capabilities through modern industry standards and practical workshops.",
    icon: "bolt",
  },
  {
    title: "National Certifications",
    description:
      "Globally recognized assessment and certification of competencies across various trades.",
    icon: "shield",
  },
  {
    title: "Technical Training",
    description:
      "Comprehensive hands-on training programs using state-of-the-art technical facilities.",
    icon: "tools",
  },
  {
    title: "Workforce Development",
    description:
      "Strategically preparing the nation's labor force for competitive global markets.",
    icon: "target",
  },
];

const programCards = [
  {
    tag: "Technology",
    title: "Advanced Manufacturing",
    description:
      "Master the skills of modern factory automation, robotics, and smart manufacturing systems.",
    duration: "6 Months Course",
    image:
      "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=1200&q=80",
    color: "text-blue-700",
  },
  {
    tag: "Engineering",
    title: "Electrical Installation",
    description:
      "Expert training in residential and industrial electrical systems, safety protocols and maintenance.",
    duration: "4 Months Course",
    image:
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1200&q=80",
    color: "text-emerald-600",
  },
  {
    tag: "Hospitality",
    title: "Culinary Arts & Services",
    description:
      "Professional certification for high-demand roles in the international food and beverage industry.",
    duration: "3 Months Course",
    image:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80",
    color: "text-orange-500",
  },
];

const staffMembers = [
  {
    role: "Director General",
    name: "HON. JOSE RIZAL III",
    office: "Office of the Director General",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
  },
  {
    role: "Deputy Director",
    name: "MARIA CLARA SANTOS",
    office: "TESDA Policy & Planning",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
  },
  {
    role: "Operations Chief",
    name: "ANDRES BONIFACIO JR.",
    office: "Regional Operations",
    image:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80",
  },
  {
    role: "Program Director",
    name: "GABRIELA SILANG II",
    office: "Curriculum Development",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
  },
];

function GearIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 fill-current"
    >
      <path d="M13.94 2.13a2 2 0 0 0-3.88 0l-.2.86a1 1 0 0 1-.7.72l-.85.25a2 2 0 0 0-1.36 2.9l.43.77a1 1 0 0 1-.03 1l-.45.75a2 2 0 0 0 1.28 2.95l.84.27a1 1 0 0 1 .68.74l.17.86a2 2 0 0 0 3.86.11l.2-.86a1 1 0 0 1 .69-.72l.85-.25a2 2 0 0 0 1.37-2.9l-.43-.77a1 1 0 0 1 .03-1l.44-.76a2 2 0 0 0-1.28-2.94l-.84-.27a1 1 0 0 1-.68-.74l-.18-.86Zm-1.94 12.12a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-none stroke-current"
    >
      <circle cx="11" cy="11" r="7" strokeWidth="1.8" />
      <path d="m20 20-3.5-3.5" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
    >
      <path d="M12.68 2.05a.75.75 0 0 1 .73.56l1.02 3.9a.75.75 0 0 0 .53.53l3.9 1.02a.75.75 0 0 1 0 1.46l-3.9 1.02a.75.75 0 0 0-.53.53l-1.02 3.9a.75.75 0 0 1-1.46 0l-1.02-3.9a.75.75 0 0 0-.53-.53l-3.9-1.02a.75.75 0 0 1 0-1.46l3.9-1.02a.75.75 0 0 0 .53-.53l1.02-3.9a.75.75 0 0 1 .73-.56Z" />
    </svg>
  );
}

function ServiceIcon({ type }) {
  const baseClass = "h-12 w-12 fill-current";

  if (type === "shield") {
    return (
      <svg aria-hidden="true" viewBox="0 0 25 25" className={baseClass}>
        <path d="M12 2.5 4.5 5.2v5.83c0 4.3 2.7 8.2 6.76 9.8a2.03 2.03 0 0 0 1.48 0c4.06-1.6 6.76-5.5 6.76-9.8V5.2L12 2.5Zm-.9 12.25-2.7-2.7 1.05-1.05 1.65 1.66 3.45-3.45 1.05 1.05-4.5 4.5Z" />
      </svg>
    );
  }

  if (type === "tools") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={baseClass}>
        <path d="m14.7 6.3 3 3-1.42 1.4-3-3-1.87 1.87a4.4 4.4 0 0 1-5.92.3l2.2-2.2-.85-2.55-2.55-.85-2.2 2.2A4.4 4.4 0 0 1 6.4 2.6l1.6 1.6a4.4 4.4 0 0 1 .3 5.9L6.43 11.97 12 17.53l1.87-1.87a4.4 4.4 0 0 1 5.9-.3l-2.2 2.2.86 2.56 2.55.84 2.2-2.2a4.4 4.4 0 0 1-3.6 5.35l-1.6-1.6a4.4 4.4 0 0 1-.3-5.9l1.87-1.87-5.56-5.57L14.7 6.3Z" />
      </svg>
    );
  }

  if (type === "target") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={baseClass}>
        <path d="M12 3a9 9 0 1 0 9 9h-2.05a6.95 6.95 0 1 1-6.95-6.95V3Zm0 4.2a4.8 4.8 0 1 0 4.8 4.8h-2.1a2.7 2.7 0 1 1-2.7-2.7V7.2Zm0 3.45a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={baseClass}>
      <path d="m13.2 2.45-6.75 7.87h4.44l-1.09 11.23 6.75-7.87h-4.44l1.1-11.23Z" />
    </svg>
  );
}

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <main className="bg-[#f3f4f6] text-slate-900 pt-20 sm:pt-25 lg:pt-30">
        <section id="home" className="scroll-mt-28 border-b border-slate-200">
        <div className="mx-auto w-full max-w-[1280px] px-6 pb-16 pt-14 md:px-12 lg:px-16 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.02fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#dbeafe] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-blue-700">
                <GearIcon />
                Government Certified Education
              </span>

              <h1 className="mt-8 max-w-xl text-5xl font-bold leading-[1.05] tracking-tight text-slate-900 md:text-6xl">
                Empowering Skills for a{" "}
                <span className="text-blue-700">Better Future</span>
              </h1>

              <p className="mt-7 max-w-xl text-[18px] leading-8 text-slate-600">
                The Technical Education and Skills Development Authority (TESDA)
                provides direction, policies, programs and standards towards
                quality technical education and skills development.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  to="/registration-type"
                  className="rounded-xl bg-blue-700 px-8 py-4 text-[1.2rem] font-semibold text-white transition hover:bg-blue-800"
                >
                  Apply Now
                </Link>
                <button className="rounded-xl border border-slate-300 bg-white px-8 py-4 text-[1.2rem] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                  Learn More
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-2xl border-[3px] border-white shadow-[0_18px_35px_rgba(15,23,42,0.16)]">
                <img
                  src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"
                  alt="Industrial training equipment"
                  className="h-[360px] w-full object-cover lg:h-[390px]"
                />
              </div>

              <div className="absolute -bottom-7 left-8 rounded-2xl bg-white px-6 py-5 shadow-[0_14px_28px_rgba(15,23,42,0.15)]">
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <SparkIcon />
                  </span>
                  <div>
                    <p className="text-3xl font-bold leading-none text-blue-700">
                      1M+
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Certified Graduates
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </section>

        <section id="about" className="scroll-mt-28">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-18 md:px-12 lg:px-16">
          <div className="text-center">
            <h2 className="text-[44px] font-bold tracking-tight text-slate-900">
              About TESDA
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-[16px] leading-7 text-slate-500">
              We are committed to providing accessible and high-quality
              technical education across the nation.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {serviceCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_8px_20px_rgba(15,23,42,0.03)]"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <ServiceIcon type={card.icon} />
                </span>
                <h3 className="mt-7 text-[22px] font-semibold text-slate-900">
                  {card.title}
                </h3>
                <p className="mt-4 text-[15px] leading-7 text-slate-500">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>
        </section>

        <section
          id="programs"
          className="scroll-mt-28 border-y border-slate-200 bg-[#f8fafc]"
        >
        <div className="mx-auto w-full max-w-[1280px] px-6 py-18 md:px-12 lg:px-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[44px] font-bold tracking-tight text-slate-900">
                Flagship Programs
              </h2>
              <p className="mt-3 text-[16px] leading-7 text-slate-500">
                Explore our most sought-after technical-vocational courses.
              </p>
            </div>

            <a
              href="#"
              className="inline-flex items-center gap-2 text-[15px] font-semibold text-blue-700 transition hover:text-blue-800"
            >
              View all programs
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <div className="mt-11 grid gap-7 lg:grid-cols-3">
            {programCards.map((program) => (
              <article
                key={program.title}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.05)]"
              >
                <img
                  src={program.image}
                  alt={program.title}
                  className="h-[205px] w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-6">
                  <p
                    className={`text-[10px] font-bold uppercase tracking-[0.18em] ${program.color}`}
                  >
                    {program.tag}
                  </p>
                  <h3 className="mt-4 text-[31px] font-semibold leading-tight text-slate-900">
                    {program.title}
                  </h3>
                  <p className="mt-4 text-[15px] leading-7 text-slate-500">
                    {program.description}
                  </p>
                  <div className="mt-auto pt-7 flex flex-col gap-2 text-[13px] sm:flex-row sm:items-center sm:justify-between sm:text-[14px]">
                    <span className="font-medium text-slate-400">
                      {program.duration}
                    </span>
                    <a
                      href="#"
                      className="self-start font-semibold text-blue-700 transition hover:text-blue-800 sm:self-auto"
                    >
                      Apply Now
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
        </section>

        <section id="staff" className="scroll-mt-28">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-18 md:px-12 lg:px-16">
          <div className="text-center">
            <h2 className="text-[44px] font-bold tracking-tight text-slate-900">
              Leadership & Staff
            </h2>
            <p className="mx-auto mt-4 max-w-4xl text-[16px] leading-7 text-slate-500">
              The dedicated professionals steering the future of technical
              education in the Philippines.
            </p>
          </div>

          <div className="mt-13 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {staffMembers.map((member) => (
              <article key={member.name} className="text-center">
                <div className="mx-auto h-[156px] w-[156px] overflow-hidden rounded-full border-[3px] border-white shadow-[0_8px_20px_rgba(15,23,42,0.15)]">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="mt-5 text-[17px] text-slate-900">{member.role}</p>
                <p className="mt-1 text-[15px] font-semibold uppercase tracking-[0.05em] text-blue-800">
                  {member.name}
                </p>
                <p className="mt-1 text-[13px] text-slate-500">
                  {member.office}
                </p>
              </article>
            ))}
          </div>
        </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default LandingPage;
