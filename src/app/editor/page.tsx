"use client";

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
import RunnerDefiner from "@/features/runner-definer";
import LogContainer from "@/features/log-container";
import { cn } from "@/lib/utils";

const Page = () => {
  return (
    <>
      {/* Desktop Layout (lg and up) */}
      <div className={cn("hidden lg:block w-full h-screen")}>
        <ResizablePanelGroup direction="horizontal" className="w-full h-full">
          <ResizablePanel defaultSize={25} minSize={20}>
            <div
              className={cn(
                "flex flex-col gap-3 p-3 h-full overflow-y-auto",
                "animate-in fade-in slide-in-from-left-4 duration-300",
              )}
            >
              <Badge variant="default" className="w-fit text-xs">
                Variables
              </Badge>
              <VariableContainer />
              <hr className="border-border" />
              <DataTypeContainer />
              <hr className="border-border" />
              <FunctionsContainer />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={35} minSize={30}>
            <div
              className={cn(
                "flex flex-col gap-3 p-3 h-full overflow-y-auto",
                "animate-in fade-in duration-300 delay-75",
              )}
            >
              <Badge variant="default" className="w-fit text-xs">
                Function Actions
              </Badge>
              <FunctionDefiner />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40} minSize={30}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={55} minSize={40}>
                <div
                  className={cn(
                    "flex flex-col gap-3 p-3 h-full overflow-y-auto",
                    "animate-in fade-in slide-in-from-right-4 duration-300 delay-150",
                  )}
                >
                  <Badge variant="default" className="w-fit text-xs">
                    Runner Flow
                  </Badge>
                  <RunnerDefiner />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={45} minSize={25}>
                <div
                  className={cn(
                    "p-3 h-full overflow-y-auto bg-slate-800 relative",
                    "animate-in fade-in slide-in-from-bottom-4 duration-300 delay-200",
                  )}
                >
                  <LogContainer />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Tablet Layout (md to lg) */}
      <div
        className={cn(
          "hidden md:block lg:hidden w-full h-screen overflow-y-auto",
        )}
      >
        <div className="grid grid-cols-2 gap-3 p-3">
          <div
            className={cn(
              "flex flex-col gap-3",
              "animate-in fade-in slide-in-from-left-4 duration-300",
            )}
          >
            <Badge variant="default" className="w-fit text-xs">
              Variables
            </Badge>
            <VariableContainer />
            <hr className="border-border" />
            <DataTypeContainer />
            <hr className="border-border" />
            <FunctionsContainer />
          </div>
          <div
            className={cn(
              "flex flex-col gap-3",
              "animate-in fade-in slide-in-from-right-4 duration-300 delay-75",
            )}
          >
            <Badge variant="default" className="w-fit text-xs">
              Function Actions
            </Badge>
            <FunctionDefiner />
          </div>
          <div
            className={cn(
              "flex flex-col gap-3",
              "animate-in fade-in slide-in-from-left-4 duration-300 delay-150",
            )}
          >
            <Badge variant="default" className="w-fit text-xs">
              Runner Flow
            </Badge>
            <RunnerDefiner />
          </div>
          <div
            className={cn(
              "flex flex-col gap-3 bg-slate-800 p-3 rounded-lg min-h-[300px]",
              "animate-in fade-in slide-in-from-right-4 duration-300 delay-200",
            )}
          >
            <LogContainer />
          </div>
        </div>
      </div>

      {/* Mobile Layout (below md) */}
      <div className={cn("block md:hidden w-full h-screen overflow-y-auto")}>
        <div className="flex flex-col gap-3 p-3">
          <div
            className={cn(
              "flex flex-col gap-3",
              "animate-in fade-in slide-in-from-top-4 duration-300",
            )}
          >
            <Badge variant="default" className="w-fit text-xs">
              Variables
            </Badge>
            <VariableContainer />
          </div>
          <hr className="border-border" />
          <div
            className={cn(
              "flex flex-col gap-3",
              "animate-in fade-in duration-300 delay-75",
            )}
          >
            <DataTypeContainer />
          </div>
          <hr className="border-border" />
          <div
            className={cn(
              "flex flex-col gap-3",
              "animate-in fade-in duration-300 delay-100",
            )}
          >
            <FunctionsContainer />
          </div>
          <hr className="border-border" />
          <div
            className={cn(
              "flex flex-col gap-3",
              "animate-in fade-in duration-300 delay-150",
            )}
          >
            <Badge variant="default" className="w-fit text-xs">
              Function Actions
            </Badge>
            <FunctionDefiner />
          </div>
          <hr className="border-border" />
          <div
            className={cn(
              "flex flex-col gap-3",
              "animate-in fade-in duration-300 delay-200",
            )}
          >
            <Badge variant="default" className="w-fit text-xs">
              Runner Flow
            </Badge>
            <RunnerDefiner />
          </div>
          <hr className="border-border" />
          <div
            className={cn(
              "flex flex-col gap-3 bg-slate-800 p-3 rounded-lg min-h-[300px]",
              "animate-in fade-in slide-in-from-bottom-4 duration-300 delay-250",
            )}
          >
            <LogContainer />
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
