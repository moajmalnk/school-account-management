import { Bell, Hash, Asterisk } from "lucide-react";

export function DigitalTransformation() {
  return (
    <section className="bg-[var(--mkt-soft)] py-14 sm:py-20 lg:py-24" aria-labelledby="digital-transformation-heading">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16 relative mt-8">
          <div className="relative mb-6">
            <div className="inline-flex items-center justify-center border border-[var(--mkt-line)] rounded-full px-4 py-1.5 text-[13px] font-semibold text-[var(--mkt-ink)] bg-white relative z-10 shadow-sm">
              Your school, Upgraded
            </div>
            <Hash className="w-6 h-6 absolute -right-4 -top-3 text-[var(--mkt-green)] opacity-50 -rotate-12" strokeWidth={2.5} />
          </div>

          <div className="relative">
            <Asterisk className="w-8 h-8 absolute -left-8 bottom-2 text-[var(--mkt-green)] opacity-50" strokeWidth={2.5} />
            <h2 id="digital-transformation-heading" className="text-[clamp(2.5rem,6vw,3.5rem)] font-bold tracking-tight text-[var(--mkt-ink)] leading-[1.1]">
              From manual<br />
              to <span className="inline-block px-3 py-0.5 rounded-lg bg-[var(--mkt-green)] text-white ml-1">digital</span>
            </h2>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Top Left: Brand Card */}
          <div className="rounded-3xl border border-[var(--mkt-line)] bg-gradient-to-br from-white to-[#f4faf1] p-8 shadow-sm flex flex-col min-h-[340px]">
            <h3 className="text-2xl font-bold text-[var(--mkt-ink)] leading-tight mb-2">
              From school brand<br />to day-one profiles
            </h3>
            <p className="text-[13px] text-[var(--mkt-muted)] mb-6 max-w-[85%]">
              Configure branding once, then run students, fees, and staff from the same workspace.
            </p>

            <div className="flex flex-col gap-2.5 mt-auto">
              {[
                "Logo, letterhead, seal & signature",
                "School profile, phone & email",
                "Student fee schedules & collection",
                "Staff profiles, roles & login"
              ].map((pill) => (
                <div key={pill} className="inline-flex items-center px-3.5 py-1.5 bg-white border border-[var(--mkt-line)] rounded-full text-[11.5px] font-semibold text-[var(--mkt-ink)] shadow-[0_1px_2px_rgba(0,0,0,0.03)] w-max max-w-full truncate">
                  {pill}
                </div>
              ))}
            </div>
          </div>

          {/* Top Right: Follow up Card */}
          <div className="rounded-3xl border border-[var(--mkt-line)] bg-[#f6fbf4] p-8 shadow-sm flex overflow-hidden relative min-h-[340px]">
            <div className="relative z-10 w-[55%] flex flex-col">
              <h3 className="text-2xl font-bold text-[var(--mkt-ink)] leading-tight mb-2">
                One-click<br />follow-up
              </h3>
              <p className="text-[13px] text-[var(--mkt-muted)] mb-6">
                No more individual messages and missed reminders. Select overdue, send bulk WhatsApp, done.
              </p>

              <div className="flex flex-col gap-2 mt-auto">
                <div className="inline-flex items-center justify-between px-3 py-1.5 bg-[var(--mkt-green)] text-white text-[11px] font-medium rounded-md w-fit min-w-[100px] shadow-sm">
                  <span>Overdue</span> <span className="ml-2 font-bold">→</span>
                </div>
                <div className="inline-flex items-center justify-between px-3 py-1.5 bg-[var(--mkt-green)] text-white text-[11px] font-medium rounded-md w-fit min-w-[120px] shadow-sm">
                  <span>Bulk WhatsApp</span> <span className="ml-2 font-bold">→</span>
                </div>
                <div className="inline-flex items-center justify-center px-3 py-1.5 bg-[var(--mkt-green)] text-white text-[11px] font-medium rounded-md w-fit min-w-[70px] shadow-sm">
                  <span>Send</span>
                </div>
              </div>
            </div>

            <div className="absolute right-0 bottom-0 top-[10%] w-[65%]">
              <img src="/digital/2.png" alt="Hand holding phone" className="w-full h-full object-contain object-right-bottom drop-shadow-xl translate-x-2 translate-y-4 scale-[1.2]" />
            </div>
          </div>

          {/* Bottom Left Column */}
          <div className="flex flex-col gap-6 h-full">
            {/* Assets Card */}
            <div className="rounded-3xl border border-[var(--mkt-line)] bg-white p-6 shadow-sm flex items-start justify-between flex-1 min-h-[160px]">
              <div className="w-[65%]">
                <h3 className="text-xl font-bold text-[var(--mkt-ink)] leading-tight mb-2">
                  School details<br />& assets
                </h3>
                <p className="text-[12px] text-[var(--mkt-muted)] leading-relaxed">
                  Upload logo, letterhead, seal, and signature. Set name, address, and registration — receipts look official from day one.
                </p>
              </div>
              <div className="w-[80px] h-[80px] rounded-2xl border border-[var(--mkt-line)] bg-white flex items-center justify-center flex-shrink-0 shadow-sm ml-4 mt-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f4faf1] to-white"></div>
                <div className="w-10 h-10 rounded-full bg-[var(--mkt-green)] flex items-center justify-center shadow-inner relative z-10">
                  <Bell className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Payments Card */}
            <div className="rounded-3xl border border-[var(--mkt-line)] bg-white p-6 shadow-sm flex flex-col justify-between flex-1 min-h-[190px]">
              <div>
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-6 h-6 rounded-full bg-[#f4fbf0] border border-[#e0eed9] flex items-center justify-center text-[var(--mkt-green)] flex-shrink-0 mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--mkt-ink)] leading-tight">
                    Payments on<br />every profile
                  </h3>
                </div>
                <p className="text-[12px] text-[var(--mkt-muted)] mb-4 ml-9">
                  Fees overview, installment table, overdue badges, and WhatsApp reminders — collect without leaving the student.
                </p>
              </div>
              <div className="flex items-end justify-between w-full pl-9 pr-2">
                <div>
                  <div className="text-[28px] font-bold text-[var(--mkt-ink)] leading-none tracking-tight">23,500</div>
                  <div className="text-[11px] font-semibold text-[var(--mkt-green)] mt-1.5 flex items-center">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                    5.6% <span className="text-[var(--mkt-muted)] font-medium ml-1">vs last week</span>
                  </div>
                </div>
                <div className="w-[110px] h-[40px] opacity-80">
                  <svg viewBox="0 0 100 40" className="w-full h-full stroke-[var(--mkt-green)] fill-none stroke-[2.5]">
                    <path d="M0 35 Q 15 25 30 30 T 50 15 T 70 25 T 85 5 T 100 10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Right Column: Staff setup Card */}
          <div className="rounded-3xl border border-[var(--mkt-line)] bg-white shadow-sm flex flex-col relative overflow-hidden h-full min-h-[374px]">
            <div className="p-8 pb-2 relative z-10 bg-white">
              <h3 className="text-2xl font-bold text-[var(--mkt-ink)] leading-tight mb-2">
                Staff setup that scales
              </h3>
              <p className="text-[13px] text-[var(--mkt-muted)] max-w-[90%]">
                Create staff profiles with role, department, and optional workspace login — attendance and documents in the same place.
              </p>
            </div>

            {/* CSS Bar Chart matching target design */}
            <div className="flex-1 w-full bg-white relative mt-2 flex flex-col justify-end pb-10 px-10">

              {/* Stats Header Pill */}
              <div className="flex items-center justify-between border border-[var(--mkt-line)] bg-white rounded-full p-1.5 mb-6 w-full max-w-[280px] mx-auto z-10 relative">
                <div className="bg-[var(--mkt-green)] text-white text-[12px] font-bold px-6 py-1.5 rounded-full">
                  Stats
                </div>
                <div className="text-[11px] text-[#6b7280] font-medium px-4">
                  January 2026
                </div>
              </div>

              {/* Chart Area */}
              <div className="relative h-[130px] w-full flex items-end justify-center px-4 max-w-[320px] mx-auto">
                {/* Y axis */}
                <div className="absolute left-0 bottom-0 top-4 flex flex-col justify-between text-[11px] font-semibold text-[#9ca3af] pb-0">
                  <span>60</span>
                  <span>40</span>
                  <span>20</span>
                  <span>00</span>
                </div>

                {/* Bars Container */}
                <div className="w-[85%] ml-8 h-full flex items-end justify-between pb-0 relative z-10 px-2">
                  {/* Bar 1: Grey */}
                  <div className="w-[14px] h-[45%] bg-[#6b7280] rounded-full"></div>

                  {/* Bar 2: Green with tooltip */}
                  <div className="w-[14px] h-[90%] bg-[var(--mkt-green)] rounded-full relative">
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[var(--mkt-green)] text-white text-[10px] px-2 py-0.5 rounded shadow-sm whitespace-nowrap font-bold tracking-tight">
                      33,200
                      <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--mkt-green)] rotate-45 rounded-[1px]"></div>
                    </div>
                  </div>

                  {/* Bar 3: Black */}
                  <div className="w-[14px] h-[80%] bg-[#1a1a1a] rounded-full"></div>

                  {/* Bar 4: Green */}
                  <div className="w-[14px] h-[40%] bg-[var(--mkt-green)] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
