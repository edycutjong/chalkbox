import { redirect } from "next/navigation";

// The Create surface lives on `/` (landing hero + prompt box). Alias for clarity.
export default function CreatePage() {
  redirect("/");
}
