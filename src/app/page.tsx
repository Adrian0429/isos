"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function QueueUI({
  initialQueue,
  queues,
}: {
  initialQueue: string;
  queues: string[];
}) {
  const [queue, setQueue] = useState<string>(initialQueue);
  const [day, setDay] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchQueues() {
      const res = await fetch("/api/queue"); // create GET API returning current queues
      const data = await res.json();
      setQueue(data.queues);
    }

    fetchQueues();
    const interval = setInterval(fetchQueues, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

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

  function handleNext() {
    const idx = queues.indexOf(queue);
    if (idx >= 0 && idx < queues.length - 1) {
      setQueue(queues[idx + 1]);
    }
  }

  async function handleAction(action: "Attend" | "Absent" | "New") {
    const res = await fetch("/api/queue", {
      method: "POST",
      body: JSON.stringify({ action, currentQueue: queue }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();

    if (action === "New") {
      if (data.newQueue) {
        printTicket(data.newQueue);
        router.refresh();
      }
    } else {
      setQueue(data.currentQueue);
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

      <div className="flex-grow flex p-6 gap-6">
        {/* Left Side - Current Serving */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white rounded-lg shadow-lg p-8 flex-grow flex flex-col justify-center items-center border-2 border-blue-200">
            <div className="text-lg font-medium text-gray-600 mb-4">
              Sedang Dilayani :
            </div>
            <div className="text-xl font-semibold text-blue-600 mb-2">
              Nomor Antrian
            </div>
            <div className="text-6xl font-bold text-orange-500 border-4 border-orange-500 rounded-lg px-8 py-4 mb-6">
              {queue ?? "Loading..."}
            </div>
          </div>
        </div>

        {/* Right Side - Next Queues */}
        <div className="flex-1 flex flex-col gap-4">
          {queues
            .slice(queues.indexOf(queue) + 1, queues.indexOf(queue) + 6)
            .map((q, i) => (
              <div
                key={q}
                className="bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-between font-medium text-lg"
              >
                <span>{q}</span>
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
        <a
          href={`https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}/export?format=xlsx`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-purple-700"
        >
          Download Excel
        </a>
      </div>
    </div>
  );
}
