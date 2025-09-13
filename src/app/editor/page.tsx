import React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import VariableContainer from "@/features/variable-container";
import DataTypeContainer from "@/features/data-type-container";
import { Badge } from "@/components/ui/badge";
import FunctionsContainer from "@/features/functions-container";
import FunctionDefiner from "@/features/function-definer";

const Page = () => {
  return (
    <ResizablePanelGroup direction="horizontal" className="w-full">
      <ResizablePanel defaultSize={25} minSize={25}>
        <div className="space-y-6 p-4 h-full overflow-y-auto">
          <Badge variant="default"> Variables Initialization</Badge>
          <VariableContainer />
          <DataTypeContainer />
          <FunctionsContainer />  
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={25} minSize={25}>
        <div className="space-y-6 p-4 h-full overflow-y-auto">
          <Badge variant="default"> Define Function Actions</Badge>
          <FunctionDefiner />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={25}>
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel defaultSize={50} minSize={40}>
            <div className="p-4 h-full overflow-y-auto">
              <Badge variant="default">Run Flow</Badge>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={25}>
            <div className="p-4 h-full overflow-y-auto bg-slate-800">
              <Badge variant="default" className="text-white">Output</Badge>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Page;
