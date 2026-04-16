import { useAppSelector } from "@/state/hooks";

export const useCodeSidebarManager = () => {
  const variables = useAppSelector(
    (s) =>
      s.editor.packages.find((p) => p.id === s.editor.activePackageId)!
        .variables,
  );
  const functions = useAppSelector(
    (s) =>
      s.editor.packages.find((p) => p.id === s.editor.activePackageId)!
        .functions,
  );
  const runner = useAppSelector(
    (s) =>
      s.editor.packages.find((p) => p.id === s.editor.activePackageId)!.runner,
  );

  const isEmpty =
    variables.length === 0 && functions.length === 0 && runner.length === 0;

  return { variables, functions, runner, isEmpty };
};
