import { api, clearAccessToken } from './api';

export async function getUsers() {
  return (await api('/users')).data;
}

export async function getLoginHistory() {
  return (await api('/users/logins')).data;
}

export async function createUser({ nom, prenoms, email, password = '', role = 'CONSEILLER', titre = '' }) {
  return api('/users', {
    method: 'POST',
    body: JSON.stringify({ nom, prenoms, email, password, role, titre })
  });
}

export async function initiateLogin(email, password) {
  return api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function verifyOtpLogin(email, otp) {
  const result = await api('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp })
  });
  return result.user;
}

export async function resendOtp(email) {
  return api('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function changePassword(currentPassword, newPassword) {
  return (await api('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) })).user;
}

export async function updateUserStatus(id, actif) {
  return api(`/users/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ actif }) });
}

export async function resetUserPassword(id, newPassword) {
  return api(`/users/${encodeURIComponent(id)}/password`, { method: 'PATCH', body: JSON.stringify({ newPassword }) });
}

export async function login(email, password) {
  const init = await initiateLogin(email, password);
  if (init.requireOtp) {
    return init;
  }
  return init.user;
}

export async function getCurrentUser() {
  return (await api('/auth/me')).user;
}

export async function logout() {
  await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
  clearAccessToken();
}
