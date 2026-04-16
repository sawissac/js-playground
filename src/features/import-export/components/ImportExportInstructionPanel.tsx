import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconInfoCircle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export const ImportExportInstructionPanel = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5",
            "w-full",
            "text-left text-blue-700",
            "font-medium text-xs",
            "rounded-md border border-blue-200 bg-blue-50 p-2",
            "transition-all duration-200",
            "hover:shadow-sm hover:text-blue-800",
          )}
        >
          <IconInfoCircle size={13} />
          What can I do here?
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-2 text-xs">
          <p className="text-blue-900">
            Save and load your workspace state. Export includes all variables,
            functions, and runner steps.
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-800">
            <li>
              <strong>Export:</strong> Download workspace as JSON file
            </li>
            <li>
              <strong>Import:</strong> Load workspace from JSON file
            </li>
            <li>
              <strong>Reset:</strong> Clear all data (cannot be undone)
            </li>
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};
