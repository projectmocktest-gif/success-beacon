import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory cache to prevent Google sheets rate-limiting (10 seconds)
interface CacheEntry<T> {
  data: T;
  expiry: number;
}
const cache: { [key: string]: CacheEntry<any> } = {};
const CACHE_DURATION_MS = 10 * 1000; // 10 seconds

function getCachedData<T>(key: string): T | null {
  const entry = cache[key];
  if (entry && entry.expiry > Date.now()) {
    return entry.data as T;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  cache[key] = {
    data,
    expiry: Date.now() + CACHE_DURATION_MS,
  };
}

// Robust CSV Parser
function parseCSV(csvText: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      row.push(currentVal.trim());
      result.push(row);
      row = [];
      currentVal = '';
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentVal += char;
    }
  }
  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    result.push(row);
  }
  return result.filter(r => r.length > 0 && r.some(cell => cell !== ''));
}

const MAIN_SPREADSHEET_ID = "1Gyexbb_bud5n49vI6aRErUEBscLbT8O0luX4s9pKr6U";

// Endpoint to fetch basic data from main spreadsheet sheets
app.get("/api/dashboard-data", async (req, res) => {
  const cacheKey = "dashboard-data";
  const cached = getCachedData<any>(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const fetchSheetCSV = async (gid: string): Promise<string[][]> => {
      const url = `https://docs.google.com/spreadsheets/d/${MAIN_SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch sheet with gid ${gid}: status ${response.status}`);
      }
      const text = await response.text();
      return parseCSV(text);
    };

    // Parallel calls to accelerate initial load
    const [studentsRaw, classTestsRaw, mockTestsRaw, jobsRaw, liveRaw, videoRaw, homeworksRaw, judgeYourselfRaw] = await Promise.all([
      fetchSheetCSV("0"),
      fetchSheetCSV("76197946"),
      fetchSheetCSV("544853351"),
      fetchSheetCSV("107622050"),
      fetchSheetCSV("1403663788"),
      fetchSheetCSV("1800858796"),
      fetchSheetCSV("1513972808"),
      fetchSheetCSV("1809201029"),
    ]);

    // Parse students (GID 0)
    // CSV Header: Sl. No.,Uer Id,Name,batch Name,Pass word,Active,Message
    const students = studentsRaw.slice(1).map((row, idx) => ({
      slNo: parseFloat(row[0]) || idx + 1,
      userId: (row[1] || "").trim(),
      name: (row[2] || "").trim(),
      batchName: (row[3] || "").trim(),
      password: (row[4] || "").trim(),
      active: (row[5] || "").trim().toLowerCase() === "yes",
      message: (row[6] || "None").trim(),
    })).filter(s => s.name);

    // Parse Class_test (GID 76197946)
    // CSV Header: Test Name,Subject,Link,Active ,Time,Negative Marking,Positive Marking
    const classTests = classTestsRaw.slice(1).map(row => ({
      testName: (row[0] || "").trim(),
      subject: (row[1] || "").trim(),
      link: (row[2] || "").trim(),
      active: (row[3] || "").trim().toLowerCase() === "yes",
      timeLimit: parseFloat(row[4]) || 10,
      negativeMarking: parseFloat(row[5]) !== undefined && !isNaN(parseFloat(row[5])) ? parseFloat(row[5]) : 0.25,
      positiveMarking: parseFloat(row[6]) !== undefined && !isNaN(parseFloat(row[6])) ? parseFloat(row[6]) : 1.0,
    })).filter(t => t.testName);

    // Parse Mock_test (GID 544853351)
    const mockTests = mockTestsRaw.slice(1).map(row => ({
      testName: (row[0] || "").trim(),
      subject: (row[1] || "").trim(),
      link: (row[2] || "").trim(),
      active: (row[3] || "").trim().toLowerCase() === "yes",
      timeLimit: parseFloat(row[4]) || 15,
      negativeMarking: parseFloat(row[5]) !== undefined && !isNaN(parseFloat(row[5])) ? parseFloat(row[5]) : 0.25,
      positiveMarking: parseFloat(row[6]) !== undefined && !isNaN(parseFloat(row[6])) ? parseFloat(row[6]) : 1.0,
    })).filter(t => t.testName);

    // Parse Job Notification (GID 107622050)
    // CSV Header: Job Notification,Age,Qualification,Last Date,Link
    const jobNotifications = jobsRaw.slice(1).map(row => ({
      title: (row[0] || "").trim(),
      age: (row[1] || "").trim(),
      qualification: (row[2] || "").trim(),
      lastDate: (row[3] || "").trim(),
      link: (row[4] || "").trim(),
    })).filter(j => j.title);

    // Parse Live Class Routine (GID 1403663788)
    // CSV Header: Date,time,Subject,Class link,Active
    const liveClasses = liveRaw.slice(1).map(row => ({
      date: (row[0] || "").trim(),
      time: (row[1] || "").trim(),
      subject: (row[2] || "").trim(),
      classLink: (row[3] || "").trim(),
      active: (row[4] || "").trim().toLowerCase() === "yes",
    })).filter(l => l.date && l.subject);

    // Parse Video Lectures (GID 1800858796)
    // CSV Header: Topic Name,Sub,Link
    const videoLectures = videoRaw.slice(1).map(row => ({
      topicName: (row[0] || "").trim(),
      subject: (row[1] || "").trim(),
      link: (row[2] || "").trim(),
    })).filter(v => v.topicName && v.link);

    // Parse Home_work (GID 1513972808)
    // CSV Header: Test Name,Subject,Link,Active ,Time,Negative Marking,Positive Marking
    const homeworks = homeworksRaw.slice(1).map(row => ({
      testName: (row[0] || "").trim(),
      subject: (row[1] || "").trim(),
      link: (row[2] || "").trim(),
      active: (row[3] || "").trim().toLowerCase() === "yes",
      timeLimit: parseFloat(row[4]) || 15,
      negativeMarking: parseFloat(row[5]) !== undefined && !isNaN(parseFloat(row[5])) ? parseFloat(row[5]) : 0.25,
      positiveMarking: parseFloat(row[6]) !== undefined && !isNaN(parseFloat(row[6])) ? parseFloat(row[6]) : 1.0,
    })).filter(t => t.testName);

    // Parse Judge yourself (GID 1809201029)
    // CSV Header: Test Name,Subject,Link,Active 
    const judgeYourself = judgeYourselfRaw.slice(1).map(row => ({
      testName: (row[0] || "").trim(),
      subject: (row[1] || "").trim(),
      link: (row[2] || "").trim(),
      active: (row[3] || "").trim().toLowerCase() === "yes",
      timeLimit: 15,
      negativeMarking: 0.25,
      positiveMarking: 1.0,
    })).filter(t => t.testName);

    const payload = {
      students,
      classTests,
      mockTests,
      jobNotifications,
      liveClasses,
      videoLectures,
      homeworks,
      judgeYourself,
    };

    setCachedData(cacheKey, payload);
    res.json(payload);
  } catch (error: any) {
    console.error("Error loading sheet data:", error);
    res.status(500).json({ error: "Failed to fetch spreadsheet dashboard data: " + error.message });
  }
});

// Helper to convert sheet edit links into CSV exports dynamically
function convertDocumentUrlToCSVExport(webUrl: string, sheetName?: string): string {
  // Handles: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit?usp=sharing
  // Returns: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?format=csv
  try {
    const cleanUrl = webUrl.trim();
    if (!cleanUrl.includes("docs.google.com/spreadsheets")) {
      return cleanUrl;
    }
    const match = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return cleanUrl;
    }
    const sheetId = match[1];
    
    if (sheetName) {
      // Use the gviz/tq endpoint which is robust for downloading specific sheet tabs by name
      return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    }
    
    // Extract GID if present, e.g., gid=123
    const gidMatch = cleanUrl.match(/[?&]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : "";
    
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
  } catch (e) {
    return webUrl;
  }
}

// Helper to transform Google Drive viewer links into direct image download links
function transformGoogleDriveImageUrl(url: string): string {
  if (!url) return url;
  const trimmed = url.trim();
  
  if (trimmed.includes("drive.google.com") || trimmed.includes("docs.google.com")) {
    let fileId = "";
    
    // Pattern 1: /file/d/FILE_ID/view or /file/d/FILE_ID/edit
    const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{25,50})/);
    if (dMatch && dMatch[1]) {
      fileId = dMatch[1];
    } else {
      // Pattern 2: ?id=FILE_ID or &id=FILE_ID
      const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{25,50})/);
      if (idMatch && idMatch[1]) {
        fileId = idMatch[1];
      }
    }
    
    if (fileId) {
      // Standard public direct-view image link bypasses cookie checks in iframe setups
      return `https://docs.google.com/uc?export=download&id=${fileId}`;
    }
  }
  return trimmed;
}

// Endpoint to fetch test questions dynamically from the link specified in the sheet
app.get("/api/fetch-test-questions", async (req, res) => {
  const { sheetUrl, language } = req.query;
  if (!sheetUrl || typeof sheetUrl !== "string") {
    return res.status(400).json({ error: "Query parameter 'sheetUrl' is required." });
  }

  const langStr = typeof language === "string" ? language.trim() : "";
  const cacheKey = `questions-${sheetUrl}-${langStr || "default"}`;
  const cached = getCachedData<any>(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    let csvUrl = convertDocumentUrlToCSVExport(sheetUrl, langStr || undefined);
    console.log(`Original URL: "${sheetUrl}" (lang: "${langStr}") -> Target CSV Export: "${csvUrl}"`);
    
    let response = await fetch(csvUrl);
    
    // Fallback logic structure: If selected tab was requested but returned non-ok (e.g. 400 or tab not found), 
    // retry with standard default tab url structure.
    if (!response.ok && langStr) {
      console.warn(`Failed fetching language tab "${langStr}". Falling back to default sheet layout.`);
      csvUrl = convertDocumentUrlToCSVExport(sheetUrl);
      response = await fetch(csvUrl);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV stream from Google: status ${response.status}`);
    }
    
    const csvText = await response.text();
    const rows = parseCSV(csvText);

    // Identify spreadsheet format dynamically based on headers in first row
    const firstRowKeys = rows[0] ? rows[0].map(cell => (cell || "").trim().toLowerCase()) : [];
    const isNewLayout = firstRowKeys.includes("passage") || firstRowKeys.includes("option e") || firstRowKeys.includes("group id") || firstRowKeys.length >= 10;
    
    console.log(`Exam Portal parser layout: ${isNewLayout ? "New 5-Option (Passage + Image attachments)" : "Traditional 4-Option"}. Columns count: ${firstRowKeys.length}`);

    // Pre-calculate question number ranges for each unique groupId
    const groupRanges: { [groupId: string]: { min: number; max: number } } = {};
    if (isNewLayout) {
      rows.slice(1).forEach((row, idx) => {
        const questionNo = parseFloat(row[0]) || idx + 1;
        const groupId = (row[1] || "").trim().toLowerCase();
        if (groupId) {
          if (!groupRanges[groupId]) {
            groupRanges[groupId] = { min: questionNo, max: questionNo };
          } else {
            groupRanges[groupId].min = Math.min(groupRanges[groupId].min, questionNo);
            groupRanges[groupId].max = Math.max(groupRanges[groupId].max, questionNo);
          }
        }
      });
    }

    const questions = rows.slice(1).map((row, idx) => {
      let questionNo = idx + 1;
      let questionText = "";
      let optionA = "";
      let optionB = "";
      let optionC = "";
      let optionD = "";
      let optionE = "";
      let correctAnswerStr = "A";
      let explanation = "";
      let questionImage = "";
      let explanationImage = "";

      if (isNewLayout) {
        // New Layout columns: Q. no., group id, Passage, Question, Question picture link, option a, option b, option c, option d, option e, Correct option, Explanation, Explanation picture link
        questionNo = parseFloat(row[0]) || idx + 1;
        
        const passage = (row[2] || "").trim();
        const mainQuestion = (row[3] || "").trim();
        const groupId = (row[1] || "").trim();
        const groupIdKey = groupId.toLowerCase();

        if (passage) {
          if (groupIdKey && groupRanges[groupIdKey]) {
            const { min, max } = groupRanges[groupIdKey];
            const rangeStr = min === max ? `Q. ${min}` : `Q. ${min}-${max}`;
            questionText = `Directions (${rangeStr}):\n${passage}\n\n${mainQuestion}`;
          } else {
            questionText = `${passage}\n\n${mainQuestion}`;
          }
        } else {
          questionText = mainQuestion;
        }

        questionImage = transformGoogleDriveImageUrl((row[4] || "").trim());
        optionA = (row[5] || "").trim();
        optionB = (row[6] || "").trim();
        optionC = (row[7] || "").trim();
        optionD = (row[8] || "").trim();
        optionE = (row[9] || "").trim();
        correctAnswerStr = (row[10] || "").trim().toUpperCase();
        explanation = (row[11] || "").trim();
        explanationImage = transformGoogleDriveImageUrl((row[12] || "").trim());
      } else {
        // Original layout columns: Question No,Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation
        questionNo = parseFloat(row[0]) || idx + 1;
        questionText = (row[1] || "").trim();
        optionA = (row[2] || "").trim();
        optionB = (row[3] || "").trim();
        optionC = (row[4] || "").trim();
        optionD = (row[5] || "").trim();
        correctAnswerStr = (row[6] || "").trim().toUpperCase();
        explanation = (row[7] || "").trim();
      }

      // Format correct answer as 'A', 'B', 'C', 'D' or 'E'
      let validAnswer: "A" | "B" | "C" | "D" | "E" = "A";
      if (["A", "B", "C", "D", "E"].includes(correctAnswerStr)) {
        validAnswer = correctAnswerStr as any;
      } else {
        // Support common spreadsheet values like lowercase or index numbers
        if (correctAnswerStr === "1" || correctAnswerStr.startsWith("A")) validAnswer = "A";
        else if (correctAnswerStr === "2" || correctAnswerStr.startsWith("B")) validAnswer = "B";
        else if (correctAnswerStr === "3" || correctAnswerStr.startsWith("C")) validAnswer = "C";
        else if (correctAnswerStr === "4" || correctAnswerStr.startsWith("D")) validAnswer = "D";
        else if (correctAnswerStr === "5" || correctAnswerStr.startsWith("E")) validAnswer = "E";
      }

      return {
        questionNo,
        question: questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        optionE: optionE || undefined,
        correctAnswer: validAnswer,
        explanation,
        questionImage: questionImage || undefined,
        explanationImage: explanationImage || undefined
      };
    }).filter(q => q.question);

    setCachedData(cacheKey, questions);
    res.json(questions);
  } catch (error: any) {
    console.error("Error loading questions sheet:", error);
    res.status(500).json({ error: "Failed to download exam questions: " + error.message });
  }
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support single-page application routing correctly
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
