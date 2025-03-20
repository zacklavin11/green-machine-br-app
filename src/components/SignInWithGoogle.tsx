"use client";

import { useAuth } from '../lib/hooks/useAuth';

export default function SignInWithGoogle() {
  const { signInWithGoogle } = useAuth();

  return (
    <button
      onClick={signInWithGoogle}
      className="flex items-center justify-center bg-white text-[var(--apple-gray-900)] font-semibold py-2 px-4 rounded-full border border-[var(--apple-gray-200)] hover:bg-[var(--apple-gray-50)] transition duration-300 ease-in-out shadow-sm"
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-6 h-6 mr-2" />
      Sign in with Google
    </button>
  );
}
