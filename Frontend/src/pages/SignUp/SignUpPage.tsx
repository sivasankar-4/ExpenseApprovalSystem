import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Eye,EyeOff, Loader2 } from "lucide-react";
import { signup } from "@/services/auth/authService";
import { signupSchema } from "@/schemas/auth.schema";

const SignUpPage = () => {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const getSignupErrorMessage = (signupError: unknown): string => {
    if (!isAxiosError(signupError)) {
      return "Unable to create your account. Please try again.";
    }

    if (!signupError.response) {
      return "Unable to reach the server. Please check your connection and try again.";
    }

    if (signupError.response.status === 409) {
      return "Unable to create the account with those details. Please try again or log in.";
    }

    if (signupError.response.status === 400 || signupError.response.status === 422) {
      return "Please check your details and try again.";
    }

    return "The server could not create your account. Please try again later.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = signupSchema.safeParse({ name, email, password, companyName });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Please check your details.");
      return;
    }

    setIsLoading(true);

    try {
      await signup(validation.data);
      navigate("/login", {
        replace: true,
        state: { signupSuccess: true },
      });
    } catch (signupError) {
      setError(getSignupErrorMessage(signupError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0A0A0C] text-white flex flex-col items-center justify-center overflow-hidden font-sans">
      
      {/* 1. Subtle Dark Radial Dot-Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px)`,
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse at center, black, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black, transparent 80%)"
        }}
      />

      {/* 2. Ambient Lighting Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none animate-pulse duration-[12000ms]" />
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      {/* Main Content Area */}
      <main className="relative z-20 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] flex flex-col items-center">
          
          {/* Header Typography */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-white mb-2 leading-tight">
              Welcome Developer
            </h1>
            <p className="text-sm font-normal text-neutral-400 tracking-wide uppercase">
              Your sign in component
            </p>
          </div>

          {/* Glassmorphic Form Card */}
          <div className="w-full px-6 sm:px-8 py-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-[0_24px_64px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden">
            
            {/* Soft inner card top light bar */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Google Sign-In Button */}
             

              {/* Divider Line */}

              {/* Form Validation Errors */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 backdrop-blur-md"
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Name Input */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-neutral-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Email Input with Inline Submit Arrow */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white placeholder-neutral-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              {/* Company Name Input */}
              <div className="space-y-2">
                <label htmlFor="companyName" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Company Name
                </label>
                <input
                  id="companyName"
                  type="text"
                  placeholder="Your company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-neutral-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Secondary Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white placeholder-neutral-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors duration-200 focus:outline-none disabled:opacity-50 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                </div>
                 <button
                     type="submit"
                      disabled={isLoading}
              className="w-full bg-white text-black font-mono font-bold text-xs uppercase tracking-[0.15em] py-3 rounded-xl hover:bg-white/90 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
              >
            {isLoading ? (
           <Loader2 className="w-4 h-4 animate-spin" />
             ) : (
            "Create Account"
           )}
           </button>
              </div>

            </form>

            {/* Bottom Form Redirection */}
            <div className="mt-6 text-center text-xs text-neutral-400">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="font-semibold text-white hover:underline transition-colors focus:outline-none cursor-pointer"
              >
                Log in
              </button>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
};

export default SignUpPage;
