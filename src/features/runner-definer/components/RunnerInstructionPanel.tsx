import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  IconInfoCircle,
  IconTriangleFilled,
  IconSquareFilled,
  IconCode,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export const RunnerInstructionPanel = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 w-full text-left text-blue-700 font-medium text-xs",
            "rounded-md border border-blue-200 bg-blue-50 p-2",
            "transition-all duration-200 hover:shadow-sm hover:text-blue-800",
          )}
        >
          <IconInfoCircle size={13} />
          What can I do here?
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3 text-xs">
          <div>
            <p className="text-blue-900 font-semibold mb-1">
              Building Runner Flows
            </p>
            <p className="text-blue-800 line-clamp-3">
              Compose ordered steps that execute from top to bottom. Use the Runner to test logic, manipulate data, or render visual outputs.
            </p>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-start gap-1.5">
              <IconTriangleFilled size={12} className="text-blue-700 mt-0.5 shrink-0" />
              <div>
                <strong className="text-blue-900">Set Variable</strong>
                <p className="text-blue-800 text-[11px] leading-tight mt-0.5">Initialize or overwrite variables with static strings, numbers, booleans, arrays, or JSON arrays.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-1.5">
              <IconSquareFilled size={12} className="text-blue-700 mt-0.5 shrink-0" />
              <div>
                <strong className="text-blue-900">Call Function</strong>
                <p className="text-blue-800 text-[11px] leading-tight mt-0.5">Execute your custom JavaScript functions on variables using your defined data types.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-1.5">
              <IconCode size={12} className="text-blue-700 mt-0.5 shrink-0" />
              <div>
                <strong className="text-blue-900">Code Step</strong>
                <p className="text-blue-800 text-[11px] leading-tight mt-0.5">Write freeform JS, return computed values, access variables with <code className="bg-blue-100 rounded px-1">@token</code> shortcuts, or manipulate the visual Renderer using <code className="bg-blue-100 rounded px-1">@renderer</code>.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-100/50 p-2 rounded-md border border-blue-200 mt-2">
            <p className="text-blue-800 text-[10px] italic">
              Note: All variables must be typed before running. Click "Run" or open the "Renderer" to execute the flow.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
