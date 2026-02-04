import { redirect } from "next/navigation";
import { fetchCurrentNFLWeek } from "@/lib/nflDates";
import { buildScoresUrl } from "@/lib/routes";

export default async function Home() {
  const weekInfo = await fetchCurrentNFLWeek();
  redirect(buildScoresUrl(weekInfo.season, weekInfo.route));
}
