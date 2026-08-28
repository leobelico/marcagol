import { Suspense } from "react";
import NuevaCarpetaPage from "./NuevaCarpetaPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <NuevaCarpetaPage />
    </Suspense>
  );
}