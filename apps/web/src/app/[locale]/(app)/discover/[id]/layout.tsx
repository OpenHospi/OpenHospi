import { SetBreadcrumb } from "@/components/app/breadcrumb-store";
import { getRoomMetadata } from "@/lib/queries/discover";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export default async function RoomDetailLayout({ params, children }: Props) {
  const { id } = await params;
  const room = await getRoomMetadata(id);

  return (
    <>
      {room?.title && <SetBreadcrumb uuid={id} label={room.title} />}
      {children}
    </>
  );
}
