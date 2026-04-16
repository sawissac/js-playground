import React from "react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { addFunctionAction, reorderFunctionActions } from "@/state/slices/editorSlice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpModal } from "@/features/help-modal";
import { IconCircleDashedPlus, IconEyeMinus, IconEyePlus } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionControls, InstructionPanels } from "./components"; // Let's just import specifically
import { FunctionActionInput } from "./components/ActionControls";
import { InstructionPanel } from "./components/InstructionPanels";


const FunctionDefiner = ({ filterFunctionId }: { filterFunctionId?: string } = {}) => {
  const dispatch = useAppDispatch();
  const allFunctions = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .functions,
  );
  // When filterFunctionId is provided, show only that function
  const functions = filterFunctionId
    ? allFunctions.filter((f) => f.id === filterFunctionId)
    : allFunctions;

  // Auto-expand when a filterFunctionId is given
  const [showDetails, setShowDetails] = React.useState<Record<string, boolean>>(
    filterFunctionId ? { [filterFunctionId]: true } : {},
  );
  const isShown = (id: string) =>
    filterFunctionId ? true : showDetails[id] === true;
  const toggleDetail = (id: string) =>
    setShowDetails((prev) => ({ ...prev, [id]: !isShown(id) }));
  const [dragState, setDragState] = React.useState<{
    functionId: string | null;
    dragIndex: number | null;
    dragOverIndex: number | null;
  }>({ functionId: null, dragIndex: null, dragOverIndex: null });

  const handleDragStart = (functionId: string, index: number) => {
    setDragState({ functionId, dragIndex: index, dragOverIndex: null });
  };

  const handleDragOver = (
    e: React.DragEvent,
    functionId: string,
    index: number,
  ) => {
    e.preventDefault();
    if (dragState.functionId === functionId && dragState.dragIndex !== index) {
      setDragState((prev) => ({ ...prev, dragOverIndex: index }));
    }
  };

  const handleDragEnd = () => {
    setDragState({ functionId: null, dragIndex: null, dragOverIndex: null });
  };

  const handleDrop = (functionId: string, toIndex: number) => {
    if (
      dragState.functionId === functionId &&
      dragState.dragIndex !== null &&
      dragState.dragIndex !== toIndex
    ) {
      dispatch(
        reorderFunctionActions({
          functionId,
          fromIndex: dragState.dragIndex,
          toIndex,
        }),
      );
    }
    setDragState({ functionId: null, dragIndex: null, dragOverIndex: null });
  };

  return (
    <div className={filterFunctionId ? "space-y-2" : "space-y-2 pb-[300px]"}>
      {!filterFunctionId && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <InstructionPanel />
          </div>
          <div className="shrink-0 flex items-center justify-center p-1 border rounded-md bg-white border-slate-200">
            <HelpModal />
          </div>
        </div>
      )}

      {functions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md">
          No functions yet — create some in the <strong>Functions panel</strong>
          .
        </p>
      ) : (
        functions.map((func) => (
          <div
            key={func.id}
            className="w-full p-2 shadow-md shadow-slate-200 rounded-md space-y-1.5"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">fn</span>
                <Badge variant="secondary" className="font-mono text-xs py-0">
                  {func.name}
                </Badge>
                <Badge variant="outline" className="text-xs py-0 ml-auto">
                  {func.actions.length}
                </Badge>
                <Button
                  onClick={() => toggleDetail(func.id)}
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-6 w-6 transition-all duration-200",
                    "hover:bg-slate-100 active:scale-95",
                  )}
                >
                  {isShown(func.id) ? (
                    <IconEyeMinus size={13} />
                  ) : (
                    <IconEyePlus size={13} />
                  )}
                </Button>
              </div>

              <Select
                onValueChange={(actionType) => {
                  const actionMap: Record<string, { name: string }> = {
                    add: { name: "" },
                    if: { name: "if" },
                    when: { name: "when" },
                    loop: { name: "loop" },
                    code: { name: "code" },
                  };
                  const action = actionMap[actionType];
                  if (action) {
                    dispatch(
                      addFunctionAction({
                        functionId: func.id,
                        action: { id: "", ...action, dataType: "", value: [] },
                      }),
                    );
                  }
                }}
              >
                <SelectTrigger className="h-7 text-xs w-32 gap-1.5">
                  <IconCircleDashedPlus size={13} className="shrink-0" />
                  <SelectValue placeholder="Add Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add" className="text-xs">
                    <div className="flex items-center gap-2">
                      <IconCircleDashedPlus size={13} />
                      Add
                    </div>
                  </SelectItem>
                  <SelectItem value="if" className="text-xs">
                    <div className="flex items-center gap-2">
                      <IconCircleDashedPlus
                        size={13}
                        className="text-rose-600"
                      />
                      If
                    </div>
                  </SelectItem>
                  <SelectItem value="when" className="text-xs">
                    <div className="flex items-center gap-2">
                      <IconCircleDashedPlus
                        size={13}
                        className="text-purple-600"
                      />
                      When
                    </div>
                  </SelectItem>
                  <SelectItem value="loop" className="text-xs">
                    <div className="flex items-center gap-2">
                      <IconCircleDashedPlus
                        size={13}
                        className="text-blue-600"
                      />
                      Loop
                    </div>
                  </SelectItem>
                  <SelectItem value="code" className="text-xs">
                    <div className="flex items-center gap-2">
                      <IconCircleDashedPlus
                        size={13}
                        className="text-teal-600"
                      />
                      Code
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={isShown(func.id) ? "block" : "hidden"}>
              {func.actions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2 border border-dashed rounded">
                  No actions — click Add to start.
                </p>
              ) : (
                func.actions.map((action, actionIndex) => (
                  <FunctionActionInput
                    key={action.id}
                    functionId={func.id}
                    actionId={action.id}
                    actionDataType={action.dataType}
                    actionName={action.name}
                    actionIndex={actionIndex}
                    onDragStart={(index) => handleDragStart(func.id, index)}
                    onDragOver={(e, index) => handleDragOver(e, func.id, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={(index) => handleDrop(func.id, index)}
                    isDragging={
                      dragState.functionId === func.id &&
                      dragState.dragIndex === actionIndex
                    }
                    isDragOver={
                      dragState.functionId === func.id &&
                      dragState.dragOverIndex === actionIndex
                    }
                  />
                ))
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FunctionDefiner;
