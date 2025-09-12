// Define editor state types
export interface EditorState {
  variables: { name: string; type: string; value: any }[];
  dataTypes: string[];
}

// Define the root state type that will be used throughout the application
export interface RootState {
  editor: EditorState;
}
