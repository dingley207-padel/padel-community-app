export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const isExpired = (expiresAt: Date): boolean => {
  return new Date() > new Date(expiresAt);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  // E.164 format validation (international phone number)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const formatPhoneForWhatsApp = (phone: string): string => {
  // Ensure phone is in E.164 format
  if (!phone.startsWith('+')) {
    return `+${phone}`;
  }
  return phone;
};
