import { FunctionActionInterface } from "@/state/types";

export function fnRunner(payload: any, actions: FunctionActionInterface[]) {
  try {
    let temp: any = payload;

    for (const action of actions) {
      const { name, value } = action;
      if (typeof (temp as any)[name] === "function") {
        const parsedValue = value.map((v: string) => {
          if (v === "@this") {
            return temp;
          }
          if (v === "@space") {
            return " ";
          }
          if (v === "@comma") {
            return ",";
          }
          if (v === "@empty") {
            return "";
          }
          return v.trim();
        });
        temp = (temp as any)[name](...parsedValue);
      } else {
        temp = (temp as any)[name];
      }
    }

    return temp;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
