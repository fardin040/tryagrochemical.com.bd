import { getPage } from "../../lib/db";
export const dynamic = "force-dynamic";
export default async function About(){const page = await getPage("about"); return <main><section dangerouslySetInnerHTML={{__html: page?.content ?? ""}} /></main>}
