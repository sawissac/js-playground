import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconInfoCircle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import React from "react";

export const DataTypeInstructionPanel = () => {
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
              Data Type Assignment
            </p>
            <p className="text-blue-800 line-clamp-3">
              Assign strong typing to your variables. Variables without a type cannot be used in Runner flows.
            </p>
          </div>
          
          <div className="bg-amber-100/50 p-2 rounded-md border border-amber-200 mt-2">
            <p className="text-amber-800 text-[11px] leading-tight">
              <strong>Tip:</strong> Save time by defining types inline in the Variables panel using the format <code className="bg-amber-200/50 px-1 rounded font-mono">myVar:string</code>.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
