const PETALS = [
  { left: '6%', delay: '0s', duration: '11s', size: 14 },
  { left: '16%', delay: '2.2s', duration: '13s', size: 18 },
  { left: '28%', delay: '4.1s', duration: '10.5s', size: 12 },
  { left: '41%', delay: '1.3s', duration: '12.5s', size: 16 },
  { left: '54%', delay: '3.6s', duration: '11.8s', size: 15 },
  { left: '67%', delay: '0.8s', duration: '14s', size: 17 },
  { left: '79%', delay: '5.0s', duration: '12s', size: 13 },
  { left: '91%', delay: '2.7s', duration: '10.8s', size: 16 },
];

export default function FloatingPetals() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-10 overflow-hidden pointer-events-none"
    >
      {PETALS.map((petal, idx) => (
        <span
          key={idx}
          className="petal-drift absolute -top-8 rounded-tl-full rounded-br-full bg-gradient-to-br from-rose-200/80 via-pink-300/75 to-rose-400/70 shadow-sm"
          style={{
            left: petal.left,
            width: `${petal.size}px`,
            height: `${Math.round(petal.size * 0.72)}px`,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
          }}
        />
      ))}
    </div>
  );
}
