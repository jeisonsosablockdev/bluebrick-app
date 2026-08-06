import { redirect } from 'next/navigation';

export default function LegacyProtectedRedirectPage() {
  redirect('/profile');
}
