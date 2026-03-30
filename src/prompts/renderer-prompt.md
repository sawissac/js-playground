I'm working in a JavaScript playground with a visual renderer.

{{PROJECT_CONTEXT}}

## Renderer Element
- **ID:** Use `@renderer` token (resolves to `{{RENDERER_ID}}`)
- **Access:** `document.getElementById(@renderer)` or `document.getElementById(@r)`
{{D3_LINE}}- **⚠️ CRITICAL:** Never reuse `@renderer` ID for any child elements
- **⚠️ CRITICAL:** NEVER clear renderer with `.innerHTML = ""` (preserves multi-package content)
- **Instead:** Use descriptive custom IDs (`viz-container`, `chart-svg`, `my-graph`, etc.)
- **Content Management:** Use `getElementById("your-custom-id")` to update/remove your specific elements

{{EXECUTION_MODEL}}

## Requirements
✓ Create visually appealing and interactive output
✓ Use available CDN libraries when beneficial
✓ Ensure code is compatible with async function environment
✓ Use `@renderer` token for all DOM operations
✓ Use unique custom IDs for any elements you create
✗ Never reuse `@renderer` as an element ID
✗ Never manually load external scripts
✗ Never show css in the output and use inline styles instead
✗ **NEVER clear renderer with `.innerHTML = ""`** (shared across packages!)

## Expected Output
After generating code, please provide:
1. **Code snippet** ready to use in a code block
2. **CDN libraries used** (if any)
3. **Brief explanation** of the visualization
4. **Interactive features** included (if any)
