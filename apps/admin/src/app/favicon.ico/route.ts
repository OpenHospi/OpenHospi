import { redirect } from "next/navigation";

export function GET() {
  redirect("/icon.svg");
}
