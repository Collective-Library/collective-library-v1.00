export function isValidEmail(value: string) {
  if (!value || value.includes(" ")) return false;
  const atIndex = value.indexOf("@");
  if (atIndex <= 0 || atIndex !== value.lastIndexOf("@")) return false;
  const domain = value.slice(atIndex + 1);
  if (!domain || !domain.includes(".") || domain.startsWith(".") || domain.endsWith("."))
    return false;
  return true;
}
