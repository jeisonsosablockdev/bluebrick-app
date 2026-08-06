import { redirect } from 'next/navigation';

export default async function LegacyProtectedCatchAllRedirectPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = await params;
  const subpath = resolvedParams.slug ? resolvedParams.slug.join('/') : '';
  redirect(subpath ? `/profile/${subpath}` : '/profile');
}
