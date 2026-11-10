import { getTenant } from "@/lib/tenant";
import { notFound } from "next/navigation";
import SitioNav from "./SitioNav";
import { SimboloTlachtli } from "@/app/components/LogoTlachtli";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant();
  if (!tenant) {
    console.log("TENANT NOT FOUND - slug buscado desde header");
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SitioNav nombre={tenant.name} logo={tenant.logo} flyer={tenant.published} />
      <main className="mx-auto max-w-5xl px-4 pb-10 pt-6 md:pt-8">{children}</main>
      {/* La liga es la protagonista; la plataforma firma abajo, en chiquito */}
      <footer className="mx-auto flex max-w-5xl items-center justify-center gap-1.5 px-4 pb-12 text-xs text-gray-500">
        Resultados publicados con
        <a href="https://marcagol.site" className="inline-flex items-center gap-1 font-bold text-gray-400 hover:text-white">
          <SimboloTlachtli className="h-3.5 w-auto" />
          Tlachtli
        </a>
      </footer>
    </div>
  );
}
