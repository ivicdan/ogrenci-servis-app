const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generateId(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

export async function generateUniqueFirmCode(
  checkFn: (code: string) => Promise<boolean>
): Promise<string> {
  let code: string;
  do {
    code = generateId(6);
  } while (await checkFn(code));
  return code;
}

export async function generateUniqueDriverCode(
  checkFn: (code: string) => Promise<boolean>
): Promise<string> {
  let code: string;
  do {
    code = generateId(7);
  } while (await checkFn(code));
  return code;
}
