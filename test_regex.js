const codeStr = `
const container = document.getElementById(@renderer);
container.innerHTML = "Inline UI Loaded";
return "Inline UI Loaded";
`;

let code = codeStr.replace(/@(\w+(?:\([^)]*\))?(?:\.\w+)*)/g, (_match, token) => {
  const dotIdx = token.indexOf(".");
  if (dotIdx === -1) return `__ctx__["${token}"]`;
  const base = token.slice(0, dotIndex);
  const rest = token.slice(dotIdx);
  return `__ctx__["${base}"]${rest}`;
});

console.log(code);
