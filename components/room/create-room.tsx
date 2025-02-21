/// components/create-room.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateRoom() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");

  const handleCreateRoom = () => {
    const generatedRoomId = Math.random().toString(36).substring(2, 7);
    router.push(`/room/${generatedRoomId}`);
  };

  const handleJoinRoom = () => {
    if (roomId.length === 5) {
      router.push(`/room/${roomId}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center">اتاق نقاشی</h1>
      <button
        onClick={handleCreateRoom}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        ساخت اتاق جدید
      </button>
      <div className="flex gap-2">
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="کد اتاق را وارد کنید"
          className="px-4 py-2 border rounded"
          maxLength={5}
        />
        <button
          onClick={handleJoinRoom}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          ورود به اتاق
        </button>
      </div>
    </div>
  );
}
