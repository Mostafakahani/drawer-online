import { CreateRoom } from "@/components/room/create-room";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <CreateRoom />
    </main>
  );
}
