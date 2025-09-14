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
import { useDebounce } from "@/hooks/useDebounce";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  addFunctionAction,
  removeFunctionAction,
  updateFunctionAction,
} from "@/state/slices/editorSlice";
import {
  IconCircleDashedPlus,
  IconEyeMinus,
  IconEyePlus,
  IconFileTypography,
  IconFunction,
  IconTrash,
} from "@tabler/icons-react";
import React, { useMemo, useCallback, useRef, useEffect } from "react";

const FunctionActionInput = (payload: {
  functionName: string;
  actionDataType: string;
  actionName: string;
  actionIndex: number;
}) => {
  const dispatch = useAppDispatch();
  const dataTypes = useAppSelector((state) => state.editor.dataTypes);
  const functions = useAppSelector((state) => state.editor.functions);
  const [value, setValue] = React.useState("");

  const funcName = React.useMemo(() => {
    return (functions.find((fn) => fn.name === payload.functionName)?.actions[
      payload.actionIndex
    ]?.name ?? "") as string;
  }, [functions, payload.functionName, payload.actionIndex]);

  const funcDataType = React.useMemo(() => {
    return (functions.find((fn) => fn.name === payload.functionName)?.actions[
      payload.actionIndex
    ]?.dataType ?? "") as string;
  }, [functions, payload.functionName, payload.actionIndex]);

  const funcValue = React.useMemo(() => {
    return (functions
      .find((fn) => fn.name === payload.functionName)
      ?.actions[payload.actionIndex]?.value?.join(",") ?? "") as string;
  }, [functions, payload.functionName, payload.actionIndex]);

  const funcList = useMemo(() => {
    const createdFunctions = functions.map((fn) => [fn.name, 0]);
    let typedFunctions = null;

    switch (funcDataType) {
      case "string":
        typedFunctions = StringFunctions;
        break;
      default:
        typedFunctions = [];
    }

    const combined = [...typedFunctions, ...createdFunctions];

    return combined.map((fn) => ({ name: fn[0], params: fn[1] }));
  }, [functions, funcDataType]);

  const paramsCount = useMemo(() => {
    return funcList.find((fn) => fn.name === funcName)?.params ?? 0;
  }, [funcList, funcName]);

  const handleRemove = () => {
    dispatch(
      removeFunctionAction({
        functionName: payload.functionName,
        actionIndex: payload.actionIndex,
      })
    );
  };

  const handleDatatypeImpl = ({
    actionName,
    actionDataType,
    actionValue,
  }: {
    actionName: string;
    actionDataType: string;
    actionValue: string;
  }) => {
    const parseValue = actionValue.split(",").map((v) => v.trim());
    dispatch(
      updateFunctionAction({
        functionName: payload.functionName,
        actionIndex: payload.actionIndex,
        action: {
          name: actionName,
          dataType: actionDataType,
          value: parseValue,
        },
      })
    );
  };

  // Debounced version of handleDatatype
  const handleDatatype = useDebounce(handleDatatypeImpl, 300);

  return (
    <div className="flex items-center gap-2 my-2">
      <IconFileTypography size={16} className="shrink-0" />
      <Select
        defaultValue={payload.actionDataType}
        value={funcDataType}
        onValueChange={(value) =>
          handleDatatype({
            actionName: funcName,
            actionDataType: value,
            actionValue: funcValue,
          })
        }
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
        value={funcName}
        onValueChange={(value) =>
          handleDatatype({
            actionName: value,
            actionDataType: funcDataType,
            actionValue: funcValue,
          })
        }
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
          value={value}
          onChange={(e) => {
            setValue(e.target.value);

            handleDatatype({
              actionName: funcName,
              actionDataType: funcDataType,
              actionValue: e.target.value,
            });
          }}
        />
      )}

      <Button
        variant="destructive"
        size="icon"
        onClick={handleRemove}
        className="ml-auto"
      >
        <IconTrash size={16} className="shrink-0" />
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
