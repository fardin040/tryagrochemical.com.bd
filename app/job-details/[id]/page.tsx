import { notFound } from "next/navigation"; import { listJobs } from "../../../lib/db"; import { jobs } from "../../../lib/data"; import ApplicationForm from "../../general-application/ApplicationForm";
export async function generateStaticParams() {
  const availableJobs = await listJobs();
  return (availableJobs.length ? availableJobs : jobs).map((job) => ({ id: String(job.id) }));
}
export const dynamicParams = false;
export default async function JobDetails({params}:{params:Promise<{id:string}>}) { const {id}=await params; const job=(await listJobs()).find(j=>j.id===Number(id)); if(!job) notFound(); return <main><section><div style={{maxWidth:800,margin:"0 auto"}}><a href="/careers">← Back to Jobs</a><div className="feature-card"><h1>{job.title}</h1><p><strong>Location:</strong> {job.location} | <strong>Deadline:</strong> {job.deadline}</p><hr/><div className="job-description">{job.description}</div></div><div className="contact-form"><h3>Apply for this Position</h3><ApplicationForm jobId={job.id}/></div></div></section></main>; }
