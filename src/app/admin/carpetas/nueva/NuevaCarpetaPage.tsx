"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function NuevaCarpetaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const organizationId = searchParams.get("organizationId");

  return (
    <div>
      <h1>Nueva carpeta</h1>

      <p>Organización: {organizationId}</p>

      <button onClick={() => router.push("/admin")}>
        Volver
      </button>
    </div>
  );
}