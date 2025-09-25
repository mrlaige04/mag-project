export function generateCvv(): string {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).join(
    '',
  );
}
