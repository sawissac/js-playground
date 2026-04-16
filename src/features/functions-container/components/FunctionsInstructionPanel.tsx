import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconInfoCircle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export const FunctionsInstructionPanel = () => {
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
        <div className="space-y-2 text-xs">
          <p className="text-blue-900">
            Register named functions. Then define their logic in the{" "}
            <strong>Function Definer</strong> panel.
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-800">
            <li>
              <code className="bg-blue-100 px-1 rounded">fn1, fn2</code> —
              create multiple
            </li>
            <li>
              <code className="bg-blue-100 px-1 rounded">f(1-3)</code>
              {" → "}
              <code className="bg-blue-100 px-1 rounded">f1, f2, f3</code>
            </li>
            <li>
              <kbd className="bg-blue-100 px-1 rounded">Alt/Cmd/Ctrl+3</kbd>{" "}
              focus · <kbd className="bg-blue-100 px-1 rounded">Enter</kbd>{" "}
              submit
            </li>
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};
