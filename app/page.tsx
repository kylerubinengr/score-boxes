import { redirect } from "next/navigation";
import { fetchCurrentNFLWeek } from "@/lib/nflDates";

export default async function Home() {
  const weekInfo = await fetchCurrentNFLWeek();
  redirect(`/dashboard/${weekInfo.route}`);
}
