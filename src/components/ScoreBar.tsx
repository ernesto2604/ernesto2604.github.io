// Relevance bar. Scale animates from 0 the first time `show` turns true (CSS transition).
export default function ScoreBar({ value, show }: { value: number; show: boolean }) {
  return (
    <span aria-hidden="true" className="block h-1 w-full overflow-hidden rounded-full bg-line">
      <span
        className="score-fill block h-full origin-left rounded-full bg-accent-fill"
        style={{ transform: `scaleX(${show ? value : 0})` }}
      />
    </span>
  );
}
