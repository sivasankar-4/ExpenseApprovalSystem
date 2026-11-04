import { ScrollReveal, ScrollRevealContainer } from "@/components/common/ScrollReveal";

// --- Vertical Pipeline Component ---
// const workflowSteps = ["SUBMIT", "REVIEW", "APPROVE / REJECT", "TRACK"];

// function VerticalWorkflow() {
//   const containerRef = useRef(null);

//   const { scrollYProgress } = useScroll({
//     target: containerRef,
//     offset: ["start 80%", "end 50%"],
//   });

//   return (
//     <div ref={containerRef} className="mt-14 flex flex-col items-center gap-8 font-mono">
//       {/* Label Header */}
//       <span className="text-sm uppercase tracking-[0.3em] text-white/40 font-semibold mb-2">
//         WORKFLOW PIPELINE
//       </span>

//       <div className="relative pl-8 flex flex-col items-start gap-10">
//         {/* Static Track Line */}
//         <div className="absolute left-[5px] top-3 bottom-3 w-[2px] bg-white/10" />

//         {/* Dynamic Glowing Beam */}
//         <motion.div
//           className="absolute left-[5px] top-3 w-[2px] bg-white shadow-[0_0_14px_rgba(255,255,255,0.9)] origin-top"
//           style={{
//             height: "calc(100% - 24px)",
//             scaleY: scrollYProgress,
//           }}
//         />

//         {/* Steps */}
//         {workflowSteps.map((step, idx) => {
//           const stepStart = idx / workflowSteps.length;
//           const stepEnd = (idx + 1) / workflowSteps.length;

//           const opacity = useTransform(scrollYProgress, [stepStart, stepEnd], [0.35, 1]);
//           const color = useTransform(scrollYProgress, [stepStart, stepEnd], ["#71717a", "#ffffff"]);
//           const textShadow = useTransform(
//             scrollYProgress,
//             [stepStart, stepEnd],
//             ["0px 0px 0px rgba(255,255,255,0)", "0px 0px 20px rgba(255,255,255,0.95)"]
//           );

//           return (
//             <div key={step} className="relative flex items-center gap-5 group cursor-pointer">
//               {/* Connector Dot */}
//               <motion.div
//                 className="w-3.5 h-3.5 rounded-full border border-white/50 bg-[#0A0A0C] z-10 -ml-[39px] transition-colors duration-300 group-hover:bg-white group-hover:border-white group-hover:shadow-[0_0_14px_#fff]"
//                 style={{ backgroundColor: color }}
//               />

//               {/* Text Label - Extra Large & Bold */}
//               <motion.span
//                 style={{ opacity, color, textShadow }}
//                 className="text-xl sm:text-2xl md:text-3xl tracking-[0.2em] uppercase font-bold transition-all duration-300 group-hover:!text-white group-hover:!opacity-100 group-hover:[text-shadow:0_0_22px_rgba(255,255,255,1)]"
//               >
//                 {step}
//               </motion.span>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// --- Main Section Component ---
const SectionTwo = () => {
  return (
    <section className="w-full border-t border-white/10 bg-[#0A0A0C] text-white overflow-hidden py-24 lg:py-36">
      <ScrollRevealContainer className="mx-auto flex flex-col items-center justify-center text-center w-full max-w-[1440px] px-6 sm:px-12 md:px-16 lg:px-20">
        
        {/* CENTERED CONTENT COLUMN */}
        <div className="w-full max-w-[800px] flex flex-col items-center text-center">
          {/* Main Headline */}
          <ScrollReveal variant="slide-up" duration={600} delay={0}>
            <h2 className="font-serif text-[3.25rem] sm:text-[4.5rem] md:text-[5.25rem] lg:text-[5.5rem] font-bold leading-[0.98] tracking-[-0.04em] text-white">
              do more with
              <br />
              <span className="text-white/40">
                your expenses
              </span>
            </h2>
          </ScrollReveal>

          {/* Subtitle Paragraph */}
          <ScrollReveal variant="slide-up" duration={600} delay={100}>
            <p className="mt-8 max-w-[580px] text-base sm:text-lg md:text-xl font-light leading-[1.6] text-white/60">
              Automate policy reviews, streamline manager checks, and track payment schedules automatically. Our system moves every expense request through a clear, accountable lifecycle.
            </p>
          </ScrollReveal>

          {/* Centered Vertical Workflow Pipeline
          <ScrollReveal variant="slide-up" duration={600} delay={200} className="w-full flex justify-center items-center">
          
          </ScrollReveal> */}
        </div>

      </ScrollRevealContainer>
    </section>
  );
};

export default SectionTwo;