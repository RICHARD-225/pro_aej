import { api } from './api';

export async function getReferentiels() {
  return (await api('/referentiels')).data;
}
