import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  loadDemoPackage,
  addPackage,
  setActivePackage,
} from "@/state/slices/editorSlice";
import { DEMO_PACKAGES } from "@/lib/demoPackages";
import { v4 as uuidv4 } from "uuid";

export const useStartupPageManager = (onClose: () => void) => {
  const dispatch = useAppDispatch();
  const packages = useAppSelector((state) => state.editor.packages);

  const handleDemoClick = (demoKey: string) => {
    const demoPackage = DEMO_PACKAGES[demoKey];
    if (demoPackage) {
      const newPkg = JSON.parse(JSON.stringify(demoPackage));
      newPkg.id = uuidv4();
      dispatch(loadDemoPackage(newPkg));
      onClose();
    }
  };

  const handleCreatePackage = () => {
    dispatch(addPackage({ name: `Package ${packages.length + 1}` }));
    onClose();
  };

  const handleSelectPackage = (pkgId: string) => {
    dispatch(setActivePackage(pkgId));
    onClose();
  };

  return {
    packages,
    handleDemoClick,
    handleCreatePackage,
    handleSelectPackage,
  };
};
