"use client";

interface ParticleBurstProps {
  color: string;
}

const PARTICLE_COUNT = 10;

export default function ParticleBurst({ color }: ParticleBurstProps) {
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const baseAngle = (i / PARTICLE_COUNT) * Math.PI * 2;
    const angle = baseAngle + (Math.random() - 0.5) * 0.6;
    const distance = 20 + Math.random() * 20;
    const size = 2 + Math.random() * 2;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const delay = Math.random() * 80;

    return { x, y, size, delay, id: i };
  });

  return (
    <>
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle-burst-dot"
          style={{
            "--burst-x": `${p.x}px`,
            "--burst-y": `${p.y}px`,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            animationDelay: `${p.delay}ms`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}
