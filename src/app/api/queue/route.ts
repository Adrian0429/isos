import { google } from "googleapis";
import { NextResponse } from "next/server";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SHEET_NAME = "Queue";

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: SCOPES,
  });
}

// Helper to get today's date string: YYYY-MM-DD
function getTodayString() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }); 
}

export async function GET() {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:B`,
    });

    const rows = res.data.values || [];

    // Filter queues from today
    const today = getTodayString();
    const todayQueues = rows.filter((row) => {
      if (!row[1]) return false;
      const datePart = new Date(row[1]).toLocaleDateString("en-CA", {
        timeZone: "Asia/Seoul",
      });
      return datePart === today;
    });

    const queues = todayQueues.map((row) => ({
      queue: row[0],
      timestamp: row[1],
      status: row[2] || "",
    }));

    return NextResponse.json({ queues });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, currentQueue } = await req.json();
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // Get all rows
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:B`,
    });

    const rows = res.data.values || [];
    const today = getTodayString();

    // Filter today's rows
    const todayRows = rows.filter((row) => {
      if (!row[1]) return false;
      const datePart = new Date(row[1]).toLocaleDateString("en-CA", {
        timeZone: "Asia/Seoul",
      });
      return datePart === today;
    });

    if (action === "New") {
      let lastNum = 0;
      if (todayRows.length > 0 && todayRows[todayRows.length - 1][0]) {
        lastNum = parseInt(todayRows[todayRows.length - 1][0].substring(1)) || 0;
      }
      const newNum = `A${String(lastNum + 1).padStart(3, "0")}`;

      const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" });

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A:B`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[newNum, now, ""]],
        },
      });

      return NextResponse.json({ newQueue: newNum });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
