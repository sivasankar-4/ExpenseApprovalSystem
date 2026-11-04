import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/util";

interface ScrollRevealContextType {
  hasRevealed: boolean;
}

const ScrollRevealContext = createContext<ScrollRevealContextType | null>(null);

export interface ScrollRevealContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  threshold?: number;
  triggerOnce?: boolean;
}

export const ScrollRevealContainer: React.FC<ScrollRevealContainerProps> = ({
  children,
  className,
  threshold = 0.1,
  triggerOnce = true,
  ...props
}) => {
  const [hasRevealed, setHasRevealed] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setHasRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasRevealed(true);
          if (triggerOnce && elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        } else if (!triggerOnce) {
          setHasRevealed(false);
        }
      },
      { threshold }
    );

    const currentEl = elementRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, [threshold, triggerOnce]);

  return (
    <ScrollRevealContext.Provider value={{ hasRevealed }}>
      <div
        ref={elementRef}
        className={className}
        data-revealed={hasRevealed}
        {...props}
      >
        {children}
      </div>
    </ScrollRevealContext.Provider>
  );
};

export interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "fade" | "slide-up" | "slide-down" | "zoom" | "none";
  duration?: number; // duration in ms
  delay?: number; // delay in ms
  threshold?: number;
  triggerOnce?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className,
  variant = "slide-up",
  duration = 600, // Premium duration
  delay = 0,
  threshold = 0.1,
  triggerOnce = true,
  ...props
}) => {
  const parentContext = useContext(ScrollRevealContext);
  const [localHasRevealed, setLocalHasRevealed] = useState(false);
  const localRef = useRef<HTMLDivElement>(null);

  const isParent = !!parentContext;
  const hasRevealed = isParent ? parentContext.hasRevealed : localHasRevealed;

  useEffect(() => {
    if (isParent) return;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setLocalHasRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLocalHasRevealed(true);
          if (triggerOnce && localRef.current) {
            observer.unobserve(localRef.current);
          }
        } else if (!triggerOnce) {
          setLocalHasRevealed(false);
        }
      },
      { threshold }
    );

    const currentEl = localRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, [isParent, threshold, triggerOnce]);

  const variantClasses = {
    fade: "opacity-0 data-[revealed=true]:opacity-100 data-[revealed=true]:animate-in data-[revealed=true]:fade-in data-[revealed=true]:fill-mode-both",
    "slide-up":
      "opacity-0 translate-y-4 data-[revealed=true]:opacity-100 data-[revealed=true]:translate-y-0 data-[revealed=true]:animate-in data-[revealed=true]:fade-in data-[revealed=true]:slide-in-from-bottom-4 data-[revealed=true]:fill-mode-both",
    "slide-down":
      "opacity-0 -translate-y-4 data-[revealed=true]:opacity-100 data-[revealed=true]:translate-y-0 data-[revealed=true]:animate-in data-[revealed=true]:fade-in data-[revealed=true]:slide-in-from-top-4 data-[revealed=true]:fill-mode-both",
    zoom: "opacity-0 scale-[0.98] data-[revealed=true]:opacity-100 data-[revealed=true]:scale-100 data-[revealed=true]:animate-in data-[revealed=true]:fade-in data-[revealed=true]:zoom-in-[0.98] data-[revealed=true]:fill-mode-both",
    none: "",
  };

  const style: React.CSSProperties & { [key: string]: string | number | undefined } = {
    ...props.style,
  };

  if (hasRevealed) {
    if (duration !== undefined) {
      style["--tw-animation-duration"] = `${duration}ms`;
      style.animationDuration = `${duration}ms`;
      style.transitionDuration = `${duration}ms`;
    }
    if (delay !== undefined) {
      style["--tw-animation-delay"] = `${delay}ms`;
      style.animationDelay = `${delay}ms`;
      style.transitionDelay = `${delay}ms`;
    }
  }

  return (
    <div
      ref={isParent ? undefined : localRef}
      data-revealed={hasRevealed}
      style={style}
      className={cn(
        "transition-all ease-premium motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100",
        !hasRevealed && variant !== "none" ? "opacity-0" : "",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
