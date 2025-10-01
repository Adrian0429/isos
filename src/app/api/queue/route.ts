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

export async function GET() {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:C`,
    });

    const rows = res.data.values || [];
    const queues = rows.map((row) => ({
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
      range: `${SHEET_NAME}!A:C`,
    });

    const rows = res.data.values || [];

    if (action === "New") {
      // Generate new queue number
      const lastRow = rows[rows.length - 1];
      const lastNum = lastRow ? parseInt(lastRow[0].substring(1)) : 0;
      const newNum = `A${String(lastNum + 1).padStart(3, "0")}`;

      const now = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Seoul",
      });

      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A:C`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[newNum, now, ""]],
        },
      });

      return NextResponse.json({ newQueue: newNum });
    }

    if (action === "Attend" || action === "Absent") {
      // Find row of current queue
      const rowIndex = rows.findIndex((row) => row[0] === currentQueue);
      if (rowIndex >= 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${SHEET_NAME}!C${rowIndex + 1}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[action.toLowerCase()]],
          },
        });
      }

      // Move to next queue
      const nextQueue =
        rowIndex + 1 < rows.length ? rows[rowIndex + 1][0] : currentQueue;

      return NextResponse.json({ currentQueue: nextQueue });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
