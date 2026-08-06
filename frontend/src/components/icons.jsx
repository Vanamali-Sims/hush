/* Static, literal inline icons. Decorative only — every icon sits beside a
 * text label that carries the same meaning (autism research: tightly aligned
 * icon and label, no clever or abstract symbols). No animation, currentColor. */

function Svg({ size = 18, children, strokeWidth = 1.8 }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** Start point — a map pin. */
export function PinIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2" />
    </Svg>
  );
}

/** Destination — a flag. */
export function FlagIcon(props) {
  return (
    <Svg {...props}>
      <path d="M6 21V4" />
      <path d="M6 5h11l-2 3 2 3H6" />
    </Svg>
  );
}

/** LOW badge — a leaf (calm). */
export function LeafIcon(props) {
  return (
    <Svg {...props}>
      <path d="M5 19c8 0 14-4 14-13 0 0-13-2-13 7 0 2 1 4 3 5" />
      <path d="M5 19c1.5-3 3.5-5 6-6.5" />
    </Svg>
  );
}

/** HIGH badge — a caution triangle. */
export function CautionIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 4 3 19h18L12 4Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </Svg>
  );
}

/** NO DATA badge — a dash (nothing measured). */
export function DashIcon(props) {
  return (
    <Svg {...props}>
      <path d="M6 12h12" />
    </Svg>
  );
}

/** Data freshness — a clock. */
export function ClockIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 1.5" />
    </Svg>
  );
}

/** Quiet space — a hush / calm mark. */
export function QuietIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <path d="M4 15a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2Z" />
      <path d="M20 15a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2Z" />
    </Svg>
  );
}

/** Threshold — sliders. */
export function SlidersIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 8h11" />
      <path d="M19 8h1" />
      <circle cx="17" cy="8" r="2" />
      <path d="M4 16h5" />
      <path d="M13 16h7" />
      <circle cx="11" cy="16" r="2" />
    </Svg>
  );
}
