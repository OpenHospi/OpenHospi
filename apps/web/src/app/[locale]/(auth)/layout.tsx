import { APP_NAME } from "@openhospi/shared/constants";

import { Link } from "@/i18n/navigation-app";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
      <div className="mb-8">
        <Link href="/" className="text-2xl font-bold">
          {APP_NAME}
        </Link>
      </div>
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
