"use client";

import { useEffect, useState } from "react";

type QueueItem = {
  queue: string;
  timestamp: string;
  status: "empty" | "attend" | "absent";
};

export default function QueueUI({ initialQueue }: { initialQueue: string }) {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [currentQueue, setCurrentQueue] = useState<string>(initialQueue);
  const [day, setDay] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    async function fetchQueues() {
      try {
        const res = await fetch("/api/queue");
        const data: { queues: QueueItem[] } = await res.json();
        console.log(data);
        setQueues(data.queues);

        // Keep currentQueue if exists, otherwise first queue
        setCurrentQueue((prev) => {
          if (data.queues.some((q) => q.queue === prev)) return prev;
          return data.queues[1]?.queue || "";
        });
      } catch (err) {
        console.error("Failed to fetch queues:", err);
      }
    }

    fetchQueues();
    const interval = setInterval(fetchQueues, 5000);
    return () => clearInterval(interval);
  }, []);

  // Clock display
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setDay(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "Asia/Seoul",
        })
      );
      setDate(
        now.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "Asia/Seoul",
        })
      );
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Seoul",
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleAction(action: "Attend" | "Absent" | "New") {
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, currentQueue }),
      });
      const data: { newQueue?: string; currentQueue?: string } =
        await res.json();

      if (action === "New" && data.newQueue) {
        printTicket(data.newQueue);
      } else if (
        (action === "Attend" || action === "Absent") &&
        data.currentQueue
      ) {
        setCurrentQueue(data.currentQueue);
      }

      // Immediately refresh queues
      const refreshed = await fetch("/api/queue");
      const refreshedData: { queues: QueueItem[] } = await refreshed.json();
      setQueues(refreshedData.queues);
    } catch (err) {
      console.error("Queue action failed:", err);
    }
  }

  function printTicket(queueNum: string) {
    const printWindow = window.open("", "_blank", "width=400,height=200");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <style>
            @page { size: 12cm 5cm; margin: 0; }
            body { width: 12cm; height: 5cm; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: Arial, sans-serif; }
            .queue { font-size: 48px; font-weight: bold; color: #FF5722; }
            .title { font-size: 20px; margin-bottom: 8px; }
            .footer { font-size: 14px; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="title">ISOS - Queue Ticket</div>
          <div class="queue">${queueNum}</div>
          <div class="footer">${new Date().toLocaleString("en-US", {
            timeZone: "Asia/Seoul",
          })}</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  // Safe slice for next queues
  const currentIndex = queues.findIndex((q) => q.queue === currentQueue);
  const nextQueues =
    currentIndex >= 0 ? queues.slice(currentIndex + 1, currentIndex + 10) : [];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-white shadow-sm">
        <div className="text-2xl font-bold text-blue-600">
          ISOS - International SOS
        </div>
        <div className="text-right text-black">
          <div className="text-lg font-semibold">
            {day && date ? `${day}, ${date}` : "Loading..."}
          </div>
          <div className="text-sm">{time}</div>
        </div>
      </div>

      <div className="flex-grow flex p-6 gap-6">
        {/* Current Queue */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white rounded-lg shadow-lg p-8 flex-grow flex flex-col justify-center items-center border-2 border-blue-200">
            <div className="text-lg font-medium text-gray-600 mb-4">
              Sedang Dilayani :
            </div>
            <div className="text-xl font-semibold text-blue-600 mb-2">
              Nomor Antrian
            </div>
            <div className="text-6xl font-bold text-orange-500 border-4 border-orange-500 rounded-lg px-8 py-4 mb-6">
              {currentQueue || "Loading..."}
            </div>
          </div>
        </div>

        {/* Next Queues */}
        <div className="flex-1 flex flex-col gap-4">
          {nextQueues.map((q) => (
            <div
              key={q.queue}
              className="bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-between font-medium text-lg"
            >
              <span>{q.queue}</span>
              <span className="text-sm text-gray-200">{q.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-center items-center p-6 bg-white shadow-sm gap-4">
        <button
          onClick={() => handleAction("Absent")}
          className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-red-700"
        >
          Absent
        </button>
        <button
          onClick={() => handleAction("New")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700"
        >
          Ambil Antrian
        </button>
        <button
          onClick={() => handleAction("Attend")}
          className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-green-700"
        >
          Hadir
        </button>
      </div>
    </div>
  );
}
