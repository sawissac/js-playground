import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { updateDataType } from "@/state/slices/editorSlice";
import { useState } from "react";

export const useDataTypeManager = () => {
  const dispatch = useAppDispatch();
  const variables = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .variables,
  );
  const dataTypes = useAppSelector((state) => state.editor.dataTypes);
  const [showDetail, setShowDetail] = useState(true);

  const typedCount = variables.filter((v) => v.type).length;
  const totalCount = variables.length;

  const handleChange = (variableId: string, type: string) => {
    dispatch(updateDataType({ id: variableId, type }));
  };

  return {
    variables,
    dataTypes,
    showDetail,
    setShowDetail,
    typedCount,
    totalCount,
    handleChange
  };
};
