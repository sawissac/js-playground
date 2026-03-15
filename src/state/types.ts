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
  subActions?: FunctionActionInterface[]; // for "when" conditional blocks and "loop" iterations
  loopParams?: {
    start?: string;
    end?: string;
    step?: string;
  }; // for "loop" action parameters
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

export interface LogEntry {
  type: "error" | "warning" | "info";
  message: string;
  timestamp: number;
  context?: string; // e.g. function name or step label
}

export interface LogState {
  logs: LogEntry[];
}
