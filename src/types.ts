export interface Student {
  slNo: number;
  userId: string;
  name: string;
  batchName: string;
  password: string;
  active: boolean;
  message: string;
}

export interface ClassTest {
  testName: string;
  subject: string;
  link: string;
  active: boolean;
  timeLimit: number; // in minutes
  negativeMarking: number;
  positiveMarking: number;
}

export interface MockTest {
  testName: string;
  subject: string;
  link: string;
  active: boolean;
  timeLimit: number;
  negativeMarking: number;
  positiveMarking: number;
}

export interface JobNotification {
  title: string;
  age: string;
  qualification: string;
  lastDate: string;
  link: string;
}

export interface LiveClass {
  date: string;
  time: string;
  subject: string;
  classLink: string;
  active: boolean;
}

export interface Question {
  questionNo: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
  questionImage?: string;
  explanationImage?: string;
}

export interface UserResponse {
  questionNo: number;
  selectedOption: 'A' | 'B' | 'C' | 'D' | 'E' | null;
  isCorrect: boolean;
  earnedMarks: number;
}

export interface TestResult {
  testName: string;
  spentTime: number; // in seconds
  totalQuestions: number;
  attempted: number;
  unattempted: number;
  correct: number;
  incorrect: number;
  score: number;
  maxScore: number;
  accuracy: number; // percentage
  answers: { [key: number]: 'A' | 'B' | 'C' | 'D' | 'E' | null };
  gradedResponses: UserResponse[];
  timestamp: number;
  questions?: Question[];
  positiveMarking?: number;
  negativeMarking?: number;
}

export interface VideoLecture {
  topicName: string;
  subject: string;
  link: string;
}

export interface HomeWork {
  testName: string;
  subject: string;
  link: string;
  active: boolean;
  timeLimit: number;
  negativeMarking: number;
  positiveMarking: number;
}

export interface JudgeYourself {
  testName: string;
  subject: string;
  link: string;
  active: boolean;
  timeLimit?: number;
  negativeMarking?: number;
  positiveMarking?: number;
}

