import dynamic from 'next/dynamic';

const SignupPageClient = dynamic(
  () => import('../../../design/components/auth/SignupPageClient'),
  { ssr: false }
);

export default function SignupPage() {
  return <SignupPageClient />;
}
