"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StringFunctions } from "@/constants/string";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  addFunctionAction,
  removeFunctionAction,
} from "@/state/slices/editorSlice";
import {
  IconCircleDashedPlus,
  IconEyeMinus,
  IconEyePlus,
  IconFileTypography,
  IconFunction,
} from "@tabler/icons-react";
import React, { useMemo } from "react";

const FunctionActionInput = (payload: {
  functionName: string;
  actionDataType: string;
  actionName: string;
  actionIndex: number;
}) => {
  const dispatch = useAppDispatch();
  const dataTypes = useAppSelector((state) => state.editor.dataTypes);
  const functions = useAppSelector((state) => state.editor.functions);
  const [dataType, setDataType] = React.useState("");
  const [functionAction, setFunctionAction] = React.useState("");

  const funcList = useMemo(() => {
    const createdFunctions = functions.map((fn) => [fn.name, 0]);
    let typedFunctions = null;

    switch (dataType) {
      case "string":
        typedFunctions = StringFunctions;
        break;
      case "array":
        typedFunctions = [];
        break;
      case "boolean":
        typedFunctions = [];
        break;
      default:
        typedFunctions = [];
    }

    const combined = [...typedFunctions, ...createdFunctions];

    return combined.map((fn) => ({ name: fn[0], params: fn[1] }));
  }, [functions, dataType]);

  const paramsCount = useMemo(() => {
    return funcList.find((fn) => fn.name === functionAction)?.params ?? 0;
  }, [funcList, functionAction]);

  const handleRemove = () => {
    dispatch(
      removeFunctionAction({
        functionName: payload.functionName,
        actionIndex: payload.actionIndex,
      })
    );
  };

  return (
    <div className="flex items-center gap-2 my-2">
      <IconFileTypography size={16} className="shrink-0" />
      <Select
        defaultValue={payload.actionDataType}
        value={dataType}
        onValueChange={(value) => setDataType(value)}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="DT" />
        </SelectTrigger>
        <SelectContent>
          {dataTypes.map((dt, index) => (
            <SelectItem key={index} value={dt}>
              {dt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <IconFunction className="shrink-0" size={16} />
      <Select
        defaultValue={payload.actionName}
        value={functionAction}
        onValueChange={(value) => setFunctionAction(value)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Fn" />
        </SelectTrigger>
        <SelectContent className="h-60">
          {funcList.map((fn, index) => (
            <SelectItem key={index} value={fn.name}>
              {fn.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {paramsCount === 0 ? null : (
        <Input
          className="flex-1"
          placeholder={
            paramsCount === "n"
              ? "...args"
              : Array.from({ length: paramsCount })
                  .map((_, i) => `arg${i + 1}`)
                  .join(", ")
          }
        />
      )}

      <Button variant="destructive" size="icon" onClick={handleRemove}>
        <IconCircleDashedPlus size={16} className="rotate-45" />
      </Button>
    </div>
  );
};

const FunctionDefiner = () => {
  const dispatch = useAppDispatch();
  const functions = useAppSelector((state) => state.editor.functions);
  const [showDetail, setShowDetail] = React.useState(true);

  const handleShowDetail = () => {
    setShowDetail(!showDetail);
  };

  const handleActionCreate = (functionName: string) => {
    dispatch(
      addFunctionAction({
        functionName,
        action: { name: "", dataType: "", value: [] },
      })
    );
  };

  return (
    <>
      {functions.map((func, index) => (
        <div
          key={index}
          className="w-full p-2 shadow-md shadow-slate-200 rounded-md space-y-2"
        >
          <div className="flex flex-row gap-2">
            <Badge variant="secondary">{func.name}</Badge>
            <Badge variant="outline">{func.actions.length}</Badge>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              variant={"outline"}
              onClick={() => handleActionCreate(func.name)}
              className="flex-1"
            >
              <IconCircleDashedPlus size={16} />
            </Button>

            <Button onClick={handleShowDetail} size="icon">
              {showDetail ? (
                <IconEyeMinus size={16} />
              ) : (
                <IconEyePlus size={16} />
              )}
            </Button>
          </div>

          <div className={showDetail ? "block" : "hidden"}>
            {func.actions.map((action, actionIndex) => (
              <FunctionActionInput
                key={actionIndex}
                functionName={func.name}
                actionDataType={action.dataType}
                actionName={action.name}
                actionIndex={actionIndex}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
};

export default FunctionDefiner;
