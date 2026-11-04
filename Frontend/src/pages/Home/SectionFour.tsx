
import { ScrollReveal, ScrollRevealContainer } from "@/components/common/ScrollReveal";
import { useNavigate } from "react-router-dom";

const SectionFour = () => {
  const navigate = useNavigate();
  const goToLogin = () => navigate("/login");
  return (
    <section className="w-full border-t border-white/10 bg-[#0A0A0C] text-white py-24 lg:py-36 overflow-hidden">
      <ScrollRevealContainer className="mx-auto flex flex-col items-center justify-center text-center w-full max-w-[1440px] px-6 sm:px-12 md:px-16 lg:px-20">
        
        <div className="w-full max-w-[850px] flex flex-col items-center text-center">
          
          {/* Eyebrow Label */}
          <ScrollReveal variant="slide-up" duration={600} delay={0}>
            <p className="mb-6 text-xs font-mono uppercase tracking-[0.25em] text-white/40 font-semibold">
              BUILT-IN ACCOUNTABILITY
            </p>
          </ScrollReveal>

          {/* Headline - Serif Editorial Style */}
          <ScrollReveal variant="slide-up" duration={600} delay={100}>
            <h2 className="font-serif text-[3rem] sm:text-[4.25rem] md:text-[5rem] lg:text-[5.5rem] font-bold leading-[0.98] tracking-[-0.04em] text-white">
              Ready to manage expenses <br />
              <span className="text-white/40">with clarity?</span>
            </h2>
          </ScrollReveal>

          {/* Subtitle Paragraph */}
          <ScrollReveal variant="slide-up" duration={600} delay={200}>
            <p className="mt-8 max-w-[580px] text-base sm:text-lg md:text-xl font-light leading-[1.6] text-white/60">
              Sign in to your workspace and keep every expense moving through the right approval process.
            </p>
          </ScrollReveal>

          {/* Pill Action Button */}
          <ScrollReveal variant="slide-up" duration={600} delay={300} className="mt-12">
            <button 
            onClick={goToLogin}
            className="bg-white text-black hover:bg-white/90 px-9 py-4 rounded-full text-xs font-mono font-bold uppercase tracking-[0.2em] transition-all duration-300 hover:scale-[1.02] shadow-[0_0_25px_rgba(255,255,255,0.15)] flex items-center gap-3">
              Enter the application <span className="text-base">→</span>
            </button>
          </ScrollReveal>

        </div>

      </ScrollRevealContainer>
    </section>
  );
};

export default SectionFour;