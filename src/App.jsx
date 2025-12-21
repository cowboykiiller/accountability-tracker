import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Target, Calendar, ChevronLeft, ChevronRight, Plus, Trash2, BarChart3, CalendarDays, TrendingUp, TrendingDown, Award, CheckCircle2, XCircle, Home, ChevronDown, LogOut, User } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, AreaChart, Area } from 'recharts';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKRKnQjV2r7DDEL_BHIyl5Fi0JDAl4foc",
  authDomain: "the-accountability-group.firebaseapp.com",
  projectId: "the-accountability-group",
  storageBucket: "the-accountability-group.firebasestorage.app",
  messagingSenderId: "1060411657406",
  appId: "1:1060411657406:web:473bdee102d480a1e7e2ef",
  measurementId: "G-5W573SPKVB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Constants
const PARTICIPANTS = ['Taylor', 'Brandon', 'John'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATUS_CONFIG = {
  'Exceeded': { color: '#10b981', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
  'Done': { color: '#22c55e', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  'On Track': { color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  'At Risk': { color: '#f59e0b', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
  'Missed': { color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-700' }
};
const PARTICIPANT_COLORS = { 'Taylor': '#8b5cf6', 'Brandon': '#06b6d4', 'John': '#f97316' };

// Initial data - this will be loaded into Firebase on first run
const initialData = [
  { id: 1, habit: "Workout 4 Times", participant: "Taylor", weekStart: "2025-09-15", daysCompleted: [1, 4], target: 4 },
  { id: 2, habit: "Workout 4 Times", participant: "Brandon", weekStart: "2025-09-15", daysCompleted: [0, 1, 3, 4], target: 4 },
  { id: 3, habit: "Explore Monday.com", participant: "Taylor", weekStart: "2025-09-15", daysCompleted: [2], target: 1 },
  { id: 4, habit: "No Panic Selling", participant: "Brandon", weekStart: "2025-09-15", daysCompleted: [0, 1, 3, 4], target: 5 },
  { id: 5, habit: "Explore CoHatch", participant: "Taylor", weekStart: "2025-09-15", daysCompleted: [], target: 1 },
  { id: 6, habit: "Buy Groceries", participant: "Brandon", weekStart: "2025-09-15", daysCompleted: [2], target: 1 },
  { id: 7, habit: "No Social Media 9-5pm", participant: "Taylor", weekStart: "2025-09-15", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 8, habit: "Real-Time Journaling", participant: "Brandon", weekStart: "2025-09-15", daysCompleted: [0, 2, 4], target: 5 },
  { id: 9, habit: "No J'n Around", participant: "Taylor", weekStart: "2025-09-15", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 10, habit: "No Social Media 9-5pm", participant: "Brandon", weekStart: "2025-09-15", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 11, habit: "Trade Execution", participant: "Brandon", weekStart: "2025-09-15", daysCompleted: [0, 2, 4], target: 5 },
  { id: 12, habit: "5:30am Run", participant: "Taylor", weekStart: "2025-09-22", daysCompleted: [], target: 3 },
  { id: 13, habit: "Workout 3 Times", participant: "Taylor", weekStart: "2025-09-22", daysCompleted: [], target: 3 },
  { id: 14, habit: "Dispo all deals from last week", participant: "Taylor", weekStart: "2025-09-22", daysCompleted: [], target: 1 },
  { id: 15, habit: "Visit One Client Unannounced", participant: "Taylor", weekStart: "2025-09-22", daysCompleted: [], target: 1 },
  { id: 16, habit: "File Taxes for 2023, 2024", participant: "Taylor", weekStart: "2025-09-22", daysCompleted: [], target: 1 },
  { id: 17, habit: "No Social Media 9-5pm", participant: "Taylor", weekStart: "2025-09-22", daysCompleted: [], target: 3 },
  { id: 18, habit: "Workout 4 Times", participant: "Brandon", weekStart: "2025-09-22", daysCompleted: [0, 1, 3, 4], target: 4 },
  { id: 19, habit: "Meditate", participant: "Brandon", weekStart: "2025-09-22", daysCompleted: [0, 1, 2, 3, 4, 5], target: 5 },
  { id: 20, habit: "Follow through on Trades", participant: "Brandon", weekStart: "2025-09-22", daysCompleted: [2], target: 5 },
  { id: 21, habit: "Real-Time Journaling", participant: "Brandon", weekStart: "2025-09-22", daysCompleted: [0, 1, 3, 4], target: 5 },
  { id: 22, habit: "No Social Media 9-5pm", participant: "Brandon", weekStart: "2025-09-22", daysCompleted: [0, 1, 3, 4], target: 5 },
  { id: 23, habit: "Execute Trades", participant: "Brandon", weekStart: "2025-09-22", daysCompleted: [0, 2, 4], target: 5 },
  { id: 24, habit: "Cardio", participant: "John", weekStart: "2025-09-22", daysCompleted: [], target: 4 },
  { id: 25, habit: "Track everything I eat", participant: "John", weekStart: "2025-09-22", daysCompleted: [], target: 7 },
  { id: 26, habit: "Work on app 10 minutes", participant: "John", weekStart: "2025-09-22", daysCompleted: [], target: 7 },
  { id: 27, habit: "Meditate 20 min", participant: "John", weekStart: "2025-09-22", daysCompleted: [], target: 7 },
  { id: 28, habit: "No Social Media 9-5pm", participant: "John", weekStart: "2025-09-22", daysCompleted: [], target: 5 },
  { id: 29, habit: "Talk with or hang with 1+ friend/fam", participant: "John", weekStart: "2025-09-22", daysCompleted: [], target: 6 },
  { id: 30, habit: "Workout 4 Times", participant: "Brandon", weekStart: "2025-09-29", daysCompleted: [0, 2, 4], target: 4 },
  { id: 31, habit: "Meditate", participant: "Brandon", weekStart: "2025-09-29", daysCompleted: [0, 1, 3, 4], target: 5 },
  { id: 32, habit: "Follow through on Trades", participant: "Brandon", weekStart: "2025-09-29", daysCompleted: [], target: 5 },
  { id: 33, habit: "Real-Time Journaling", participant: "Brandon", weekStart: "2025-09-29", daysCompleted: [2], target: 5 },
  { id: 34, habit: "No Social Media 9-5pm", participant: "Brandon", weekStart: "2025-09-29", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 35, habit: "Execute Trades", participant: "Brandon", weekStart: "2025-09-29", daysCompleted: [1, 4], target: 5 },
  { id: 36, habit: "build a check list", participant: "Brandon", weekStart: "2025-09-29", daysCompleted: [2], target: 1 },
  { id: 37, habit: "end of the day review", participant: "Brandon", weekStart: "2025-09-29", daysCompleted: [2], target: 4 },
  { id: 38, habit: "Post 1 TikTok about Branches", participant: "John", weekStart: "2025-09-29", daysCompleted: [], target: 7 },
  { id: 39, habit: "Work on app 10 minutes", participant: "John", weekStart: "2025-09-29", daysCompleted: [], target: 7 },
  { id: 40, habit: "Track everything I eat", participant: "John", weekStart: "2025-09-29", daysCompleted: [], target: 7 },
  { id: 41, habit: "Cardio", participant: "John", weekStart: "2025-09-29", daysCompleted: [], target: 3 },
  { id: 42, habit: "Meditate 20 min", participant: "John", weekStart: "2025-09-29", daysCompleted: [], target: 7 },
  { id: 43, habit: "No Social Media 9-5pm", participant: "John", weekStart: "2025-09-29", daysCompleted: [], target: 5 },
  { id: 44, habit: "Talk with or hang with 1+ friend/fam", participant: "John", weekStart: "2025-09-29", daysCompleted: [], target: 7 },
  { id: 45, habit: "workout 4 times", participant: "Brandon", weekStart: "2025-10-06", daysCompleted: [2], target: 4 },
  { id: 46, habit: "Meditate", participant: "Brandon", weekStart: "2025-10-06", daysCompleted: [2], target: 5 },
  { id: 47, habit: "follow through on Trades", participant: "Brandon", weekStart: "2025-10-06", daysCompleted: [], target: 1 },
  { id: 48, habit: "Real-Time Journaling", participant: "Brandon", weekStart: "2025-10-06", daysCompleted: [2], target: 1 },
  { id: 49, habit: "no social media 9-5pm", participant: "Brandon", weekStart: "2025-10-06", daysCompleted: [2], target: 5 },
  { id: 50, habit: "execute trades", participant: "Brandon", weekStart: "2025-10-06", daysCompleted: [], target: 1 },
  { id: 51, habit: "end of day review", participant: "Brandon", weekStart: "2025-10-06", daysCompleted: [], target: 1 },
  { id: 52, habit: "Post 1 TikTok related to Branches", participant: "John", weekStart: "2025-10-06", daysCompleted: [0, 1, 2, 3, 4, 5], target: 7 },
  { id: 53, habit: "Code on app 10 minutes", participant: "John", weekStart: "2025-10-06", daysCompleted: [0, 1, 2, 3, 4, 5, 6], target: 7 },
  { id: 54, habit: "Cardio", participant: "John", weekStart: "2025-10-06", daysCompleted: [0, 2, 4], target: 3 },
  { id: 55, habit: "Meditate 20 min", participant: "John", weekStart: "2025-10-06", daysCompleted: [0, 1, 2, 3, 4, 5, 6], target: 7 },
  { id: 56, habit: "No Social Media before 5pm", participant: "John", weekStart: "2025-10-06", daysCompleted: [0, 1, 2, 3, 4], target: 7 },
  { id: 57, habit: "Talk with or hang with 1+ friend/fam", participant: "John", weekStart: "2025-10-06", daysCompleted: [0, 1, 2, 3, 4, 5], target: 7 },
  { id: 58, habit: "Exercise 5 Days", participant: "Taylor", weekStart: "2025-10-13", daysCompleted: [0, 1, 3, 4], target: 5 },
  { id: 59, habit: "Find Buyers for 2 Deals", participant: "Taylor", weekStart: "2025-10-13", daysCompleted: [], target: 1 },
  { id: 60, habit: "Renegotiate 2 Deals", participant: "Taylor", weekStart: "2025-10-13", daysCompleted: [1, 4], target: 1 },
  { id: 61, habit: "Begin Disposition Training", participant: "Taylor", weekStart: "2025-10-13", daysCompleted: [], target: 1 },
  { id: 62, habit: "Eat Lean Meals", participant: "Taylor", weekStart: "2025-10-13", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 63, habit: "Have Lunch with 1 Client", participant: "Taylor", weekStart: "2025-10-13", daysCompleted: [2], target: 1 },
  { id: 64, habit: "No Social Media 9-5pm", participant: "Taylor", weekStart: "2025-10-13", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 65, habit: "Track Grady's KPI's", participant: "Taylor", weekStart: "2025-10-13", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 66, habit: "Post 1 TikTok related to Branches", participant: "John", weekStart: "2025-10-13", daysCompleted: [0, 2, 4], target: 7 },
  { id: 67, habit: "Code on app 10 minutes", participant: "John", weekStart: "2025-10-13", daysCompleted: [0, 1, 2, 3, 4], target: 7 },
  { id: 68, habit: "Cardio", participant: "John", weekStart: "2025-10-13", daysCompleted: [2], target: 3 },
  { id: 69, habit: "Meditate 20 min", participant: "John", weekStart: "2025-10-13", daysCompleted: [0, 1, 2, 3, 4, 5, 6], target: 7 },
  { id: 70, habit: "No Social Media before 5pm", participant: "John", weekStart: "2025-10-13", daysCompleted: [0, 1, 2, 3, 4, 5], target: 6 },
  { id: 71, habit: "Talk with or hang with 1+ friend/fam", participant: "John", weekStart: "2025-10-13", daysCompleted: [0, 1, 2, 3, 4, 5, 6], target: 7 },
  { id: 72, habit: "Make mobile convert to flashcard look better", participant: "John", weekStart: "2025-10-13", daysCompleted: [], target: 1 },
  { id: 73, habit: "Add core spaced repetition review logic/data", participant: "John", weekStart: "2025-10-13", daysCompleted: [], target: 1 },
  { id: 74, habit: "add delete flashcard mechanism", participant: "John", weekStart: "2025-10-13", daysCompleted: [], target: 1 },
  { id: 75, habit: "workout 4 times", participant: "Brandon", weekStart: "2025-10-13", daysCompleted: [0, 2, 4], target: 4 },
  { id: 76, habit: "Meditate", participant: "Brandon", weekStart: "2025-10-13", daysCompleted: [0, 2, 4], target: 5 },
  { id: 77, habit: "follow through on Trades", participant: "Brandon", weekStart: "2025-10-13", daysCompleted: [2], target: 1 },
  { id: 78, habit: "Real-Time Journaling", participant: "Brandon", weekStart: "2025-10-13", daysCompleted: [2], target: 5 },
  { id: 79, habit: "no social media 9-5pm", participant: "Brandon", weekStart: "2025-10-13", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 80, habit: "execute trades", participant: "Brandon", weekStart: "2025-10-13", daysCompleted: [2], target: 1 },
  { id: 81, habit: "end of day review", participant: "Brandon", weekStart: "2025-10-13", daysCompleted: [], target: 5 },
  { id: 82, habit: "Clean up editing to use Redux/fix editing bugs", participant: "John", weekStart: "2025-10-20", daysCompleted: [], target: 1 },
  { id: 83, habit: "Get iOS web mobile view working", participant: "John", weekStart: "2025-10-20", daysCompleted: [], target: 1 },
  { id: 84, habit: "interview or demo 3 users", participant: "John", weekStart: "2025-10-20", daysCompleted: [2], target: 1 },
  { id: 85, habit: "Code on app 10 minutes", participant: "John", weekStart: "2025-10-20", daysCompleted: [0, 1, 2, 3, 4, 5], target: 7 },
  { id: 86, habit: "Cardio", participant: "John", weekStart: "2025-10-20", daysCompleted: [0, 2, 4], target: 3 },
  { id: 87, habit: "Meditate 20 min", participant: "John", weekStart: "2025-10-20", daysCompleted: [0, 1, 2, 3, 4, 5, 6], target: 7 },
  { id: 88, habit: "No Social Media before 5pm", participant: "John", weekStart: "2025-10-20", daysCompleted: [0, 1, 2, 3, 4, 5, 6], target: 6 },
  { id: 89, habit: "Talk with or hang with 1+ friend/fam", participant: "John", weekStart: "2025-10-20", daysCompleted: [0, 1, 2, 3, 4, 5, 6], target: 7 },
  { id: 90, habit: "Erica's physical therapy", participant: "John", weekStart: "2025-10-20", daysCompleted: [0, 1, 2, 3, 4, 5], target: 7 },
  { id: 91, habit: "Exercise 4 Days", participant: "Taylor", weekStart: "2025-10-20", daysCompleted: [0, 1, 3, 4], target: 4 },
  { id: 92, habit: "Find Buyers for 2 Deals", participant: "Taylor", weekStart: "2025-10-20", daysCompleted: [2], target: 2 },
  { id: 93, habit: "Renegotiation Calls with Grady", participant: "Taylor", weekStart: "2025-10-20", daysCompleted: [0, 1, 2, 3, 4], target: 4 },
  { id: 94, habit: "Begin Disposition Training", participant: "Taylor", weekStart: "2025-10-20", daysCompleted: [], target: 1 },
  { id: 95, habit: "Eat Lean Meals", participant: "Taylor", weekStart: "2025-10-20", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 96, habit: "Have Lunch with 1 Client", participant: "Taylor", weekStart: "2025-10-20", daysCompleted: [], target: 1 },
  { id: 97, habit: "No Social Media 9-5pm", participant: "Taylor", weekStart: "2025-10-20", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 98, habit: "Track Grady's KPI's at the end of each day", participant: "Taylor", weekStart: "2025-10-20", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 99, habit: "Workout 3 times", participant: "Brandon", weekStart: "2025-10-20", daysCompleted: [1, 4], target: 3 },
  { id: 100, habit: "Meditate", participant: "Brandon", weekStart: "2025-10-20", daysCompleted: [2], target: 4 },
  { id: 101, habit: "follow through on Trades", participant: "Brandon", weekStart: "2025-10-20", daysCompleted: [2], target: 2 },
  { id: 102, habit: "Real-Time Journaling", participant: "Brandon", weekStart: "2025-10-20", daysCompleted: [1, 4], target: 3 },
  { id: 103, habit: "no social media 9-5pm", participant: "Brandon", weekStart: "2025-10-20", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 104, habit: "execute trades", participant: "Brandon", weekStart: "2025-10-20", daysCompleted: [0, 2, 4], target: 1 },
  { id: 105, habit: "end of day review", participant: "Brandon", weekStart: "2025-10-20", daysCompleted: [0, 2, 4], target: 3 },
  { id: 106, habit: "Get iOS web mobile view working", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 1 },
  { id: 107, habit: "interview or demo to 1 user", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 1 },
  { id: 108, habit: "Code on app 10 minutes", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 6 },
  { id: 109, habit: "ask for preorder payment for app", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 1 },
  { id: 110, habit: "Cardio", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 3 },
  { id: 111, habit: "Meditate 20 min", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 7 },
  { id: 112, habit: "No Social Media before 5pm", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 6 },
  { id: 113, habit: "Talk with or hang with 1+ friend/fam", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 7 },
  { id: 114, habit: "Message nutritionist", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 1 },
  { id: 115, habit: "message pt", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 1 },
  { id: 116, habit: "improve diet/meal plan", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 1 },
  { id: 117, habit: "order probiotic", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 1 },
  { id: 118, habit: "have lunch and dinner ready", participant: "John", weekStart: "2025-10-27", daysCompleted: [0, 1, 2, 3, 4, 5], target: 7 },
  { id: 119, habit: "thoracic mobility exercises", participant: "John", weekStart: "2025-10-27", daysCompleted: [0, 1, 2, 3, 4, 5], target: 5 },
  { id: 120, habit: "lacrosse ball release", participant: "John", weekStart: "2025-10-27", daysCompleted: [0, 1, 2, 3, 4, 5], target: 3 },
  { id: 121, habit: "prone PT exercises", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 6 },
  { id: 122, habit: "seated/standing PT exercises", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 6 },
  { id: 123, habit: "in bed by 9:30pm", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 1 },
  { id: 124, habit: "in bed by 10:30pm", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 1 },
  { id: 125, habit: "out of bed by 6:30am", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 4 },
  { id: 126, habit: "out of bed by 7:30am", participant: "John", weekStart: "2025-10-27", daysCompleted: [], target: 3 },
  { id: 127, habit: "Workout 4 times", participant: "Brandon", weekStart: "2025-10-27", daysCompleted: [0, 1, 3, 4], target: 4 },
  { id: 128, habit: "Meditate 5 days a week", participant: "Brandon", weekStart: "2025-10-27", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 129, habit: "follow through on Trades", participant: "Brandon", weekStart: "2025-10-27", daysCompleted: [], target: 1 },
  { id: 130, habit: "Real-Time Journaling", participant: "Brandon", weekStart: "2025-10-27", daysCompleted: [0, 1, 3, 4], target: 4 },
  { id: 131, habit: "no social media 9-5pm", participant: "Brandon", weekStart: "2025-10-27", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 132, habit: "execute trades", participant: "Brandon", weekStart: "2025-10-27", daysCompleted: [0, 2, 4], target: 4 },
  { id: 133, habit: "end of day review", participant: "Brandon", weekStart: "2025-10-27", daysCompleted: [0, 1, 3, 4], target: 5 },
  { id: 134, habit: "Read one chapter a day", participant: "Brandon", weekStart: "2025-10-27", daysCompleted: [0, 1, 2, 3, 4], target: 7 },
  { id: 135, habit: "Exercise 4 Days", participant: "Taylor", weekStart: "2025-10-27", daysCompleted: [0, 2, 4], target: 4 },
  { id: 136, habit: "Lock up 1 Assignment Contract", participant: "Taylor", weekStart: "2025-10-27", daysCompleted: [2], target: 1 },
  { id: 137, habit: "Talk to 5 Buyers per Day", participant: "Taylor", weekStart: "2025-10-27", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 138, habit: "Grady Begin CRM Training", participant: "Taylor", weekStart: "2025-10-27", daysCompleted: [2], target: 1 },
  { id: 139, habit: "Eat Lean Meals", participant: "Taylor", weekStart: "2025-10-27", daysCompleted: [0, 1, 3, 4], target: 5 },
  { id: 140, habit: "Have Lunch with 1 Client", participant: "Taylor", weekStart: "2025-10-27", daysCompleted: [2], target: 1 },
  { id: 141, habit: "No Social Media 9-5pm", participant: "Taylor", weekStart: "2025-10-27", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 142, habit: "Track Grady's KPI's", participant: "Taylor", weekStart: "2025-10-27", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 143, habit: "1 Day at Coworking Space", participant: "Taylor", weekStart: "2025-10-27", daysCompleted: [], target: 1 },
  { id: 144, habit: "Cook 1 Meal", participant: "Taylor", weekStart: "2025-10-27", daysCompleted: [], target: 1 },
  { id: 145, habit: "Grocery Shopping", participant: "Taylor", weekStart: "2025-10-27", daysCompleted: [2], target: 1 },
  { id: 146, habit: "View recently viewed pages", participant: "John", weekStart: "2025-11-03", daysCompleted: [], target: 1 },
  { id: 147, habit: "Code on app 10 minutes", participant: "John", weekStart: "2025-11-03", daysCompleted: [], target: 6 },
  { id: 148, habit: "Demo app to one user", participant: "John", weekStart: "2025-11-03", daysCompleted: [], target: 1 },
  { id: 149, habit: "call/hang with 1 friend/fam", participant: "John", weekStart: "2025-11-03", daysCompleted: [], target: 7 },
  { id: 150, habit: "Follow sleep schedule", participant: "John", weekStart: "2025-11-03", daysCompleted: [], target: 7 },
  { id: 151, habit: "Do each day's PT", participant: "John", weekStart: "2025-11-03", daysCompleted: [], target: 7 },
  { id: 152, habit: "lunch and dinner ready", participant: "John", weekStart: "2025-11-03", daysCompleted: [], target: 7 },
  { id: 153, habit: "No social media before 5pm", participant: "John", weekStart: "2025-11-03", daysCompleted: [], target: 6 },
  { id: 154, habit: "Workout 4 times", participant: "Brandon", weekStart: "2025-11-03", daysCompleted: [0, 2, 4], target: 4 },
  { id: 155, habit: "Meditate 5 days a week", participant: "Brandon", weekStart: "2025-11-03", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 156, habit: "follow through on Trades", participant: "Brandon", weekStart: "2025-11-03", daysCompleted: [2], target: 1 },
  { id: 157, habit: "Real-Time Journaling", participant: "Brandon", weekStart: "2025-11-03", daysCompleted: [2], target: 1 },
  { id: 158, habit: "execute trades", participant: "Brandon", weekStart: "2025-11-03", daysCompleted: [0, 1, 2, 3, 4], target: 1 },
  { id: 159, habit: "end of day review", participant: "Brandon", weekStart: "2025-11-03", daysCompleted: [0, 2, 4], target: 5 },
  { id: 160, habit: "Read one chapter", participant: "Brandon", weekStart: "2025-11-03", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 161, habit: "Exercise 4 Days", participant: "Taylor", weekStart: "2025-11-03", daysCompleted: [0, 1, 3, 4], target: 4 },
  { id: 162, habit: "Lock up 1 Assignment Contract", participant: "Taylor", weekStart: "2025-11-03", daysCompleted: [], target: 1 },
  { id: 163, habit: "Talk to 5 Buyers per Day", participant: "Taylor", weekStart: "2025-11-03", daysCompleted: [0, 1, 3, 4], target: 5 },
  { id: 164, habit: "30 Minutes of Reading Per Day", participant: "Taylor", weekStart: "2025-11-03", daysCompleted: [0, 1, 2, 3, 4], target: 4 },
  { id: 165, habit: "Eat Lean Meals", participant: "Taylor", weekStart: "2025-11-03", daysCompleted: [0, 1, 2, 3, 4, 5], target: 4 },
  { id: 166, habit: "Meet in Person with 1 Client", participant: "Taylor", weekStart: "2025-11-03", daysCompleted: [2], target: 1 },
  { id: 167, habit: "Write Daily Goals", participant: "Taylor", weekStart: "2025-11-03", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 168, habit: "Track Grady's KPI's", participant: "Taylor", weekStart: "2025-11-03", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 169, habit: "Learn 1 New Prayer", participant: "Taylor", weekStart: "2025-11-03", daysCompleted: [], target: 1 },
  { id: 170, habit: "File Taxes for 2023", participant: "Taylor", weekStart: "2025-11-03", daysCompleted: [], target: 1 },
  { id: 171, habit: "Fix pressing Enter bug", participant: "John", weekStart: "2025-11-10", daysCompleted: [2], target: 1 },
  { id: 172, habit: "Code on app 10 minutes", participant: "John", weekStart: "2025-11-10", daysCompleted: [0, 1, 2, 3, 4], target: 6 },
  { id: 173, habit: "get 25 people to say no", participant: "John", weekStart: "2025-11-10", daysCompleted: [], target: 1 },
  { id: 174, habit: "call/hang with 1 friend/fam", participant: "John", weekStart: "2025-11-10", daysCompleted: [0, 1, 2, 3, 4, 5, 6], target: 7 },
  { id: 175, habit: "Text taylor at 5:30am", participant: "John", weekStart: "2025-11-10", daysCompleted: [1, 4], target: 5 },
  { id: 176, habit: "Follow CBT-i sleep schedule", participant: "John", weekStart: "2025-11-10", daysCompleted: [0, 1, 3, 4], target: 7 },
  { id: 177, habit: "Do each day's PT", participant: "John", weekStart: "2025-11-10", daysCompleted: [0, 1, 2, 3, 4, 5], target: 7 },
  { id: 178, habit: "lunch and dinner ready", participant: "John", weekStart: "2025-11-10", daysCompleted: [0, 1, 2, 3, 4, 5, 6], target: 7 },
  { id: 179, habit: "No social media before 5pm", participant: "John", weekStart: "2025-11-10", daysCompleted: [0, 2, 4], target: 7 },
  { id: 180, habit: "Workout 4 times", participant: "Brandon", weekStart: "2025-11-10", daysCompleted: [0, 1, 3, 4], target: 4 },
  { id: 181, habit: "Meditate 5 days a week", participant: "Brandon", weekStart: "2025-11-10", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 182, habit: "execute trades", participant: "Brandon", weekStart: "2025-11-10", daysCompleted: [2], target: 1 },
  { id: 183, habit: "no cutting trades", participant: "Brandon", weekStart: "2025-11-10", daysCompleted: [2], target: 1 },
  { id: 184, habit: "Text the group each trade", participant: "Brandon", weekStart: "2025-11-10", daysCompleted: [2], target: 1 },
  { id: 185, habit: "Real-Time Journaling", participant: "Brandon", weekStart: "2025-11-10", daysCompleted: [0, 2, 4], target: 1 },
  { id: 186, habit: "end of day review", participant: "Brandon", weekStart: "2025-11-10", daysCompleted: [0, 1, 3, 4], target: 5 },
  { id: 187, habit: "Read one chapter", participant: "Brandon", weekStart: "2025-11-10", daysCompleted: [0, 1, 2, 3, 4, 5], target: 5 },
  { id: 188, habit: "Exercise 3 Days", participant: "Taylor", weekStart: "2025-11-10", daysCompleted: [0, 2, 4], target: 3 },
  { id: 189, habit: "Lock up 1 Assignment Contract", participant: "Taylor", weekStart: "2025-11-10", daysCompleted: [], target: 1 },
  { id: 190, habit: "Wake up at 5:30am", participant: "Taylor", weekStart: "2025-11-10", daysCompleted: [0, 1, 3, 4], target: 4 },
  { id: 191, habit: "30 Minutes of Reading Per Day", participant: "Taylor", weekStart: "2025-11-10", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 192, habit: "Eat Lean Meals", participant: "Taylor", weekStart: "2025-11-10", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 193, habit: "Meet in Person with 1 Client", participant: "Taylor", weekStart: "2025-11-10", daysCompleted: [2], target: 1 },
  { id: 194, habit: "Write Daily Goals", participant: "Taylor", weekStart: "2025-11-10", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 195, habit: "Track Grady's KPI's", participant: "Taylor", weekStart: "2025-11-10", daysCompleted: [0, 2, 4], target: 3 },
  { id: 196, habit: "Learn 1 New Prayer", participant: "Taylor", weekStart: "2025-11-10", daysCompleted: [], target: 1 },
  { id: 197, habit: "File Taxes for 2023", participant: "Taylor", weekStart: "2025-11-10", daysCompleted: [], target: 1 },
  { id: 198, habit: "Workout 4 times", participant: "Brandon", weekStart: "2025-11-17", daysCompleted: [0, 1, 3, 4], target: 4 },
  { id: 199, habit: "Meditate 5 days a week", participant: "Brandon", weekStart: "2025-11-17", daysCompleted: [0, 1, 2, 3, 4, 5], target: 5 },
  { id: 200, habit: "execute trades", participant: "Brandon", weekStart: "2025-11-17", daysCompleted: [], target: 1 },
  { id: 201, habit: "no cutting trades", participant: "Brandon", weekStart: "2025-11-17", daysCompleted: [], target: 1 },
  { id: 202, habit: "Text the group each trade", participant: "Brandon", weekStart: "2025-11-17", daysCompleted: [0, 2, 4], target: 1 },
  { id: 203, habit: "Real-Time Journaling", participant: "Brandon", weekStart: "2025-11-17", daysCompleted: [], target: 1 },
  { id: 204, habit: "end of day review", participant: "Brandon", weekStart: "2025-11-17", daysCompleted: [0, 1, 2, 3, 4], target: 4 },
  { id: 205, habit: "Read one chapter", participant: "Brandon", weekStart: "2025-11-17", daysCompleted: [0, 1, 2, 3, 4, 5], target: 5 },
  { id: 206, habit: "no social media in the morning", participant: "Brandon", weekStart: "2025-11-17", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 207, habit: "Exercise 3 Days", participant: "Taylor", weekStart: "2025-11-17", daysCompleted: [0, 1, 3, 4], target: 3 },
  { id: 208, habit: "Lock up 1 Assignment Contract", participant: "Taylor", weekStart: "2025-11-17", daysCompleted: [], target: 1 },
  { id: 209, habit: "Wake up at 5:30am", participant: "Taylor", weekStart: "2025-11-17", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 210, habit: "30 Minutes of Reading Per Day", participant: "Taylor", weekStart: "2025-11-17", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 211, habit: "Eat Lean Meals", participant: "Taylor", weekStart: "2025-11-17", daysCompleted: [0, 1, 2, 3, 4, 5], target: 5 },
  { id: 212, habit: "Meet in Person with 2 Clients", participant: "Taylor", weekStart: "2025-11-17", daysCompleted: [0, 2, 4], target: 2 },
  { id: 213, habit: "Write Daily Goals", participant: "Taylor", weekStart: "2025-11-17", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 214, habit: "Learn 1 New Prayer", participant: "Taylor", weekStart: "2025-11-17", daysCompleted: [], target: 1 },
  { id: 215, habit: "File Taxes for 2023", participant: "Taylor", weekStart: "2025-11-17", daysCompleted: [], target: 1 },
  { id: 216, habit: "No phone until after written goals", participant: "Taylor", weekStart: "2025-11-17", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 217, habit: "Write long term goals", participant: "John", weekStart: "2025-11-17", daysCompleted: [0, 1, 2, 3, 4, 5, 6], target: 3 },
  { id: 218, habit: "Code on app 10 minutes", participant: "John", weekStart: "2025-11-17", daysCompleted: [0, 1, 2, 3, 4, 5], target: 4 },
  { id: 219, habit: "Get 1 no for branches", participant: "John", weekStart: "2025-11-17", daysCompleted: [], target: 1 },
  { id: 220, habit: "Long term vision doc", participant: "John", weekStart: "2025-11-17", daysCompleted: [2], target: 1 },
  { id: 221, habit: "call/hang with 1 friend/fam", participant: "John", weekStart: "2025-11-17", daysCompleted: [0, 1, 2, 3, 4, 5, 6], target: 6 },
  { id: 222, habit: "in bed reading by 9:45pm", participant: "John", weekStart: "2025-11-17", daysCompleted: [1, 4], target: 3 },
  { id: 223, habit: "Do each day's PT", participant: "John", weekStart: "2025-11-17", daysCompleted: [0, 1, 2, 3, 4, 5], target: 4 },
  { id: 224, habit: "lunch and dinner ready", participant: "John", weekStart: "2025-11-17", daysCompleted: [0, 1, 2, 3, 4, 5], target: 3 },
  { id: 225, habit: "do food journal", participant: "John", weekStart: "2025-11-17", daysCompleted: [0, 1, 2, 3, 4], target: 3 },
  { id: 226, habit: "<30min social media before 5pm", participant: "John", weekStart: "2025-11-17", daysCompleted: [1, 4], target: 3 },
  { id: 227, habit: "meditate 20 min", participant: "John", weekStart: "2025-11-17", daysCompleted: [0, 1, 3, 4], target: 4 },
  { id: 228, habit: "Workout 3 times", participant: "Brandon", weekStart: "2025-11-24", daysCompleted: [2], target: 3 },
  { id: 229, habit: "Meditate 4 days a week", participant: "Brandon", weekStart: "2025-11-24", daysCompleted: [2], target: 4 },
  { id: 230, habit: "execute trades", participant: "Brandon", weekStart: "2025-11-24", daysCompleted: [2], target: 1 },
  { id: 231, habit: "no cutting trades", participant: "Brandon", weekStart: "2025-11-24", daysCompleted: [], target: 1 },
  { id: 232, habit: "Text the group each trade", participant: "Brandon", weekStart: "2025-11-24", daysCompleted: [2], target: 1 },
  { id: 233, habit: "Real-Time Journaling", participant: "Brandon", weekStart: "2025-11-24", daysCompleted: [2], target: 1 },
  { id: 234, habit: "end of day review", participant: "Brandon", weekStart: "2025-11-24", daysCompleted: [], target: 3 },
  { id: 235, habit: "Read one chapter", participant: "Brandon", weekStart: "2025-11-24", daysCompleted: [2], target: 5 },
  { id: 236, habit: "no social media in the morning", participant: "Brandon", weekStart: "2025-11-24", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 237, habit: "handwrite goals", participant: "John", weekStart: "2025-11-24", daysCompleted: [0, 1, 3, 4], target: 4 },
  { id: 238, habit: "Code on app 10 minutes", participant: "John", weekStart: "2025-11-24", daysCompleted: [2], target: 5 },
  { id: 239, habit: "call/hang with 1 friend/fam", participant: "John", weekStart: "2025-11-24", daysCompleted: [0, 1, 2, 3, 4], target: 6 },
  { id: 240, habit: "in bed reading by 9:45pm", participant: "John", weekStart: "2025-11-24", daysCompleted: [], target: 2 },
  { id: 241, habit: "Do each day's PT", participant: "John", weekStart: "2025-11-24", daysCompleted: [0, 2, 4], target: 5 },
  { id: 242, habit: "lunch and dinner ready", participant: "John", weekStart: "2025-11-24", daysCompleted: [0, 1, 3, 4], target: 5 },
  { id: 243, habit: "do food journal", participant: "John", weekStart: "2025-11-24", daysCompleted: [0, 1, 3, 4], target: 5 },
  { id: 244, habit: "<30min social media before 5pm", participant: "John", weekStart: "2025-11-24", daysCompleted: [], target: 2 },
  { id: 245, habit: "meditate 20 min", participant: "John", weekStart: "2025-11-24", daysCompleted: [0, 1, 3, 4], target: 4 },
  { id: 246, habit: "track # of times looking", participant: "John", weekStart: "2025-11-24", daysCompleted: [1, 4], target: 3 },
  { id: 247, habit: "Exercise", participant: "Taylor", weekStart: "2025-11-24", daysCompleted: [0, 1, 3, 4], target: 4 },
  { id: 248, habit: "Lock up a Contract", participant: "Taylor", weekStart: "2025-11-24", daysCompleted: [1, 4], target: 1 },
  { id: 249, habit: "Wake up at 5am", participant: "Taylor", weekStart: "2025-11-24", daysCompleted: [], target: 5 },
  { id: 250, habit: "30 Minutes of Reading Per Day", participant: "Taylor", weekStart: "2025-11-24", daysCompleted: [], target: 5 },
  { id: 251, habit: "Eat Lean Meals", participant: "Taylor", weekStart: "2025-11-24", daysCompleted: [0, 2, 4], target: 5 },
  { id: 252, habit: "Meet in Person with Clients", participant: "Taylor", weekStart: "2025-11-24", daysCompleted: [0, 2, 4], target: 2 },
  { id: 253, habit: "Get out of the house after work", participant: "Taylor", weekStart: "2025-11-24", daysCompleted: [0, 1, 3, 4], target: 3 },
  { id: 254, habit: "Learn New Prayer", participant: "Taylor", weekStart: "2025-11-24", daysCompleted: [2], target: 1 },
  { id: 255, habit: "File Taxes for 2023", participant: "Taylor", weekStart: "2025-11-24", daysCompleted: [], target: 1 },
  { id: 256, habit: "No phone until after written goals", participant: "Taylor", weekStart: "2025-11-24", daysCompleted: [], target: 5 },
  { id: 257, habit: "Exercise", participant: "Taylor", weekStart: "2025-12-01", daysCompleted: [0, 1, 3, 4], target: 4 },
  { id: 258, habit: "Lock up Contracts", participant: "Taylor", weekStart: "2025-12-01", daysCompleted: [1, 4], target: 2 },
  { id: 259, habit: "Wake up at 5am", participant: "Taylor", weekStart: "2025-12-01", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 260, habit: "30 Minutes of Reading Per Day", participant: "Taylor", weekStart: "2025-12-01", daysCompleted: [1, 4], target: 5 },
  { id: 261, habit: "Eat Lean Meals (no fast food)", participant: "Taylor", weekStart: "2025-12-01", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 262, habit: "Meet in Person with Clients", participant: "Taylor", weekStart: "2025-12-01", daysCompleted: [1, 4], target: 2 },
  { id: 263, habit: "Complete Results Driven Course", participant: "Taylor", weekStart: "2025-12-01", daysCompleted: [], target: 1 },
  { id: 264, habit: "Reanalyze Quickbooks", participant: "Taylor", weekStart: "2025-12-01", daysCompleted: [1, 4], target: 1 },
  { id: 265, habit: "No social media until 5pm", participant: "Taylor", weekStart: "2025-12-01", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 266, habit: "Workout 3 times", participant: "Brandon", weekStart: "2025-12-01", daysCompleted: [1, 4], target: 3 },
  { id: 267, habit: "Meditate 5 days a week", participant: "Brandon", weekStart: "2025-12-01", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 268, habit: "execute trades", participant: "Brandon", weekStart: "2025-12-01", daysCompleted: [], target: 1 },
  { id: 269, habit: "no cutting trades", participant: "Brandon", weekStart: "2025-12-01", daysCompleted: [], target: 1 },
  { id: 270, habit: "Text the group each trade", participant: "Brandon", weekStart: "2025-12-01", daysCompleted: [2], target: 1 },
  { id: 271, habit: "Real-Time Journaling", participant: "Brandon", weekStart: "2025-12-01", daysCompleted: [], target: 1 },
  { id: 272, habit: "end of day review", participant: "Brandon", weekStart: "2025-12-01", daysCompleted: [0, 1, 3, 4], target: 5 },
  { id: 273, habit: "Read one chapter", participant: "Brandon", weekStart: "2025-12-01", daysCompleted: [0, 2, 4], target: 5 },
  { id: 274, habit: "no social media in the morning", participant: "Brandon", weekStart: "2025-12-01", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 275, habit: "Hide phone 2 hours", participant: "John", weekStart: "2025-12-01", daysCompleted: [2], target: 1 },
  { id: 276, habit: "Hide phone 2 hours", participant: "John", weekStart: "2025-12-08", daysCompleted: [0, 1, 2, 3, 4, 5], target: 5 },
  { id: 277, habit: "Do each day's PT", participant: "John", weekStart: "2025-12-08", daysCompleted: [1, 4], target: 3 },
  { id: 278, habit: "lunch and dinner ready", participant: "John", weekStart: "2025-12-08", daysCompleted: [0, 1, 3, 4], target: 3 },
  { id: 279, habit: "do food journal", participant: "John", weekStart: "2025-12-08", daysCompleted: [1, 4], target: 2 },
  { id: 280, habit: "meditate 20 min", participant: "John", weekStart: "2025-12-08", daysCompleted: [0, 2, 4], target: 4 },
  { id: 281, habit: "in bed reading by 9:45pm", participant: "John", weekStart: "2025-12-08", daysCompleted: [2], target: 2 },
  { id: 282, habit: "handwrite goals", participant: "John", weekStart: "2025-12-08", daysCompleted: [0, 1, 2, 3, 4, 5, 6], target: 6 },
  { id: 283, habit: "call/hang with 1 friend/fam", participant: "John", weekStart: "2025-12-08", daysCompleted: [0, 1, 2, 3, 4, 5], target: 5 },
  { id: 284, habit: "Reach out to contact", participant: "John", weekStart: "2025-12-08", daysCompleted: [2], target: 1 },
  { id: 285, habit: "Work on accountability tracker", participant: "John", weekStart: "2025-12-08", daysCompleted: [], target: 1 },
  { id: 286, habit: "Exercise", participant: "Taylor", weekStart: "2025-12-08", daysCompleted: [0, 1, 3, 4], target: 4 },
  { id: 287, habit: "Lock up Contracts / Close Deals", participant: "Taylor", weekStart: "2025-12-08", daysCompleted: [1, 4], target: 2 },
  { id: 288, habit: "Wake up at 5am", participant: "Taylor", weekStart: "2025-12-08", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 289, habit: "30 Minutes of Reading Per Day", participant: "Taylor", weekStart: "2025-12-08", daysCompleted: [2], target: 3 },
  { id: 290, habit: "Eat Lean Meals (No eating out)", participant: "Taylor", weekStart: "2025-12-08", daysCompleted: [0, 1, 2, 3, 4, 5], target: 6 },
  { id: 291, habit: "Meet in Person with Clients", participant: "Taylor", weekStart: "2025-12-08", daysCompleted: [0, 2, 4], target: 2 },
  { id: 292, habit: "Complete Results Driven Course", participant: "Taylor", weekStart: "2025-12-08", daysCompleted: [1, 4], target: 1 },
  { id: 293, habit: "Reanalyze Quickbooks", participant: "Taylor", weekStart: "2025-12-08", daysCompleted: [2], target: 1 },
  { id: 294, habit: "No social media until 5pm", participant: "Taylor", weekStart: "2025-12-08", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 295, habit: "Workout 3 times", participant: "Brandon", weekStart: "2025-12-08", daysCompleted: [0, 2, 4], target: 3 },
  { id: 296, habit: "Meditate 5 days a week", participant: "Brandon", weekStart: "2025-12-08", daysCompleted: [0, 1, 2, 3, 4], target: 5 },
  { id: 297, habit: "execute trades", participant: "Brandon", weekStart: "2025-12-08", daysCompleted: [], target: 1 },
  { id: 298, habit: "no cutting trades", participant: "Brandon", weekStart: "2025-12-08", daysCompleted: [], target: 1 },
  { id: 299, habit: "Text the group each trade", participant: "Brandon", weekStart: "2025-12-08", daysCompleted: [2], target: 1 },
  { id: 300, habit: "Real-Time Journaling", participant: "Brandon", weekStart: "2025-12-08", daysCompleted: [], target: 1 },
  { id: 301, habit: "end of day review", participant: "Brandon", weekStart: "2025-12-08", daysCompleted: [0, 2, 4], target: 3 },
  { id: 302, habit: "Read one chapter", participant: "Brandon", weekStart: "2025-12-08", daysCompleted: [2], target: 4 },
  { id: 303, habit: "start timer when doing PT", participant: "John", weekStart: "2025-12-15", daysCompleted: [], target: 1 },
  { id: 304, habit: "Hide phone 2 hours", participant: "John", weekStart: "2025-12-15", daysCompleted: [], target: 5 },
  { id: 305, habit: "Do each day's PT", participant: "John", weekStart: "2025-12-15", daysCompleted: [], target: 1 },
  { id: 306, habit: "lunch and dinner ready", participant: "John", weekStart: "2025-12-15", daysCompleted: [], target: 3 },
  { id: 307, habit: "do food journal", participant: "John", weekStart: "2025-12-15", daysCompleted: [], target: 2 },
  { id: 308, habit: "meditate 20 min", participant: "John", weekStart: "2025-12-15", daysCompleted: [], target: 3 },
  { id: 309, habit: "in bed reading by 9:45pm", participant: "John", weekStart: "2025-12-15", daysCompleted: [], target: 1 },
  { id: 310, habit: "handwrite goals", participant: "John", weekStart: "2025-12-15", daysCompleted: [], target: 6 },
  { id: 311, habit: "call/hang with 1 friend/fam", participant: "John", weekStart: "2025-12-15", daysCompleted: [], target: 5 },
  { id: 312, habit: "Take gut bacteria test", participant: "John", weekStart: "2025-12-15", daysCompleted: [], target: 1 },
  { id: 313, habit: "Rehearse presentation 3 times", participant: "John", weekStart: "2025-12-15", daysCompleted: [], target: 3 },
  { id: 314, habit: "Exercise", participant: "Taylor", weekStart: "2025-12-15", daysCompleted: [], target: 4 },
  { id: 315, habit: "Lock up Contracts / Close Deals", participant: "Taylor", weekStart: "2025-12-15", daysCompleted: [], target: 2 },
  { id: 316, habit: "Wake up at 5am", participant: "Taylor", weekStart: "2025-12-15", daysCompleted: [], target: 3 },
  { id: 317, habit: "30 Minutes of Reading Per Day", participant: "Taylor", weekStart: "2025-12-15", daysCompleted: [], target: 2 },
  { id: 318, habit: "Eat Lean Meals (No eating out)", participant: "Taylor", weekStart: "2025-12-15", daysCompleted: [], target: 4 },
  { id: 319, habit: "One on One Call with Grady", participant: "Taylor", weekStart: "2025-12-15", daysCompleted: [], target: 1 },
  { id: 320, habit: "Reanalyze Quickbooks", participant: "Taylor", weekStart: "2025-12-15", daysCompleted: [], target: 1 },
  { id: 321, habit: "No social media until 5pm", participant: "Taylor", weekStart: "2025-12-15", daysCompleted: [], target: 3 },
  { id: 322, habit: "Workout", participant: "Brandon", weekStart: "2025-12-15", daysCompleted: [0, 2, 4], target: 3 },
  { id: 323, habit: "Meditate 5 days a week", participant: "Brandon", weekStart: "2025-12-15", daysCompleted: [1, 4], target: 5 },
  { id: 324, habit: "execute trades", participant: "Brandon", weekStart: "2025-12-15", daysCompleted: [], target: 1 },
  { id: 325, habit: "no cutting trades", participant: "Brandon", weekStart: "2025-12-15", daysCompleted: [2], target: 1 },
  { id: 326, habit: "Text the group each trade", participant: "Brandon", weekStart: "2025-12-15", daysCompleted: [2], target: 1 },
  { id: 327, habit: "Real-Time Journal every trade", participant: "Brandon", weekStart: "2025-12-15", daysCompleted: [], target: 1 },
  { id: 328, habit: "end of day review", participant: "Brandon", weekStart: "2025-12-15", daysCompleted: [0, 2, 4], target: 3 },
  { id: 329, habit: "Read one chapter", participant: "Brandon", weekStart: "2025-12-15", daysCompleted: [0, 2, 4], target: 2 },
  { id: 330, habit: "Look for 1 swing trade to place", participant: "Brandon", weekStart: "2025-12-15", daysCompleted: [1, 4], target: 1 },
];

// Helper functions
const formatWeekString = (weekStr) => new Date(weekStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const getStatus = (h) => { const c = h.daysCompleted.length, t = h.target; return c > t ? 'Exceeded' : c >= t ? 'Done' : c >= t * 0.75 ? 'On Track' : c >= t * 0.5 ? 'At Risk' : 'Missed'; };
const getWeekStartFromDate = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
};

// Components
const Sidebar = ({ activeView, setActiveView, user, onSignOut }) => (
  <div className="w-56 bg-white border-r border-gray-100 min-h-screen p-4 flex flex-col">
    <div className="flex items-center gap-2 mb-6">
      <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center"><Target className="w-5 h-5 text-white" /></div>
      <span className="text-lg font-bold text-gray-800">Tracker</span>
    </div>
    <nav className="flex-1 space-y-1">
      {[{ id: 'dashboard', icon: Home, label: 'Dashboard' }, { id: 'tracker', icon: Calendar, label: 'Tracker' }, { id: 'scorecard', icon: BarChart3, label: 'Scorecard' }, { id: 'add', icon: Plus, label: 'Add Habits' }].map(item => (
        <button key={item.id} onClick={() => setActiveView(item.id)} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${activeView === item.id ? 'bg-violet-50 text-violet-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
          <item.icon className="w-4 h-4" />{item.label}
        </button>
      ))}
    </nav>
    {user && (
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 px-2 mb-2">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
              <User className="w-4 h-4 text-violet-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user.displayName || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <button onClick={onSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
          <LogOut className="w-4 h-4" />Sign Out
        </button>
      </div>
    )}
  </div>
);

const StatCard = ({ title, value, icon: Icon, trend, trendUp, color }) => {
  const colors = { green: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', purple: 'bg-violet-50 text-violet-600', orange: 'bg-orange-50 text-orange-600' };
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}><Icon className="w-5 h-5" /></div>
        {trend && <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>{trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{trend}</div>}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-gray-500 text-sm">{title}</p>
    </div>
  );
};

const LoginScreen = ({ onSignIn, loading }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Target className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Accountability Tracker</h1>
      <p className="text-gray-500 mb-8">Sign in to track habits with your team. All changes sync in real-time.</p>
      <button
        onClick={onSignIn}
        disabled={loading}
        className="w-full bg-white border-2 border-gray-200 hover:border-violet-300 text-gray-700 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </button>
    </div>
  </div>
);

export default function AccountabilityTracker() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [selectedParticipant, setSelectedParticipant] = useState('All');
  const [scorecardRange, setScorecardRange] = useState('4weeks');
  const [newHabit, setNewHabit] = useState({ habit: '', participant: 'Taylor', target: 5 });
  const [bulkHabits, setBulkHabits] = useState('');
  const [bulkParticipant, setBulkParticipant] = useState('Taylor');
  const [bulkTarget, setBulkTarget] = useState(5);
  const [addMode, setAddMode] = useState('single');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  
  const calendarRef = useRef(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore listener
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setDataLoading(false);
      return;
    }

    const q = query(collection(db, 'habits'), orderBy('weekStart', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // First time - load initial data
        console.log('No habits found, loading initial data...');
        loadInitialData();
      } else {
        const habitsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHabits(habitsData);
        setDataLoading(false);
      }
    }, (error) => {
      console.error('Firestore error:', error);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load initial data to Firestore
  const loadInitialData = async () => {
    try {
      for (const habit of initialData) {
        await setDoc(doc(db, 'habits', `habit_${habit.id}`), habit);
      }
      console.log('Initial data loaded successfully');
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  // Sign in
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  // Sign out
  const handleSignOut = () => signOut(auth);

  // Close calendar on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  // Computed values
  const ALL_WEEKS = useMemo(() => [...new Set(habits.map(h => h.weekStart))].sort(), [habits]);
  
  useEffect(() => {
    if (ALL_WEEKS.length > 0 && currentWeekIndex === 0) {
      setCurrentWeekIndex(ALL_WEEKS.length - 1);
    }
  }, [ALL_WEEKS]);

  const currentWeek = ALL_WEEKS[currentWeekIndex] || ALL_WEEKS[ALL_WEEKS.length - 1] || '';

  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7;
    const days = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  }, [calendarMonth]);

  const weeklyTrendData = useMemo(() => ALL_WEEKS.map(week => {
    const wH = habits.filter(h => h.weekStart === week);
    const completed = wH.filter(h => ['Done', 'Exceeded'].includes(getStatus(h))).length;
    const byP = {};
    PARTICIPANTS.forEach(p => {
      const pH = wH.filter(h => h.participant === p);
      byP[p] = pH.length > 0 ? Math.round((pH.filter(h => ['Done', 'Exceeded'].includes(getStatus(h))).length / pH.length) * 100) : 0;
    });
    return { week: formatWeekString(week), rate: wH.length > 0 ? Math.round((completed / wH.length) * 100) : 0, ...byP };
  }), [habits, ALL_WEEKS]);

  const getRangeHabits = useMemo(() => {
    if (scorecardRange === 'week') return habits.filter(h => h.weekStart === currentWeek);
    if (scorecardRange === '4weeks') { const idx = ALL_WEEKS.indexOf(currentWeek); return habits.filter(h => ALL_WEEKS.slice(Math.max(0, idx - 3), idx + 1).includes(h.weekStart)); }
    if (scorecardRange === 'quarter') { const d = new Date(currentWeek + 'T00:00:00'); const qs = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1); return habits.filter(h => new Date(h.weekStart + 'T00:00:00') >= qs); }
    return habits;
  }, [habits, currentWeek, scorecardRange, ALL_WEEKS]);

  const statusDistribution = useMemo(() => Object.keys(STATUS_CONFIG).map(s => ({ name: s, value: getRangeHabits.filter(h => getStatus(h) === s).length, color: STATUS_CONFIG[s].color })).filter(d => d.value > 0), [getRangeHabits]);

  const overallStats = useMemo(() => {
    const total = getRangeHabits.length, completed = getRangeHabits.filter(h => ['Done', 'Exceeded'].includes(getStatus(h))).length;
    const exceeded = getRangeHabits.filter(h => getStatus(h) === 'Exceeded').length, missed = getRangeHabits.filter(h => getStatus(h) === 'Missed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, exceeded, missed, rate, trend: 5 };
  }, [getRangeHabits]);

  const participantData = useMemo(() => PARTICIPANTS.map(p => {
    const pH = getRangeHabits.filter(h => h.participant === p);
    const completed = pH.filter(h => ['Done', 'Exceeded'].includes(getStatus(h))).length;
    return { name: p, rate: pH.length > 0 ? Math.round((completed / pH.length) * 100) : 0, completed, total: pH.length, color: PARTICIPANT_COLORS[p] };
  }), [getRangeHabits]);

  const currentWeekHabits = useMemo(() => habits.filter(h => h.weekStart === currentWeek), [habits, currentWeek]);
  const filteredHabits = selectedParticipant === 'All' ? currentWeekHabits : currentWeekHabits.filter(h => h.participant === selectedParticipant);

  // Firestore operations
  const toggleDay = async (id, idx) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    
    const newDaysCompleted = habit.daysCompleted.includes(idx)
      ? habit.daysCompleted.filter(d => d !== idx)
      : [...habit.daysCompleted, idx].sort((a, b) => a - b);
    
    await setDoc(doc(db, 'habits', id), { ...habit, daysCompleted: newDaysCompleted });
  };

  const addHabit = async () => {
    if (!newHabit.habit) return;
    const id = `habit_${Date.now()}`;
    await setDoc(doc(db, 'habits', id), {
      id,
      ...newHabit,
      weekStart: currentWeek,
      daysCompleted: [],
      target: parseInt(newHabit.target)
    });
    setNewHabit({ habit: '', participant: 'Taylor', target: 5 });
    setActiveView('tracker');
  };

  const addBulkHabits = async () => {
    const lines = bulkHabits.split('\n').filter(l => l.trim());
    if (!lines.length) return;
    
    for (const line of lines) {
      const id = `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await setDoc(doc(db, 'habits', id), {
        id,
        habit: line.trim(),
        participant: bulkParticipant,
        weekStart: currentWeek,
        daysCompleted: [],
        target: parseInt(bulkTarget)
      });
    }
    setBulkHabits('');
    setActiveView('tracker');
  };

  const deleteHabit = async (id) => {
    await deleteDoc(doc(db, 'habits', id));
  };

  const prevWeek = () => currentWeekIndex > 0 && setCurrentWeekIndex(currentWeekIndex - 1);
  const nextWeek = () => currentWeekIndex < ALL_WEEKS.length - 1 && setCurrentWeekIndex(currentWeekIndex + 1);

  const handleCalendarDayClick = (date) => {
    if (!date) return;
    const weekStr = getWeekStartFromDate(date);
    const idx = ALL_WEEKS.indexOf(weekStr);
    if (idx !== -1) {
      setCurrentWeekIndex(idx);
      setShowCalendar(false);
    }
  };

  const rangeLabels = { week: 'This Week', '4weeks': 'Last 4 Weeks', quarter: 'Quarter', all: 'All Time' };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return <LoginScreen onSignIn={handleSignIn} loading={false} />;
  }

  // Data loading
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} onSignOut={handleSignOut} />
      <div className="flex-1 p-5 overflow-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-gray-400 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-xl font-bold text-gray-800">Hello, {user.displayName?.split(' ')[0] || 'Team'} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={calendarRef}>
              <button onClick={() => setShowCalendar(!showCalendar)} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-violet-300 text-sm transition-colors">
                <CalendarDays className="w-4 h-4 text-violet-500" />
                <span className="font-medium text-gray-700">{currentWeek ? formatWeekString(currentWeek) : 'Select week'}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
              </button>
              {showCalendar && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl p-4 shadow-xl border border-gray-200 z-50" style={{ minWidth: '300px' }}>
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setCalendarMonth(prev => { const d = new Date(prev.year, prev.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                    <span className="text-gray-800 font-semibold">{new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => setCalendarMonth(prev => { const d = new Date(prev.year, prev.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} className="text-gray-400 text-xs font-medium py-1">{d}</div>)}</div>
                  <div className="grid grid-cols-7 gap-1">{calendarDays.map((date, i) => {
                    if (!date) return <div key={i} className="w-9 h-9" />;
                    const weekStr = getWeekStartFromDate(date);
                    const hasData = ALL_WEEKS.includes(weekStr);
                    const isCurrentWeek = weekStr === currentWeek;
                    const isMonday = date.getDay() === 1;
                    return <button key={i} onClick={() => handleCalendarDayClick(date)} disabled={!hasData} className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${isCurrentWeek ? 'bg-violet-500 text-white shadow-sm' : hasData ? isMonday ? 'bg-violet-100 text-violet-700 hover:bg-violet-200' : 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}>{date.getDate()}</button>;
                  })}</div>
                  <div className="mt-3 pt-3 border-t border-gray-100"><p className="text-xs text-gray-400 text-center">Click any date to jump to that week</p></div>
                </div>
              )}
            </div>
            <button onClick={prevWeek} disabled={currentWeekIndex === 0} className="p-2 bg-white rounded-lg border border-gray-200 hover:border-violet-300 disabled:opacity-50 transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
            <button onClick={nextWeek} disabled={currentWeekIndex === ALL_WEEKS.length - 1} className="p-2 bg-white rounded-lg border border-gray-200 hover:border-violet-300 disabled:opacity-50 transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
          </div>
        </div>

        {activeView === 'dashboard' && (
          <div className="space-y-4">
            <div className="flex gap-2">{Object.entries(rangeLabels).map(([k, v]) => <button key={k} onClick={() => setScorecardRange(k)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${scorecardRange === k ? 'bg-violet-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'}`}>{v}</button>)}</div>
            <div className="grid grid-cols-4 gap-3">
              <StatCard title="Completion Rate" value={`${overallStats.rate}%`} icon={Target} trend={`+${overallStats.trend}%`} trendUp={true} color="purple" />
              <StatCard title="Total Habits" value={overallStats.total} icon={CheckCircle2} color="blue" />
              <StatCard title="Exceeded" value={overallStats.exceeded} icon={Award} color="green" />
              <StatCard title="Missed" value={overallStats.missed} icon={XCircle} color="orange" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 text-sm">Completion Trend</h3>
                  <div className="flex gap-3">{PARTICIPANTS.map(p => <div key={p} className="flex items-center gap-1 text-xs"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: PARTICIPANT_COLORS[p] }} /><span className="text-gray-500">{p}</span></div>)}</div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={weeklyTrendData.slice(-8)}>
                    <defs>{PARTICIPANTS.map(p => <linearGradient key={p} id={`g-${p}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={PARTICIPANT_COLORS[p]} stopOpacity={0.15} /><stop offset="95%" stopColor={PARTICIPANT_COLORS[p]} stopOpacity={0} /></linearGradient>)}</defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 11 }} />
                    {PARTICIPANTS.map(p => <Area key={p} type="monotone" dataKey={p} stroke={PARTICIPANT_COLORS[p]} strokeWidth={2} fill={`url(#g-${p})`} />)}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm mb-3">Status Breakdown</h3>
                <ResponsiveContainer width="100%" height={140}>
                  <RechartsPie><Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">{statusDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /></RechartsPie>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 mt-2">{statusDistribution.map(s => <div key={s.name} className="flex items-center gap-1 text-xs"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} /><span className="text-gray-500">{s.name} ({s.value})</span></div>)}</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm mb-3">Participant Performance</h3>
              <div className="space-y-2">{participantData.map(p => <div key={p.name} className="flex items-center gap-2"><div className="w-16 text-sm font-medium text-gray-700">{p.name}</div><div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${p.rate}%`, backgroundColor: p.color }} /></div><div className="w-10 text-right text-sm font-semibold" style={{ color: p.color }}>{p.rate}%</div><div className="w-16 text-right text-xs text-gray-400">{p.completed}/{p.total}</div></div>)}</div>
            </div>
          </div>
        )}

        {activeView === 'tracker' && (
          <div className="space-y-4">
            <div className="flex gap-2">{['All', ...PARTICIPANTS].map(p => <button key={p} onClick={() => setSelectedParticipant(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedParticipant === p ? 'bg-violet-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'}`}>{p === 'All' ? `All (${currentWeekHabits.length})` : `${p} (${currentWeekHabits.filter(h => h.participant === p).length})`}</button>)}</div>
            <div className="space-y-2">{filteredHabits.length === 0 ? <div className="bg-white rounded-xl p-8 text-center border border-gray-100"><p className="text-gray-400 mb-2">No habits for this week</p><button onClick={() => setActiveView('add')} className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium hover:bg-violet-600 transition-colors">Add a Habit</button></div> : filteredHabits.map(h => {
              const st = getStatus(h), cfg = STATUS_CONFIG[st];
              return <div key={h.id} className="bg-white rounded-xl p-3 border border-gray-100 hover:border-gray-200 transition-colors"><div className="flex items-center gap-3"><div className="flex-1"><div className="flex items-center gap-2 mb-0.5"><span className={`px-2 py-0.5 rounded text-xs font-medium ${cfg.bgColor} ${cfg.textColor}`}>{st}</span><span className="text-gray-400 text-xs">{h.participant}</span></div><h3 className="text-gray-800 font-medium text-sm">{h.habit}</h3><p className="text-gray-400 text-xs">{h.daysCompleted.length}/{h.target} days</p></div><div className="flex items-center gap-1">{DAYS.map((d, i) => <button key={d} onClick={() => toggleDay(h.id, i)} className={`w-7 h-7 rounded text-xs font-medium transition-colors ${h.daysCompleted.includes(i) ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>{d[0]}</button>)}<button onClick={() => deleteHabit(h.id)} className="w-7 h-7 rounded bg-red-50 text-red-400 hover:bg-red-100 ml-1 transition-colors"><Trash2 className="w-3 h-3 mx-auto" /></button></div></div></div>;
            })}</div>
          </div>
        )}

        {activeView === 'scorecard' && (
          <div className="space-y-4">
            <div className="flex gap-2">{Object.entries(rangeLabels).map(([k, v]) => <button key={k} onClick={() => setScorecardRange(k)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${scorecardRange === k ? 'bg-violet-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'}`}>{v}</button>)}</div>
            {PARTICIPANTS.map(p => {
              const pH = getRangeHabits.filter(h => h.participant === p), completed = pH.filter(h => ['Done', 'Exceeded'].includes(getStatus(h))).length, rate = pH.length > 0 ? Math.round((completed / pH.length) * 100) : 0;
              return <div key={p} className="bg-white rounded-xl p-4 border border-gray-100"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: PARTICIPANT_COLORS[p] }}>{p[0]}</div><h3 className="font-bold text-gray-800">{p}</h3></div><div className="text-right"><p className="text-xl font-bold" style={{ color: PARTICIPANT_COLORS[p] }}>{rate}%</p></div></div><div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2"><div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: PARTICIPANT_COLORS[p] }} /></div><div className="grid grid-cols-4 gap-2 text-xs"><div><p className="text-gray-400">Total</p><p className="font-semibold text-gray-800">{pH.length}</p></div><div><p className="text-gray-400">Completed</p><p className="font-semibold text-green-600">{completed}</p></div><div><p className="text-gray-400">Exceeded</p><p className="font-semibold text-emerald-600">{pH.filter(h => getStatus(h) === 'Exceeded').length}</p></div><div><p className="text-gray-400">Missed</p><p className="font-semibold text-red-500">{pH.filter(h => getStatus(h) === 'Missed').length}</p></div></div></div>;
            })}
          </div>
        )}

        {activeView === 'add' && (
          <div className="max-w-lg">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-4">Add Habits for {currentWeek ? formatWeekString(currentWeek) : 'this week'}</h2>
              <div className="flex gap-2 mb-4">{['single', 'bulk'].map(m => <button key={m} onClick={() => setAddMode(m)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${addMode === m ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{m === 'single' ? 'Single' : 'Bulk'}</button>)}</div>
              {addMode === 'single' ? (
                <div className="space-y-3">
                  <input type="text" value={newHabit.habit} onChange={(e) => setNewHabit({ ...newHabit, habit: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-300" placeholder="Habit name" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={newHabit.participant} onChange={(e) => setNewHabit({ ...newHabit, participant: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-300">{PARTICIPANTS.map(p => <option key={p} value={p}>{p}</option>)}</select>
                    <select value={newHabit.target} onChange={(e) => setNewHabit({ ...newHabit, target: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-300">{[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} days</option>)}</select>
                  </div>
                  <button onClick={addHabit} className="w-full bg-violet-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-600 transition-colors">Add Habit</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea value={bulkHabits} onChange={(e) => setBulkHabits(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm h-28 focus:outline-none focus:border-violet-300" placeholder="One habit per line..." />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={bulkParticipant} onChange={(e) => setBulkParticipant(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-300">{PARTICIPANTS.map(p => <option key={p} value={p}>{p}</option>)}</select>
                    <select value={bulkTarget} onChange={(e) => setBulkTarget(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-300">{[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} days</option>)}</select>
                  </div>
                  <button onClick={addBulkHabits} className="w-full bg-violet-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-600 transition-colors">Add {bulkHabits.split('\n').filter(l => l.trim()).length} Habits</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
