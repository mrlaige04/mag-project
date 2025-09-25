export function generateExpirationDate(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 4);
  return date;
}
