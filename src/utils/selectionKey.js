export function getSelectionKey(item) {
  if (item.elevation) {
    return `${item.optionCode}_${item.elevation}`;
  }
  return item.optionCode;
}
