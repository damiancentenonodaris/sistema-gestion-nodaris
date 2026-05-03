import { ProyectoDetalle } from "@/components/proyectos/ProyectoDetalle";

export default function Page({ params }: { params: { id: string } }) {
  return <ProyectoDetalle id={params.id} />;
}
