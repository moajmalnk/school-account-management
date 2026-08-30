import { motion } from "motion/react";
import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";

export function HowItWorks() {
  return (
    <section className="bg-white py-14 sm:py-24 lg:py-32 overflow-hidden" aria-labelledby="how-it-works-heading">
      <div className="mx-auto max-w-[1080px] px-4 sm:px-6">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-20 relative w-full max-w-3xl mx-auto">
          
          {/* Title */}
          <div className="relative inline-flex items-center justify-center mb-10 text-[28px] md:text-[34px] font-bold tracking-wide">
             <span className="text-[#1a1a1a] mr-2">How It</span>
             <span className="bg-[#5ec45f] text-white px-2.5 py-1 rounded-[4px] leading-none">Works</span>
             
             {/* Decorative scribbles */}
             <div className="absolute -left-10 top-0 text-[#5ec45f] text-4xl font-light select-none pointer-events-none" style={{ WebkitTextStroke: '2px #5ec45f', color: 'transparent', transform: 'rotate(-10deg)' }}>!</div>
             <div className="absolute left-16 -top-8 text-[#5ec45f] text-3xl select-none pointer-events-none stroke-2" style={{ WebkitTextStroke: '1px #5ec45f', color: 'transparent' }}>*</div>
             <div className="absolute -right-12 -top-4 text-[#5ec45f] text-4xl font-light select-none pointer-events-none" style={{ WebkitTextStroke: '2px #5ec45f', color: 'transparent', transform: 'rotate(15deg)' }}>?</div>
             <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[#5ec45f] text-3xl font-light select-none pointer-events-none" style={{ WebkitTextStroke: '2px #5ec45f', color: 'transparent', transform: 'rotate(10deg)' }}>#</div>
          </div>
          
          {/* Main Headline Block */}
          <div className="relative w-full flex flex-col items-center mt-6">
            {/* Top Pill */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white border-[1.5px] border-[#1a1a1a] text-[#1a1a1a] text-[13px] font-bold px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap z-10">
              How Much is Outstanding
            </div>

            {/* Main Text */}
            <h2 id="how-it-works-heading" className="text-[3.5rem] md:text-[5.5rem] font-bold text-[#1a1a1a] leading-[1] tracking-tight relative z-0">
              How many <span className="absolute -right-14 top-4 text-[#5ec45f] text-7xl font-light select-none pointer-events-none" style={{ WebkitTextStroke: '2px #5ec45f', color: 'transparent', transform: 'rotate(15deg)' }}>?</span><br />
              <span className="absolute -left-12 bottom-20 text-[#5ec45f] text-7xl font-light select-none pointer-events-none" style={{ WebkitTextStroke: '2px #5ec45f', color: 'transparent', transform: 'rotate(-10deg)' }}>!</span>fee <span className="inline-block bg-[#5ec45f] text-white px-5 py-2 md:py-2.5 rounded-lg mx-1 -rotate-2">payments</span> <br />
              are pending
            </h2>

            {/* Bottom Pills */}
            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-6 whitespace-nowrap w-full justify-center mt-8">
              <div className="bg-[#5ec45f] text-white text-sm font-bold px-6 py-2 rounded-full shadow-sm -rotate-3 transition-transform hover:scale-105">
                Who Is Pending
              </div>
              <div className="bg-[#5ec45f] text-white text-sm font-bold px-6 py-2 rounded-full shadow-sm rotate-3 transition-transform hover:scale-105">
                Who Has Paid
              </div>
            </div>
          </div>

        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-[minmax(240px,auto)] mt-32">
          
          {/* Card 1: 80+ Schools */}
          <div className="md:col-span-3 rounded-3xl border border-[#e5e7eb] bg-white p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center items-center text-center">
            <div className="text-[3.5rem] font-bold text-[#5ec45f] leading-none mb-2">80+</div>
            <div className="text-[18px] font-semibold text-[#1a1a1a]">Schools</div>
          </div>

          {/* Card 2: Built for */}
          <div className="md:col-span-6 rounded-3xl border border-[#e5e7eb] bg-white p-8 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between overflow-hidden relative">
            <div className="relative z-10 max-w-[55%]">
              <h3 className="text-[24px] font-bold leading-[1.1] mb-3">
                <span className="text-[#1a1a1a]">Built for</span><br/>
                <span className="text-[#5ec45f]">how schools</span><br/>
                <span className="text-[#5ec45f]">actually work</span>
              </h3>
              <p className="text-[13px] text-[#6b7280] leading-relaxed">
                Dashboard, students, fees, staff, plans, and support — one workspace your team can open on day one.
              </p>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[55%] h-[120%] flex items-center justify-end">
              <img src="/works/1.png" alt="Platform overview" className="w-full h-full object-contain object-right" />
            </div>
          </div>

          {/* Card 3: 14 Days */}
          <div className="md:col-span-3 rounded-3xl border border-[#e5e7eb] bg-white p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center items-center text-center">
            <div className="text-[3.5rem] font-bold text-[#5ec45f] leading-none mb-2">14</div>
            <div className="text-[18px] font-semibold text-[#1a1a1a] leading-tight">Days<br/>Free trial</div>
          </div>

          {/* Card 4: Directory */}
          <div className="md:col-span-6 rounded-3xl border border-[#e5e7eb] bg-white p-8 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between overflow-hidden relative min-h-[260px]">
             <div className="relative z-10 max-w-[50%]">
              <h3 className="text-[24px] font-bold leading-[1.1] mb-3">
                <span className="text-[#1a1a1a]">Directory with</span><br/>
                <span className="text-[#5ec45f]">fees &</span><br/>
                <span className="text-[#5ec45f]">follow-up</span>
              </h3>
              <p className="text-[13px] text-[#6b7280] leading-relaxed mt-2">
                Search, filter by class, call or WhatsApp guardians, and see overdue fees without leaving the list.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 w-[55%] h-[90%] flex items-end justify-end">
              <img src="/works/2.png" alt="Directory features" className="w-full h-full object-contain object-bottom-right" />
            </div>
          </div>

          {/* Card 5: Student Fees */}
          <div className="md:col-span-6 rounded-3xl border border-[#e5e7eb] bg-white p-8 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between overflow-hidden relative min-h-[260px]">
             <div className="relative z-10 max-w-[55%]">
              <h3 className="text-[24px] font-bold leading-[1.1] mb-3">
                <span className="text-[#5ec45f]">Student fees,</span><br/>
                <span className="text-[#1a1a1a]">installment by</span><br/>
                <span className="text-[#1a1a1a]">installment</span>
              </h3>
              <p className="text-[13px] text-[#6b7280] leading-relaxed mt-2">
                See total fee, paid, and due. Collect payments, flag overdue installments, and WhatsApp parents from the profile.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 w-[50%] h-[90%] flex items-end justify-end">
              <img src="/works/3.png" alt="Student fee management" className="w-full h-full object-contain object-bottom-right" />
            </div>
          </div>

          {/* Card 6: Financial Overview */}
          <div className="md:col-span-8 rounded-3xl border border-[#e5e7eb] bg-white p-10 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center overflow-hidden relative min-h-[300px]">
            <div className="relative z-10 max-w-[45%]">
              <h3 className="text-[26px] font-bold leading-[1.1] mb-4">
                <span className="text-[#5ec45f]">Financial</span><br/>
                <span className="text-[#5ec45f]">overview</span><br/>
                <span className="text-[#1a1a1a]">at a glance</span>
              </h3>
              <p className="text-[14px] text-[#6b7280] leading-relaxed">
                Income, expenses, outstanding fees, cash and bank — plus quick actions to receive or make payments.
              </p>
            </div>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-[60%] h-[120%] flex items-center justify-end">
              <img src="/works/4.png" alt="Financial dashboard" className="w-full h-full object-contain object-right" />
            </div>
          </div>

          {/* Card 7: Help */}
          <div className="md:col-span-4 rounded-3xl border border-[#e5e7eb] bg-white p-10 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden relative min-h-[300px]">
            <div className="relative z-10 w-full mb-6">
              <h3 className="text-[26px] font-bold leading-[1.1] mb-4 text-[#1a1a1a]">
                Help when<br/>you need it
              </h3>
              <p className="text-[14px] text-[#6b7280] leading-relaxed">
                Ask Feezo assistant, email, or WhatsApp — common tasks like admitting a student are one tap away.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 w-[80%] h-[50%] flex items-end justify-end">
              <img src="/works/5.png" alt="Help and support" className="w-full h-full object-contain object-bottom-right" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
