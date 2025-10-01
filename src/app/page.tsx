import QueueUI from "./queue-ui";
import { getSheetData } from "./lib/googleSheets";

export default async function Page() {
  const rows = await getSheetData();
  console.log("data", rows)
  const queues = rows.map((row) => row[0]); // take first column as queue numbers
  const initialQueue = queues[1] || "Empty Queue";

  return <QueueUI initialQueue={initialQueue} queues={queues} />;
}
