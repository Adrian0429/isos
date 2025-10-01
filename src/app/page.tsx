"use client";

import { useEffect, useState } from "react";

type QueueItem = {
  queue: string;
  timestamp: string;
  status: "empty" | "attend" | "absent";
};

export default function QueueUI() {
  const [currentQueue, setCurrentQueue] = useState<string>("");
  const [day, setDay] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Fetch the latest queue
  const fetchLatestQueue = async () => {
    try {
      const res = await fetch("/api/queue");
      const data: { queues: QueueItem[] } = await res.json();
      if (data.queues.length > 0) {
        const lastQueue = data.queues[data.queues.length - 1].queue;
        setCurrentQueue(lastQueue);
      }
    } catch (err) {
      console.error("Failed to fetch latest queue:", err);
    }
  };

  useEffect(() => {
    fetchLatestQueue();
    const interval = setInterval(fetchLatestQueue, 5000); // refresh every 5s
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

  async function handleAction() {
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "New" }),
      });
      const data: { newQueue?: string } = await res.json();
      if (data.newQueue) {
        printTicket(data.newQueue);
        setCurrentQueue(data.newQueue);
      }
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

      {/* Current Queue */}
      <div className="flex-grow flex p-6 justify-center items-center">
        <div className="bg-white rounded-lg shadow-lg p-12 w-[60%] h-[75%] flex flex-col justify-center items-center border-2 border-blue-200">
          <div className="text-2xl font-medium text-gray-600 mb-4">
            Sedang Dilayani :
          </div>
          <div className="text-4xl font-semibold text-blue-600 mb-2">
            Nomor Antrian
          </div>
          <div className="text-8xl font-bold mt-5 text-orange-500 border-4 border-orange-500 rounded-lg px-8 py-4">
            {currentQueue || "Loading..."}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-center items-center p-6 bg-white shadow-sm gap-4">
        <button
          onClick={handleAction}
          className="bg-blue-600 font-bold text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700"
        >
          Ambil Antrian Anda
        </button>
      </div>
    </div>
  );
}
