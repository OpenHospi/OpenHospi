export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-lg flex-col items-center">{children}</div>
    </div>
  );
}
