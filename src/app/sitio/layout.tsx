import { getTenant } from "@/lib/tenant";
import { notFound } from "next/navigation";
import SitioNav from "./SitioNav";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant();
  if (!tenant) {
    console.log("TENANT NOT FOUND - slug buscado desde header");
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SitioNav nombre={tenant.name} logo={tenant.logo} />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 md:pt-8">{children}</main>
    </div>
  );
}
