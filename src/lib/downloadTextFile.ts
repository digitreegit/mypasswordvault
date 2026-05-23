/** Trigger a browser download of plain text (e.g. recovery codes). */
export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content.endsWith("\n") ? content : `${content}\n`], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
