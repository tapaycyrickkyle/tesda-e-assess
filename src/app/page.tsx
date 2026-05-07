import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f9ff] px-6 py-8 text-[#0b1c30]">
      <main className="z-10 flex w-full max-w-[1440px] items-center justify-center">
        <div className="flex w-full max-w-[480px] flex-col items-center">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <img
                alt="TESDA Logo"
                className="h-20 w-auto"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuArr0IweZLfXmW1GgA5XMXA-MHCknmJhPdz76BRJdHURCjQZS3Rzd8NV_pNDEGZdPF4zYB_c60JC-GvS2BpI7o0h0b9rIQzPHXRYINSphPCG0NW7CRUhO9o-Gqzka6mga9Qwzx0kx2yiwNgnhG1rwcqasZh34RMTezt2PfhUCB5aYCIMcO2CISqpanHt4J5Wo7rKP70JY61Aj5DH_HWi6VtPsnq8jmMvcopIsNJ53Y4NvnRYO3Gpe9ewTe4m6ofeP2xjFseWLMaN7Y"
              />
            </div>
            <h1 className="mb-1 text-3xl font-bold tracking-tight text-[#002576]">
              TESDA E-Assess
            </h1>
            <p className="mx-auto max-w-[320px] text-sm text-[#444653]">
              TESDA Eastern Samar Provincial Office Assessment Application and
              Processing System
            </p>
          </div>

          <div className="w-full rounded-lg border border-[#c4c5d5] bg-white p-8 shadow-[0_4px_20px_rgba(0,56,168,0.05)]">
            <form className="space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#0b1c30]" htmlFor="email">
                  Email Address
                </label>
                <input
                  className="w-full rounded border border-[#747685] bg-[#f8f9ff] px-4 py-2 text-base outline-none transition focus:border-[#002576] focus:ring-1 focus:ring-[#002576]"
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#0b1c30]" htmlFor="password">
                    Password
                  </label>
                  <Link className="text-xs font-semibold text-[#002576] hover:underline" href="#">
                    Forgot Password?
                  </Link>
                </div>
                <input
                  className="w-full rounded border border-[#747685] bg-[#f8f9ff] px-4 py-2 text-base outline-none transition focus:border-[#002576] focus:ring-1 focus:ring-[#002576]"
                  id="password"
                  placeholder="********"
                  type="password"
                />
              </div>

              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0038a8] px-4 py-3 font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
                type="submit"
              >
                Login
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#c4c5d5]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-[#444653]">Don&apos;t have an account?</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button className="w-full rounded-lg border border-[#002576] py-2.5 font-bold text-[#002576] transition hover:bg-[#e5eeff]">
                Sign Up as Applicant
              </button>
              <button className="w-full rounded-lg border border-[#5d5f5f] py-2.5 font-bold text-[#444653] transition hover:bg-[#e5eeff]">
                Sign Up as Teacher
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-1 text-center">
            <p className="text-xs text-[#444653]">(c) 2024 TESDA Eastern Samar Provincial Office</p>
            <div className="flex items-center justify-center gap-4">
              <Link className="text-xs text-[#444653] transition hover:text-[#002576]" href="#">
                Privacy Policy
              </Link>
              <span className="h-1 w-1 rounded-full bg-[#747685]" />
              <Link className="text-xs text-[#444653] transition hover:text-[#002576]" href="#">
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </main>

      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-[#d3e4fe] opacity-40 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-[#dce9ff] opacity-40 blur-[120px]" />
      </div>
    </div>
  );
}
