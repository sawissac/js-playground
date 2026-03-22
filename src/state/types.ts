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
  codeName?: string; // user-defined name for "code" actions
  subActions?: FunctionActionInterface[]; // for "when" conditional blocks and "loop" iterations
  loopParams?: {
    start?: string;
    end?: string;
    step?: string;
  }; // for "loop" action parameters
}

export interface CodeSnippetInterface {
  id: string;
  name: string;
  code: string;
}

export interface FunctionInterface {
  id: string;
  name: string;
  dataType: string;
  actions: FunctionActionInterface[];
}

export interface Runner {
  id: string;
  type: "set" | "call" | "code";
  target: [string, string];
  args: any[];
  code?: string;
}

export interface CdnPackage {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface Package {
  id: string;
  name: string;
  enabled: boolean;
  variables: VariableInterface[];
  functions: FunctionInterface[];
  runner: Runner[];
  codeSnippets: CodeSnippetInterface[];
  cdnPackages: CdnPackage[];
}

export interface EditorState {
  projectId: string;
  projectName: string;
  packages: Package[];
  activePackageId: string;
  dataTypes: string[];
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
