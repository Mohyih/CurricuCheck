import { useNavigate } from "react-router";
import { useEffect, useRef } from "react";

export function Hero() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = window.innerWidth;
  let height = window.innerHeight;
  let animationId: number;

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  resize();
  window.addEventListener("resize", resize);

  const blobs = [
    {
      x: 0.12,
      y: 0.22,
      size: 0.58,
      speed: 0.00025,
      phase: 0,
      color: [8, 88, 48],
      opacity: 0.21,
    },
    {
      x: 0.82,
      y: 0.18,
      size: 0.52,
      speed: 0.0002,
      phase: 2,
      color: [168, 201, 87],
      opacity: 0.20,
    },
    {
      x: 0.72,
      y: 0.78,
      size: 0.62,
      speed: 0.00018,
      phase: 4,
      color: [19, 101, 55],
      opacity: 0.18,
    },
    {
      x: 0.18,
      y: 0.82,
      size: 0.48,
      speed: 0.00022,
      phase: 5,
      color: [120, 180, 80],
      opacity: 0.15,
    },
  ];

  const draw = (time: number) => {
    ctx.clearRect(0, 0, width, height);

    // Base
    const background = ctx.createLinearGradient(
      0,
      0,
      width,
      height
    );

    background.addColorStop(0, "#edf8f1");
    background.addColorStop(0.45, "#f5faf7");
    background.addColorStop(1, "#e7f4eb");

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    // Moving green gradients
    blobs.forEach((blob) => {
      const movement = time * blob.speed;

      const x =
        width *
        (blob.x +
          Math.sin(movement + blob.phase) * 0.18);

      const y =
        height *
        (blob.y +
          Math.cos(movement * 1.2 + blob.phase) * 0.16);

      const radius =
        Math.min(width, height) * blob.size;

      const gradient = ctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        radius
      );

      gradient.addColorStop(
        0,
        `rgba(${blob.color.join(",")}, ${blob.opacity})`
      );

      gradient.addColorStop(
        0.4,
        `rgba(${blob.color.join(",")}, ${blob.opacity * 0.5})`
      );

      gradient.addColorStop(
        1,
        `rgba(${blob.color.join(",")}, 0)`
      );

      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Subtle flowing lines
    ctx.save();

    ctx.globalAlpha = 0.065;
    ctx.lineWidth = 1;

    for (let i = 0; i < 12; i++) {
      ctx.beginPath();

      for (let x = -100; x <= width + 100; x += 20) {
        const wave =
          Math.sin(
            x * 0.006 +
              time * 0.00025 +
              i * 0.7
          ) * 35;

        const y =
          height * 0.2 +
          i * 65 +
          wave;

        if (x === -100) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        i % 2 === 0
          ? "#085830"
          : "#A8C957";

      ctx.stroke();
    }

    ctx.restore();

    // Soft center glow
    const centerGlow = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.min(width, height) * 0.65
    );

    centerGlow.addColorStop(
      0,
      "rgba(255,255,255,0.32)"
    );

    centerGlow.addColorStop(
      1,
      "rgba(255,255,255,0)"
    );

    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, width, height);

    animationId = requestAnimationFrame(draw);
  };

  animationId = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(animationId);
    window.removeEventListener("resize", resize);
  };
}, []);
  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 pt-16 overflow-hidden"
    >
      {/* Animated Render-style background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Subtle background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 55%)",
        }}
      />

      {/* Content */}
      <div
        className="relative max-w-4xl mx-auto space-y-8"
        style={{ zIndex: 1 }}
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#085830] to-[#A8C957]">
            Access Your Curriculum Evaluation
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Evaluate curriculum progress, check subject eligibility, and receive
          subject recommendations based on your academic records.
        </p>

        <div className="flex items-center justify-center pt-4">
          <button
            onClick={() => navigate("/signup")}
            className="w-[190px] sm:w-auto px-6 sm:px-10 py-3 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-medium text-center shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
}