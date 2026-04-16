import { IF_OPERATORS, MAGIC_NAMES } from "./constants";

export type IfOp = (typeof IF_OPERATORS)[number]["value"];

export type ConditionRow = {
  id: string;
  left: string;
  op: IfOp;
  right: string;
  connector: "&&" | "||";
};

export type MagicName = (typeof MAGIC_NAMES)[number];
