const USER_NAME_KEY_PREFIX = 'household_chores_user_name_';

export const getUserName = (houseCode: string): string | null => {
  return localStorage.getItem(`${USER_NAME_KEY_PREFIX}${houseCode}`);
};

export const setUserName = (houseCode: string, name: string): void => {
  localStorage.setItem(`${USER_NAME_KEY_PREFIX}${houseCode}`, name);
};

