import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";

import SectionTwo from "./SectionTwo";
import SectionFour from "./SectionFour";
import WorkFlowSection from "./WorkFlowSection"
import { ScrollReveal, ScrollRevealContainer } from "@/components/common/ScrollReveal";
import { Button } from "@/components/ui/button";



const HomePage = () => {
  const navigate = useNavigate();
  const goToLogin = () => navigate("/login");
  const goToSignup = () => navigate("/signup");

  return (
    <div className="min-h-screen w-full bg-[#0A0A0C] text-white">
      <section className="relative min-h-screen w-full overflow-hidden">

        {/* Animated fluid canvas background */}
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
          <AnimatedBackground />
        </div>


        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-black/55 via-black/30 to-black/60" />

        {/* Navbar â€” transparent, sits inside the hero */}
        <header className="relative z-20 w-full">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
            <span className="text-sm font-semibold tracking-widest uppercase text-white/80 select-none">
              Expense Approval System
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={goToLogin}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-4 text-sm"
              >
                Sign In
              </Button>
              <button
                onClick={goToSignup}
                className="bg-white text-black font-mono font-bold uppercase text-xs tracking-[0.15em] px-6 py-2.5 rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer"
              >
                Signup
              </button>
            </div>
          </div>
        </header>

        {/* Hero headline â€” centered over the video */}
        <div className="relative z-20 flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 pb-16 text-center sm:px-8">
          <ScrollReveal variant="slide-up" duration={700} delay={100}>
            {/* <p className="mb-5 text-xs font-semibold tracking-[0.25em] uppercase text-white/50">
              Expense Approval System
            </p> */}
            <h1 className="font-serif text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl">
              Built for Financial
              <br />
              <span className="font-serif text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl">Clarity</span>
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
              A modern platform built to streamline submissions, speed up reviews, and bring total clarity to team spending.
            </p>
          </ScrollReveal>
        </div>

      </section>
      <div className="bg-[#0A0A0C]">

        <SectionTwo />

        <WorkFlowSection />
        <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 font-serif">
          <ScrollReveal variant="slide-up" duration={600}>
            <div className="max-w-2xl space-y-2">
              <p className="font-serif text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl">
                Simple, accountable workflow
              </p>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Built for total financial clarity
              </h2>
              <p className="font-serif text-sm text-white/60 pt-2">
                Powerful tools designed to simplify every step of team spending.
              </p>
            </div>
          </ScrollReveal>

          <ScrollRevealContainer className="mt-12 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                tag: "SUBMISSIONS",
                title: "Expense Claims",
                description:
                  "Snap receipts, fill claim details, and submit requests with automated metadata extraction.",
                actionText: "Instant Claim Logging",
                bgAsset: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop", 
              },
              {
                step: "02",
                tag: "ROUTING",
                title: "Smart Approvals",
                description:
                  "Line-item verification, automated policy compliance checks, and quick manager decisions.",
                actionText: "Automated Workflow",
                bgAsset: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1000&auto=format&fit=crop",
              },
              {
                step: "03",
                tag: "ANALYTICS",
                title: "Financial Reports",
                description:
                  "Live expenditure trends, departmental budget tracking, and exportable audit trails.",
                actionText: "Real-Time Insights",
                bgAsset: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop",
              },
              {
                step: "04",
                tag: "GOVERNANCE",
                title: "System Control",
                description:
                  "Organization-wide workspace isolation, role policy rules, and security management.",
                actionText: "Enterprise Security",
                bgAsset: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=1000&auto=format&fit=crop",
              },
            ].map((module, index) => (
              <ScrollReveal
                key={module.title}
                variant="slide-up"
                duration={500}
                delay={index * 80}
                className="h-full"
              >
                
                <div className="relative group overflow-hidden min-h-[490px] w-full rounded-none border border-white/20 bg-[#09090B] p-8 flex flex-col justify-between transition-all duration-500 hover:border-white/40 font-serif">
                  
                  {/* Background Asset — Always Visible */}
                  <img
                    src={module.bgAsset}
                    alt={module.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-50 contrast-110 transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                  />

                  {/* Dark Gradient Overlay for Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/70 to-black/30 pointer-events-none" />

                  {/* Top Bar: Tag & Step Number */}
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/15 pb-4">
                      <span className="font-serif text-[10px] tracking-widest text-white/70 uppercase">
                        [ {module.tag} ]
                      </span>
                      <span className="font-serif text-xs text-white/50">
                        {module.step}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-serif text-2xl font-bold text-white tracking-tight leading-tight">
                        {module.title}
                      </h3>
                      <p className="font-serif text-xs text-white/80 leading-relaxed">
                        {module.description}
                      </p>
                    </div>
                  </div>

                  {/* Middle Gap for BG visuals */}
                  <div className="relative z-10 my-4 h-20 w-full" />

                  {/* Bottom Action Line */}
                  <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] font-serif text-white/80 group-hover:text-white transition-colors">
                    <span>{module.actionText}</span>
                    <span className="text-sm transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                  </div>

                </div>
              </ScrollReveal>
            ))}
          </ScrollRevealContainer>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <hr className="border-white/8" />
        </div>

        
          <SectionFour />

        {/* Footer strip */}
        <div className="border-t border-white/8 py-8 text-center text-xs text-white/25">
          Expense Approval System
        </div>

      </div>
    </div>
  );
};

export default HomePage;
