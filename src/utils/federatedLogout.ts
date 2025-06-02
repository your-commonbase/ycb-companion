import { signOut } from 'auth';

export default async function federatedLogout() {
  try {
    const response = await fetch('/api/federated-logout');
    const data = await response.json();
    if (response.ok) {
      await signOut();
      window.location.href = data.url;
      return;
    }
    throw new Error(data.error);
  } catch (error) {
    // alert(error);
    // await signOut();
    // window.location.href = "/";
  }
}
