import AuthPageClient from '@/components/auth/auth-page-client';

type SignInPageProps = {
  searchParams?: {
    tab?: string;
  };
};

export default function SignInPage({ searchParams }: SignInPageProps) {
  const initialTab = searchParams?.tab === 'signup' ? 'signup' : 'signin';
  return <AuthPageClient initialTab={initialTab} />;
}
