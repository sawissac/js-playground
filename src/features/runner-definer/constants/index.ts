export const CODE_TOKENS: { token: string; desc: string }[] = [
  { token: "@this", desc: "target variable's current value" },
  { token: "@t", desc: "current value (short)" },
  { token: "@renderer", desc: "renderer element ID" },
  { token: "@r", desc: "renderer ID (short)" },
  { token: "@space", desc: 'space character " "' },
  { token: "@s", desc: "space (short)" },
  { token: "@comma", desc: 'comma character ","' },
  { token: "@c", desc: "comma (short)" },
  { token: "@empty", desc: "empty string" },
  { token: "@e", desc: "empty (short)" },
];

export const SET_VALUE_HINTS: Record<string, string> = {
  string: "Plain text — e.g. hello world",
  array: "Comma-separated — e.g. a, b, c",
  number: "A number — e.g. 42",
  boolean: "true or false",
  object: 'JSON — e.g. {"key":"value"}',
};
