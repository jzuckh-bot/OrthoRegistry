import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="grid min-h-[70vh] place-items-center p-6 text-center"><div><p className="text-sm font-semibold text-primary">404</p><h1 className="mt-2 text-3xl font-bold">Record not found</h1><p className="mt-2 text-muted">This patient may have been removed.</p><Link href="/patients"><Button className="mt-6">Back to patients</Button></Link></div></main>;
}
