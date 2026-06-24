import type { CSSProperties } from 'react';

const DOTS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 1],
    [0, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
};

type DiceFaceProps = {
  value: number;
  rolling?: boolean;
  winner?: boolean;
  color?: string;
};

export function DiceFace({ value, rolling, winner, color }: DiceFaceProps) {
  const face = Math.min(6, Math.max(1, value));
  const dots = DOTS[face] ?? DOTS[1];

  return (
    <div
      className={`dice-face ${rolling ? 'dice-face--rolling' : ''} ${winner ? 'dice-face--winner' : ''}`}
      style={color ? ({ '--dice-accent': color } as CSSProperties) : undefined}
      aria-label={`קוביה: ${face}`}
    >
      <div className="dice-face__inner">
        {dots.map(([row, col], i) => (
          <span
            key={i}
            className="dice-face__dot"
            style={{ gridRow: row + 1, gridColumn: col + 1 }}
          />
        ))}
      </div>
    </div>
  );
}
