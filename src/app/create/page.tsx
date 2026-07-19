import { redirect } from "next/navigation";

// The Create surface lives on `/` (landing hero + prompt box). Land on the
// prompt box itself, not the top of the page.
export default function CreatePage() {
  redirect("/#create");
}
