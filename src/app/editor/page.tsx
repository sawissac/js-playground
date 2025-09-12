import React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useAppDispatch } from "@/state/hooks";
import VariableContainer from "@/features/variable-container";
import DataTypeContainer from "@/features/data-type-container";
import { Badge } from "@/components/ui/badge";

const Page = () => {
  return (
    <ResizablePanelGroup direction="horizontal" className="w-full">
      <ResizablePanel>
        <div className="space-y-6 p-4">
          <Badge variant="default"> Variables Initialization</Badge>
          <VariableContainer />
          <DataTypeContainer />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel></ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel></ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Page;
