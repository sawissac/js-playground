export interface VariableInterface {
  name: string;
  type: string;
  value: any;
}

export interface FunctionActionInterface {
  name: string;
  dataType: string;
  value: any;
}

export interface FunctionInterface {
  name: string;
  dataType: string;
  actions: FunctionActionInterface[];
}

export interface Runner {
  type: "set" | "call";
  target: [string, string];
}

export interface EditorState {
  variables: VariableInterface[];
  dataTypes: string[];
  functions: FunctionInterface[];
  runner: Runner[];
}

export interface LogState {
  logs: { type: "error" | "warning" | "info"; message: string }[];
}
