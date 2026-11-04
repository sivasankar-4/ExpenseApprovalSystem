import React, { useEffect, useRef } from "react";

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Start with a pre-advanced time seed so the wave geometry is fully developed on Frame 0
    let time = 1200;

    // 4 layered 3D ribbon fields forming a rich, vivid 3D wave across the lower half
    const ribbonGroups = [
      // 1. Primary Deep Violet / Purple Ribbon Field (High initial visibility)
      {
        strandCount: 36,
        baseYRatio: 0.78,
        ampScale: 0.28,
        frequency: 0.00075,
        speed: 0.0035,
        strandSpacing: 4.0,
        phaseOffsetStep: 0.03,
        baseStrokeWidth: 1.5,
        colorStart: "rgba(139, 92, 246, ", // Violet-500
        colorMid: "rgba(99, 102, 241, ",   // Indigo-500
        colorEnd: "rgba(30, 27, 75, 0)",
      },
      // 2. Cyan / Electric Blue Crest Sheen (Top luminous ridge)
      {
        strandCount: 26,
        baseYRatio: 0.72,
        ampScale: 0.24,
        frequency: 0.0010,
        speed: 0.005,
        strandSpacing: 3.0,
        phaseOffsetStep: 0.04,
        baseStrokeWidth: 1.2,
        colorStart: "rgba(59, 130, 246, ",  // Blue-500
        colorMid: "rgba(168, 85, 247, ",   // Purple-500
        colorEnd: "rgba(15, 23, 42, 0)",
      },
      // 3. Crimson / Warm Orange Accent Ribbon (Lower wave highlights)
      {
        strandCount: 20,
        baseYRatio: 0.84,
        ampScale: 0.30,
        frequency: 0.00065,
        speed: 0.0028,
        strandSpacing: 4.5,
        phaseOffsetStep: 0.05,
        baseStrokeWidth: 1.3,
        colorStart: "rgba(225, 29, 72, ",  // Rose-600
        colorMid: "rgba(249, 115, 22, ",   // Orange-500
        colorEnd: "rgba(10, 10, 12, 0)",
      },
      // 4. White / Cyan Specular Focal Strands
      {
        strandCount: 12,
        baseYRatio: 0.76,
        ampScale: 0.26,
        frequency: 0.0012,
        speed: 0.0045,
        strandSpacing: 5.2,
        phaseOffsetStep: 0.06,
        baseStrokeWidth: 1.0,
        colorStart: "rgba(224, 242, 254, ", // Sky-100 highlight
        colorMid: "rgba(129, 140, 248, ",   // Indigo-400
        colorEnd: "rgba(10, 10, 12, 0)",
      },
    ];

    // Ambient background particles
    const particleCount = 22;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random(),
      y: 0.52 + Math.random() * 0.44,
      radius: Math.random() * 1.5 + 0.6,
      speedX: (Math.random() - 0.5) * 0.00018,
      speedY: (Math.random() - 0.5) * 0.00018,
      alpha: Math.random() * 0.35 + 0.12,
      hue: Math.random() > 0.3 ? 250 + Math.random() * 30 : 345 + Math.random() * 15,
    }));

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep dark canvas background
      ctx.fillStyle = "#06050A";
      ctx.fillRect(0, 0, width, height);

      // Dedicated dark radial vignette over upper text region
      const textVignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.35,
        30,
        width * 0.5,
        height * 0.35,
        width * 0.6
      );
      textVignette.addColorStop(0, "rgba(6, 5, 10, 0.98)");
      textVignette.addColorStop(0.65, "rgba(6, 5, 10, 0.75)");
      textVignette.addColorStop(1, "rgba(6, 5, 10, 0)");
      ctx.fillStyle = textVignette;
      ctx.fillRect(0, 0, width, height);

      // Render 3D Volumetric Flowing Ribbon Field
      ribbonGroups.forEach((group, gIndex) => {
        const baseY = height * group.baseYRatio;
        const amplitude = height * group.ampScale;
        const groupTime = time * group.speed;

        for (let s = 0; s < group.strandCount; s++) {
          const centerDist = Math.abs(s - group.strandCount / 2) / (group.strandCount / 2);
          const strandOffset = (s - group.strandCount / 2) * group.strandSpacing;
          const phaseOffset = s * group.phaseOffsetStep;

          // Boosted depth opacity for immediate high visibility on frame 0
          const zPerspective = 0.6 + (1 - centerDist) * 0.4;
          const strokeWidth = group.baseStrokeWidth * zPerspective;
          const alpha = ((1 - centerDist * 0.6) * 0.45 * zPerspective + 0.12).toFixed(3);

          ctx.beginPath();
          for (let x = -20; x <= width + 20; x += 8) {
            const primaryWave = Math.sin(x * group.frequency + groupTime + phaseOffset + gIndex) * amplitude;
            const secondaryWave = Math.cos(x * group.frequency * 0.45 - groupTime * 0.6 + phaseOffset) * (amplitude * 0.5);
            const tertiaryWave = Math.sin(x * 0.002 - groupTime * 0.3) * (amplitude * 0.2);

            const expansion = 1 + Math.sin(x * 0.0012 + groupTime * 0.8 + s * 0.04) * 0.55;
            const y = baseY + strandOffset * expansion + primaryWave + secondaryWave + tertiaryWave;

            if (x === -20) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          const lineGrad = ctx.createLinearGradient(0, 0, width, 0);
          lineGrad.addColorStop(0, `${group.colorStart}0)`);
          lineGrad.addColorStop(0.12, `${group.colorStart}${alpha})`);
          lineGrad.addColorStop(0.65, `${group.colorMid}${alpha})`);
          lineGrad.addColorStop(1, group.colorEnd);

          ctx.strokeStyle = lineGrad;
          ctx.lineWidth = strokeWidth;
          if (s % 5 === 0) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = `${group.colorStart}0.45)`;
          } else {
            ctx.shadowBlur = 0;
          }
          ctx.stroke();
        }
      });
      ctx.shadowBlur = 0;

      // Render ambient particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0.5) p.y = 0.94;
        if (p.y > 0.96) p.y = 0.52;

        const px = p.x * width;
        const py = p.y * height;

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 75%, 65%, ${p.alpha})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = `hsla(${p.hue}, 75%, 65%, ${p.alpha})`;
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    };

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      // Immediately render frame 0 on resize so canvas is never blank
      drawFrame();
    };

    handleResize();
    const resizeObserver = new ResizeObserver(() => handleResize());
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const animate = () => {
      time += 1;
      drawFrame();
      animationFrameId = requestAnimationFrame(animate);
    };

    // Synchronously render Frame 0 IMMEDIATELY before starting the RAF loop
    drawFrame();
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block pointer-events-none"
    />
  );
};

export default AnimatedBackground;
