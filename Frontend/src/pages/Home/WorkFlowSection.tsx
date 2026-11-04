import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ScrollReveal, ScrollRevealContainer } from "@/components/common/ScrollReveal";

const workflowSteps = ["SUBMIT", "REVIEW", "APPROVE / REJECT", "TRACK"];

const WorkflowSection = () => {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 50%"],
  });

  return (
    <section className="w-full border-t border-white/10 bg-[#0A0A0C] text-white overflow-hidden py-28 lg:py-40">
      <ScrollRevealContainer className="mx-auto flex flex-col items-center justify-center text-center w-full max-w-[1440px] px-6 sm:px-12 md:px-16 lg:px-20">
        
        {/* SECTION HEADER */}
        <ScrollReveal variant="slide-up" duration={600} delay={0}>
          <p className="mb-4 text-xs sm:text-sm font-mono uppercase tracking-[0.3em] text-white/40 font-semibold">
            THE SYSTEM PROCESS
          </p>
        </ScrollReveal>

        <ScrollReveal variant="slide-up" duration={600} delay={100}>
          <h2 className="font-serif text-[2.75rem] sm:text-[4rem] md:text-[5rem] font-bold leading-[1.05] tracking-[-0.03em] text-white mb-24">
            The Execution <br />
            <span className="text-white/40">Engine.</span>
          </h2>
        </ScrollReveal>

        {/* CENTERED VERTICAL PIPELINE WITH ADJUSTED GAP */}
        <div ref={containerRef} className="w-full flex flex-col items-center my-4">
          <div className="relative flex flex-col items-center gap-16 sm:gap-20 w-full max-w-[800px]">
            
            {/* Static Background Track (Centered) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-[2px] bg-white/10" />

            {/* Glowing Active Beam (Centered) */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 top-4 w-[2px] bg-white shadow-[0_0_18px_rgba(255,255,255,1)] origin-top"
              style={{
                height: "calc(100% - 32px)",
                scaleY: scrollYProgress,
              }}
            />

            {/* Pipeline Steps */}
            {workflowSteps.map((step, idx) => {
              const stepStart = idx / workflowSteps.length;
              const stepEnd = (idx + 1) / workflowSteps.length;

              const opacity = useTransform(scrollYProgress, [stepStart, stepEnd], [0.3, 1]);
              const color = useTransform(scrollYProgress, [stepStart, stepEnd], ["#71717a", "#ffffff"]);
              const textShadow = useTransform(
                scrollYProgress,
                [stepStart, stepEnd],
                ["0px 0px 0px rgba(255,255,255,0)", "0px 0px 24px rgba(255,255,255,1)"]
              );

              return (
                <div key={step} className="relative flex items-center justify-center w-full group cursor-pointer z-10">
                  {/* Node Connector Dot (Centered on line) */}
                  <motion.div
                    className="w-4 h-4 rounded-full border border-white/60 bg-[#0A0A0C] z-20 absolute left-1/2 -translate-x-1/2 transition-colors duration-300 group-hover:bg-white group-hover:border-white group-hover:shadow-[0_0_18px_#fff]"
                    style={{ backgroundColor: color }}
                  />

                  {/* Step Label - Added pl-12 sm:pl-16 for clean offset gap */}
                  <motion.span
                    style={{ opacity, color, textShadow }}
                    className="font-serif text-3xl sm:text-5xl md:text-6xl tracking-tight uppercase font-bold transition-all duration-300 pl-12 sm:pl-16 group-hover:!text-white group-hover:!opacity-100 group-hover:[text-shadow:0_0_32px_rgba(255,255,255,1)]"
                  >
                    {step}
                  </motion.span>
                </div>
              );
            })}
          </div>
        </div>

      </ScrollRevealContainer>
    </section>
  );
};

export default WorkflowSection;