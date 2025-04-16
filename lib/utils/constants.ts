import { decode as atob } from "base-64";
interface DecodedToken {
  exp?: number;
  iat?: number;
  id?: number;
  role?: string;
}

export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Token decoding error:", error);
    return {};
  }
};

export const getTokenExpiryInDays = (token: string): number => {
  const decoded = decodeToken(token);
  if (!decoded.exp) return 1;
  const expiryDate = new Date(decoded.exp * 1000);
  const currentDate = new Date();
  const diff = expiryDate.getTime() - currentDate.getTime();
  return Math.max(diff / (1000 * 3600 * 24), 0);
};

interface PasswordRules {
  password_min_length: number;
}

export const generatePassword = (rules: PasswordRules): string => {
  const length = Math.max(rules.password_min_length, 8); // minimum 8 characters even if setting is lower
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  let password = "";
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  // Fill the rest randomly
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};
export const validatePassword = (
  password: string,
  rules: PasswordRules
): boolean => {
  if (password.length < rules.password_min_length) return false;
  // // Check for at least one uppercase letter
  // if (!/[A-Z]/.test(password)) return false;
  // // Check for at least one lowercase letter
  // if (!/[a-z]/.test(password)) return false;
  // // Check for at least one number
  // if (!/[0-9]/.test(password)) return false;
  // // Check for at least one special character
  // if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) return false;
  return true;
};
export const removeUnderscoreAndCapatalizeFirstLetter = (input: string) =>
  input
    .replace(/_/g, " ") // Remove underscores
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
export const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};
export const getFormattedDate = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0"); // Ensure 2 digits
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
};
// Helper function to format seconds into a readable format
export function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
