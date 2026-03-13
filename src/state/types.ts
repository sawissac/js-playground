export interface VariableInterface {
  id: string;
  name: string;
  type: string;
  value: any;
}

export interface FunctionActionInterface {
  id: string;
  name: string;
  dataType: string;
  value: any;
}

export interface FunctionInterface {
  id: string;
  name: string;
  dataType: string;
  actions: FunctionActionInterface[];
}

export interface Runner {
  id: string;
  type: "set" | "call";
  target: [string, string];
  args: any[];
}

export interface EditorState {
  dataTypes: string[];
  variables: VariableInterface[];
  functions: FunctionInterface[];
  runner: Runner[];
}

export interface LogState {
  logs: { type: "error" | "warning" | "info"; message: string }[];
}
