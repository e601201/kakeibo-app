/** フォームの欄の文字列。欄がなければ空文字。 */
export function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
