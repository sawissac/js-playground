import { FunctionAction } from "@/state/types";

export function stringFnRunner(payload: any, actions: FunctionAction[]) {
    let result: any = payload;
    for (const action of actions) {
        const { name, value } = action;
        if (typeof (result as any)[name] === "function") {
            result = (result as any)[name](...value);
        } else {
            throw new Error(`Method ${name} is not a function on ${typeof result}`);
        }
    }
    return result;
}