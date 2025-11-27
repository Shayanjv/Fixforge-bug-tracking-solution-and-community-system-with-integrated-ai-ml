export function isNonEmptyString(s) {
  return typeof s === "string" && s.trim().length > 0;
}

export function isLikelyCode(s) {
  if (!isNonEmptyString(s)) return false;
  return /function|class|import|const|let|var|=>/.test(s) || s.split("\n").length > 3;
}
