import { redirect } from "next/navigation";

// La creación de carpetas vive en /admin/carpetas/nueva
export default function CarpetasPage() {
  redirect("/admin/carpetas/nueva");
}
