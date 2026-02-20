type Parsed = {
  title: string;
  porter: boolean;
  brickley: boolean;
};

export function parseAssigned(input: string): Parsed {
  const raw = input.trim();
  const lower = raw.toLowerCase();

  const hitPorter = /\b(porter|\bp\b)\b/.test(lower);
  const hitBrickley = /\b(brickley|\bb\b)\b/.test(lower);

  const m = raw.match(/^(.*?)(\s*[-–—]\s*(assigned\s+to|for)\s+.*)$/i);
  const title = (m?.[1] ?? raw).trim();

  return {
    title,
    porter: hitPorter,
    brickley: hitBrickley,
  };
}
