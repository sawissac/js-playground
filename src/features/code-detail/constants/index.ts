export const TYPE_COLORS: Record<string, string> = {
  string: "text-green-700 bg-green-50 border-green-200",
  number: "text-blue-700 bg-blue-50 border-blue-200",
  boolean: "text-purple-700 bg-purple-50 border-purple-200",
  array: "text-orange-700 bg-orange-50 border-orange-200",
  object: "text-yellow-700 bg-yellow-50 border-yellow-200",
};

export const TYPE_BADGE_COLORS: Record<string, string> = {
  string: "bg-green-100 text-green-700",
  number: "bg-blue-100 text-blue-700",
  boolean: "bg-purple-100 text-purple-700",
  array: "bg-orange-100 text-orange-700",
  object: "bg-yellow-100 text-yellow-700",
};

export const NODE_W = 100;
export const NODE_H = 34;
export const H_GAP = 40;
export const V_GAP = 60;

export const KIND_STYLES: Record<
  string,
  { fill: string; stroke: string; textColor: string; rx: number }
> = {
  variable: { fill: "#dbeafe", stroke: "#3b82f6", textColor: "#1d4ed8", rx: 6 },
  function: {
    fill: "#f3e8ff",
    stroke: "#a855f7",
    textColor: "#7e22ce",
    rx: 14,
  },
};

export const TYPE_FILL: Record<string, string> = {
  string: "#dcfce7",
  number: "#dbeafe",
  boolean: "#f3e8ff",
  array: "#ffedd5",
  object: "#fef9c3",
};
