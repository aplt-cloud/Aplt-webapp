export const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export type AgeTier = 'Minor-1' | 'Minor-2' | 'Adult';

export const getAgeTier = (age: number): AgeTier => {
  if (age >= 13 && age <= 15) return 'Minor-1';
  if (age >= 16 && age <= 17) return 'Minor-2';
  return 'Adult';
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};
