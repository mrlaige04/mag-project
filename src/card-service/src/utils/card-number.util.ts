export function generateCardNumber(provider: 'visa' | 'mastercard'): string {
  // BIN/IIN
  let bin = '';
  if (provider === 'visa') {
    bin = '400000'; // або інший реальний BIN банку
  } else if (provider === 'mastercard') {
    bin = Math.random() < 0.5 ? '510000' : '220000'; // 5***** або 2*****
  }

  // 9 випадкових цифр
  const accountIdentifier = Array.from({ length: 9 }, () =>
    Math.floor(Math.random() * 10),
  ).join('');

  // Перші 15 цифр (без контрольної)
  const partial = bin + accountIdentifier;

  // Контрольна цифра (Luhn)
  const checkDigit = getLuhnCheckDigit(partial);

  return partial + checkDigit;
}

function getLuhnCheckDigit(number: string): string {
  let sum = 0;
  let shouldDouble = true;
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}
