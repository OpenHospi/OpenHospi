import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col justify-center text-center">
      <h1 className="mb-4 text-2xl font-bold">OpenHospi Docs</h1>
      <p>
        <Link href="/docs" className="font-medium underline">
          Ga naar de documentatie →
        </Link>
      </p>
    </div>
  );
}
