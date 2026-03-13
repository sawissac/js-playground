export const DataTypes = ["string", "array", "number", "boolean"] as const;

export type DataType = (typeof DataTypes)[number];
