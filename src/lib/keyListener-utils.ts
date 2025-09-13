'use client';

export function listenToKeys(
  callback: (event: KeyboardEvent) => void,
  target: any = window
): () => void {
  const handler = (event: Event) => {
    callback(event as KeyboardEvent);
  };

  target.addEventListener("keydown", handler);

  // return a cleanup function
  return () => {
    target.removeEventListener("keydown", handler);
  };
}