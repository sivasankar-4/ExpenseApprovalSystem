import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { login } from "@/services/auth/authService";
import { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/schemas/auth.schema";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const signupSuccess = Boolean(
    (location.state as { signupSuccess?: boolean } | null)?.signupSuccess,
  );

  // Form states
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);


  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null);
    setIsLoading(true);

    try {
      await login(data);
      navigate("/dashboard");
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        if (!error.response) {
          setLoginError("A network error occurred. Please check your connection and try again.");
        } else if (error.response.status === 401 || error.response.status === 400) {
          setLoginError("Invalid email or password.");
        } else {
          setLoginError("A server error occurred. Please try again later.");
        }
      } else {
        setLoginError("A server error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0A0A0C] text-white flex flex-col items-center justify-center px-4 overflow-hidden font-sans">
      
      {/* 1. Subtle Dark Radial Dot-Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-45"
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
      <main className="relative z-20 flex flex-col items-center justify-center w-full max-w-[420px]">
        
        {/* Header Typography */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white mb-2 leading-tight">
            Welcome Back
          </h1>
          <p className="text-sm font-normal text-white/50">
            Sign in to access your expense workspace
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="w-full p-8 rounded-2xl border border-white/10 bg-[#0F0F12]/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          
          {/* Soft inner card top light bar */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            
           

            {/* Form Validation Errors */}
            <AnimatePresence mode="wait">
              {signupSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 text-xs rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 backdrop-blur-md"
                  role="status"
                >
                  Account created successfully. Please log in.
                </motion.div>
              )}
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 backdrop-blur-md"
                  role="alert"
                  aria-live="polite"
                >
                  {loginError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[10px] font-mono tracking-[0.15em] text-white/50 uppercase">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register("email")}
                disabled={isLoading}
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-neutral-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-[10px] font-mono tracking-[0.15em] text-white/50 uppercase">
                  Password
                </label>
               
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  {...register("password")}
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
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Full-width Pill Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-mono font-bold text-xs uppercase tracking-[0.15em] py-3 rounded-xl hover:bg-white/90 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>

          </form>

          {/* Bottom Form Redirection */}
          <div className="mt-6 text-center text-xs text-neutral-400">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="font-semibold text-white hover:underline transition-colors focus:outline-none cursor-pointer"
            >
              Sign up
            </button>
          </div>

        </div>

      </main>

    </div>
  );
};

export default LoginPage;
