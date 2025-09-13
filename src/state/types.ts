export interface Variable {
  name: string;
  type: string;
  value: any;
}

export interface FunctionAction {
  name: string;
  dataType: string;
  value: any;
}

export interface EditorState {
  variables: Variable[];
  dataTypes: string[];
  functions: { name: string; type: string; actions: FunctionAction[] }[];
}

// Define the root state type that will be used throughout the application
export interface RootState {
  editor: EditorState;
}
