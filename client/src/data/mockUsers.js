import { INITIAL_USERS } from '../../../server/src/seedData.js';

export const mockUsers = INITIAL_USERS;
export const mockCurrentUser = mockUsers[0];
export const mockConseillers = mockUsers.filter(({ role }) => role === 'CONSEILLER');
