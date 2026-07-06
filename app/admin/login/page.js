import { login } from "./actions";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const hasError = params?.error === "1";

  return (
    <div className="min-h-screen bg-[#1c1917] text-[#f5f0e8] font-sans flex items-center justify-center px-4">
      <form
        action={login}
        className="w-full max-w-sm border border-[#3a3532] bg-[#26221f] rounded-lg p-6"
      >
        <h1 className="text-lg font-semibold mb-1">Admin sign in</h1>
        <p className="text-sm text-[#a8a29e] mb-5">Enter the admin password to continue.</p>
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="Password"
          className="w-full bg-transparent border border-[#3a3532] rounded-md px-4 py-2.5 mb-3 outline-none focus:border-[#c98a4b] placeholder-[#6b6560]"
        />
        {hasError && <p className="text-xs text-red-400 mb-3">Incorrect password.</p>}
        <button
          type="submit"
          className="w-full bg-[#c98a4b] text-[#1c1917] font-medium py-2.5 rounded-md hover:opacity-90 transition-opacity"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
