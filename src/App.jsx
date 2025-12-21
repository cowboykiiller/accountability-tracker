import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Target, Calendar, ChevronLeft, ChevronRight, Plus, Trash2, BarChart3, CalendarDays, TrendingUp, TrendingDown, Award, CheckCircle2, XCircle, Home, ChevronDown, LogOut, User, Sparkles, MessageCircle, Lightbulb, Wand2, Send, Loader2, Quote, Download, RefreshCw, Flame, Trophy, MessageSquare, Star, Crown, Medal, Heart, ThumbsUp, Zap, Camera, Image, Users, DollarSign, Swords, Gift, PartyPopper } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, AreaChart, Area } from 'recharts';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

// Brand Logo (base64 encoded)
const LOGO_BASE64 = "data:image/png;base64,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";

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
const NAV_ITEMS = [
  { id: 'dashboard', icon: Home, label: 'Home' },
  { id: 'feed', icon: Users, label: 'Feed' },
  { id: 'compete', icon: Trophy, label: 'Compete' },
  { id: 'tracker', icon: Calendar, label: 'Track' },
  { id: 'ai-coach', icon: Sparkles, label: 'Coach' }
];

// Emoji reactions
const REACTIONS = ['👍', '🔥', '💪', '🎉', '❤️', '👏'];

const Sidebar = ({ activeView, setActiveView, user, onSignOut }) => {
  const desktopLabels = { 
    'dashboard': 'Dashboard', 
    'feed': 'Community Feed',
    'compete': 'Compete',
    'tracker': 'Habit Tracker', 
    'scorecard': 'Scorecard', 
    'add': 'Add Habit', 
    'quotes': 'Quotes', 
    'ai-coach': 'AI Coach',
    'profile': 'My Profile'
  };
  const allNavItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'feed', icon: Users, label: 'Feed' },
    { id: 'compete', icon: Trophy, label: 'Compete' },
    { id: 'tracker', icon: Calendar, label: 'Track' },
    { id: 'scorecard', icon: BarChart3, label: 'Score' },
    { id: 'add', icon: Plus, label: 'Add' },
    { id: 'quotes', icon: Quote, label: 'Quotes' },
    { id: 'ai-coach', icon: Sparkles, label: 'Coach' }
  ];
  return (
  <div className="hidden md:flex w-56 bg-white border-r border-gray-100 min-h-screen p-4 flex-col">
    <div className="flex items-center gap-2 mb-6">
      <img src={LOGO_BASE64} alt="Logo" className="w-9 h-9" />
      <span className="text-lg font-bold text-[#1E3A5F]">Accountability</span>
    </div>
    <nav className="flex-1 space-y-1">
      {allNavItems.map(item => (
        <button key={item.id} onClick={() => setActiveView(item.id)} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${activeView === item.id ? 'bg-[#F5F3E8] text-[#0F2940] font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
          <item.icon className="w-4 h-4" />{desktopLabels[item.id] || item.label}
        </button>
      ))}
    </nav>
    {user && (
      <div className="pt-4 border-t border-gray-100">
        <button 
          onClick={() => setActiveView('profile')}
          className={`w-full flex items-center gap-2 px-2 mb-2 p-2 rounded-lg transition-colors ${activeView === 'profile' ? 'bg-[#F5F3E8]' : 'hover:bg-gray-50'}`}
        >
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#EBE6D3] flex items-center justify-center">
              <User className="w-4 h-4 text-[#162D4D]" />
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-gray-800 truncate">{user.displayName || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </button>
        <button onClick={onSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
          <LogOut className="w-4 h-4" />Sign Out
        </button>
      </div>
    )}
  </div>
);};

const MobileNav = ({ activeView, setActiveView }) => (
  <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-1 pt-2 pb-6 z-50 shadow-lg" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
    <div className="flex justify-around items-center">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          className={`flex flex-col items-center py-1 px-1 rounded-lg ${activeView === item.id ? 'text-[#162D4D]' : 'text-gray-400'}`}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{item.label}</span>
        </button>
      ))}
    </div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, trend, trendUp, color }) => {
  const colors = { green: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', purple: 'bg-[#F5F3E8] text-[#162D4D]', orange: 'bg-orange-50 text-orange-600' };
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

// Simple Markdown renderer
const Markdown = ({ children }) => {
  if (!children) return null;
  
  const lines = children.split('\n');
  
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        // Headers
        if (line.startsWith('### ')) return <h3 key={i} className="font-bold text-gray-800 mt-3">{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="font-bold text-gray-800 text-lg mt-4">{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="font-bold text-gray-800 text-xl mt-4">{line.slice(2)}</h1>;
        
        // Bullet points
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const content = line.slice(2);
          return <div key={i} className="flex gap-2 ml-2"><span className="text-[#1E3A5F]">•</span><span>{formatInline(content)}</span></div>;
        }
        
        // Numbered lists
        const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
        if (numberedMatch) {
          return <div key={i} className="flex gap-2 ml-2"><span className="text-[#1E3A5F] font-medium">{numberedMatch[1]}.</span><span>{formatInline(numberedMatch[2])}</span></div>;
        }
        
        // Empty lines
        if (!line.trim()) return <div key={i} className="h-2" />;
        
        // Regular paragraphs
        return <p key={i}>{formatInline(line)}</p>;
      })}
    </div>
  );
};

// Format inline markdown (bold, italic)
const formatInline = (text) => {
  const parts = [];
  let remaining = text;
  let key = 0;
  
  while (remaining) {
    // Bold **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index === 0) {
      parts.push(<strong key={key++} className="font-semibold text-gray-800">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }
    
    // Italic *text*
    const italicMatch = remaining.match(/\*(.+?)\*/);
    if (italicMatch && italicMatch.index === 0) {
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }
    
    // Find next special char or end
    const nextSpecial = remaining.search(/\*/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial > 0) {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    } else {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    }
  }
  
  return parts;
};

const LoginScreen = ({ onSignIn, loading }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
      <img src={LOGO_BASE64} alt="The Accountability Group" className="w-24 h-24 mx-auto mb-6" />
      <h1 className="text-2xl font-bold text-[#1E3A5F] mb-2">The Accountability Group</h1>
      <p className="text-gray-500 mb-8">Sign in to track habits with your team. All changes sync in real-time.</p>
      <button
        onClick={onSignIn}
        disabled={loading}
        className="w-full bg-[#1E3A5F] hover:bg-[#162D4D] text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#F5B800" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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
  
  // AI Coach state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiGoal, setAiGoal] = useState('');
  const [selectedAiParticipant, setSelectedAiParticipant] = useState('Taylor');
  
  // Quotes state
  const [quotes, setQuotes] = useState([]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  
  // Feed/Posts state
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [showComments, setShowComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  
  // Bets/Challenges state
  const [bets, setBets] = useState([]);
  const [newBet, setNewBet] = useState({ challenger: '', challenged: '', goal: '', reward: '', deadline: '' });
  const [showNewBet, setShowNewBet] = useState(false);
  const [editingBet, setEditingBet] = useState(null);
  
  // Profile state
  const [profiles, setProfiles] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ displayName: '', bio: '', linkedParticipant: '' });
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  
  // Weekly Check-ins state (legacy - now part of feed)
  const [checkIns, setCheckIns] = useState([]);
  const [checkInText, setCheckInText] = useState('');
  const [checkInWins, setCheckInWins] = useState('');
  const [checkInChallenges, setCheckInChallenges] = useState('');
  
  const calendarRef = useRef(null);
  const fileInputRef = useRef(null);
  const postTextRef = useRef(null);

  // Set favicon on mount
  useEffect(() => {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = LOGO_BASE64;
    document.getElementsByTagName('head')[0].appendChild(link);
    document.title = 'The Accountability Group';
  }, []);

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
          ...doc.data(),
          id: doc.id
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

  // Quotes Firestore listener
  useEffect(() => {
    if (!user) {
      setQuotes([]);
      return;
    }

    const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quotesData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setQuotes(quotesData);
    }, (error) => {
      console.error('Quotes error:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Check-ins Firestore listener
  useEffect(() => {
    if (!user) {
      setCheckIns([]);
      return;
    }

    const q = query(collection(db, 'checkIns'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const checkInsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setCheckIns(checkInsData);
    }, (error) => {
      console.error('Check-ins error:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Posts Firestore listener
  useEffect(() => {
    if (!user) {
      setPosts([]);
      return;
    }

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setPosts(postsData);
    }, (error) => {
      console.error('Posts error:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Bets Firestore listener
  useEffect(() => {
    if (!user) {
      setBets([]);
      return;
    }

    const q = query(collection(db, 'bets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const betsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setBets(betsData);
    }, (error) => {
      console.error('Bets error:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Profiles Firestore listener
  useEffect(() => {
    if (!user) {
      setProfiles([]);
      setUserProfile(null);
      return;
    }

    const q = query(collection(db, 'profiles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const profilesData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setProfiles(profilesData);
      
      // Find current user's profile
      const myProfile = profilesData.find(p => p.odingUserId === user.uid);
      setUserProfile(myProfile || null);
      if (myProfile) {
        setProfileForm({
          displayName: myProfile.displayName || '',
          bio: myProfile.bio || '',
          linkedParticipant: myProfile.linkedParticipant || ''
        });
      }
    }, (error) => {
      console.error('Profiles error:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Get all participants (base + any added via profiles)
  const allParticipants = useMemo(() => {
    const baseParticipants = [...PARTICIPANTS];
    profiles.forEach(p => {
      if (p.linkedParticipant && !baseParticipants.includes(p.linkedParticipant)) {
        baseParticipants.push(p.linkedParticipant);
      }
    });
    // Also add any participants from habits that aren't in the base list
    habits.forEach(h => {
      if (h.participant && !baseParticipants.includes(h.participant)) {
        baseParticipants.push(h.participant);
      }
    });
    return baseParticipants;
  }, [profiles, habits]);

  // Calculate streaks for each participant
  const calculateStreaks = useMemo(() => {
    const streaks = {};
    allParticipants.forEach(p => {
      // Group habits by week for this participant
      const participantHabits = habits.filter(h => h.participant === p);
      const weeklyData = {};
      
      participantHabits.forEach(h => {
        if (!weeklyData[h.weekStart]) weeklyData[h.weekStart] = [];
        weeklyData[h.weekStart].push(h);
      });
      
      // Sort weeks and count consecutive weeks with >70% completion
      const sortedWeeks = Object.keys(weeklyData).sort().reverse();
      let currentStreak = 0;
      
      for (const week of sortedWeeks) {
        const weekHabits = weeklyData[week];
        const totalPossible = weekHabits.reduce((sum, h) => sum + (h.target || 5), 0);
        const totalCompleted = weekHabits.reduce((sum, h) => {
          const completed = DAYS.filter(d => h.days?.[d]).length;
          return sum + completed;
        }, 0);
        
        if (totalPossible > 0 && (totalCompleted / totalPossible) >= 0.7) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      streaks[p] = currentStreak;
    });
    return streaks;
  }, [habits, allParticipants]);

  // Calculate leaderboard
  const leaderboard = useMemo(() => {
    return allParticipants.map(p => {
      const participantHabits = habits.filter(h => h.participant === p);
      const totalPossible = participantHabits.reduce((sum, h) => sum + (h.target || 5), 0);
      const totalCompleted = participantHabits.reduce((sum, h) => {
        return sum + DAYS.filter(d => h.days?.[d]).length;
      }, 0);
      const rate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
      
      return {
        name: p,
        rate,
        streak: calculateStreaks[p] || 0,
        totalCompleted,
        score: rate + (calculateStreaks[p] || 0) * 10 // Rate + streak bonus
      };
    }).sort((a, b) => b.score - a.score);
  }, [habits, calculateStreaks]);

  // Submit weekly check-in
  const submitCheckIn = async () => {
    if (!checkInWins.trim() && !checkInChallenges.trim() && !checkInText.trim()) return;
    
    const checkIn = {
      id: `checkin_${Date.now()}`,
      participant: user.displayName || 'Anonymous',
      participantPhoto: user.photoURL || null,
      weekStart: currentWeek,
      wins: checkInWins,
      challenges: checkInChallenges,
      reflection: checkInText,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'checkIns', checkIn.id), checkIn);
    setCheckInWins('');
    setCheckInChallenges('');
    setCheckInText('');
  };

  // Delete check-in
  const deleteCheckIn = async (checkInId) => {
    if (window.confirm('Delete this check-in?')) {
      await deleteDoc(doc(db, 'checkIns', checkInId));
    }
  };

  // Compress image before upload
  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Scale down if too large
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to compressed base64
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle image selection for post
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB');
        return;
      }
      
      try {
        // Compress the image
        const compressedImage = await compressImage(file, 800, 0.6);
        setNewPostImage(compressedImage);
        setPostImagePreview(compressedImage);
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Failed to process image. Please try again.');
      }
    }
  };

  // Apply text formatting
  const applyFormat = (format) => {
    const textarea = postTextRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = newPostText;
    const selectedText = text.substring(start, end);
    
    let formattedText = '';
    let cursorOffset = 0;
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        formattedText = `_${selectedText}_`;
        cursorOffset = 1;
        break;
      case 'bullet':
        formattedText = `\n• ${selectedText}`;
        cursorOffset = 3;
        break;
      default:
        return;
    }
    
    const newText = text.substring(0, start) + formattedText + text.substring(end);
    setNewPostText(newText);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      const newPos = start + cursorOffset + (selectedText ? selectedText.length + cursorOffset : 0);
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Render formatted text
  const renderFormattedText = (text) => {
    if (!text) return null;
    
    // Convert markdown-style formatting to HTML
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
    
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  // Create new post
  const createPost = async () => {
    if (!newPostText.trim() && !newPostImage) return;
    
    try {
      const post = {
        id: `post_${Date.now()}`,
        author: userProfile?.linkedParticipant || user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || null,
        authorId: user.uid,
        content: newPostText,
        image: newPostImage || null,
        reactions: {},
        comments: [],
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'posts', post.id), post);
      setNewPostText('');
      setNewPostImage(null);
      setPostImagePreview(null);
    } catch (error) {
      console.error('Error creating post:', error);
      if (error.message?.includes('bytes')) {
        alert('Image is too large. Please try a smaller image.');
      } else {
        alert('Failed to create post. Please try again.');
      }
    }
  };

  // Add reaction to post
  const addReaction = async (postId, emoji) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const reactions = { ...post.reactions };
    const userKey = user.uid;
    
    if (reactions[emoji]?.includes(userKey)) {
      // Remove reaction
      reactions[emoji] = reactions[emoji].filter(id => id !== userKey);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      // Add reaction
      if (!reactions[emoji]) reactions[emoji] = [];
      reactions[emoji].push(userKey);
    }
    
    await setDoc(doc(db, 'posts', postId), { ...post, reactions }, { merge: true });
  };

  // Add comment to post
  const addComment = async (postId) => {
    const commentText = commentTexts[postId];
    if (!commentText?.trim()) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const newComment = {
      id: `comment_${Date.now()}`,
      author: user.displayName || 'Anonymous',
      authorPhoto: user.photoURL || null,
      authorId: user.uid,
      text: commentText,
      createdAt: new Date().toISOString()
    };
    
    const comments = [...(post.comments || []), newComment];
    await setDoc(doc(db, 'posts', postId), { ...post, comments }, { merge: true });
    setCommentTexts({ ...commentTexts, [postId]: '' });
  };

  // Delete post
  const deletePost = async (postId) => {
    if (window.confirm('Delete this post?')) {
      await deleteDoc(doc(db, 'posts', postId));
    }
  };

  // Create new challenge
  const createBet = async () => {
    if (!newBet.challenged || !newBet.goal) return;
    
    const bet = {
      id: `bet_${Date.now()}`,
      challenger: userProfile?.linkedParticipant || user.displayName || 'Anonymous',
      challengerId: user.uid,
      challengerPhoto: user.photoURL,
      challenged: newBet.challenged,
      goal: newBet.goal,
      reward: newBet.reward || 'Bragging rights! 🏆',
      deadline: newBet.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending', // pending, accepted, declined, completed
      acceptedAt: null,
      completedAt: null,
      winner: null,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'bets', bet.id), bet);
    setNewBet({ challenger: '', challenged: '', goal: '', reward: '', deadline: '' });
    setShowNewBet(false);
  };

  // Update/Edit challenge
  const updateBet = async () => {
    if (!editingBet || !editingBet.goal) return;
    
    await setDoc(doc(db, 'bets', editingBet.id), {
      ...editingBet
    }, { merge: true });
    setEditingBet(null);
  };

  // Accept challenge
  const acceptBet = async (betId) => {
    const bet = bets.find(b => b.id === betId);
    if (!bet) return;
    
    await setDoc(doc(db, 'bets', betId), { 
      ...bet, 
      status: 'accepted',
      acceptedAt: new Date().toISOString()
    }, { merge: true });
  };

  // Decline challenge
  const declineBet = async (betId) => {
    const bet = bets.find(b => b.id === betId);
    if (!bet) return;
    
    await setDoc(doc(db, 'bets', betId), { 
      ...bet, 
      status: 'declined'
    }, { merge: true });
  };

  // Complete challenge (mark winner)
  const completeBet = async (betId, winnerName) => {
    const bet = bets.find(b => b.id === betId);
    if (!bet) return;
    
    await setDoc(doc(db, 'bets', betId), { 
      ...bet, 
      status: 'completed',
      winner: winnerName,
      completedAt: new Date().toISOString()
    }, { merge: true });
  };

  // Delete challenge
  const deleteBet = async (betId) => {
    if (window.confirm('Delete this challenge?')) {
      await deleteDoc(doc(db, 'bets', betId));
    }
  };

  // Save profile
  const saveProfile = async () => {
    if (!user) return;
    
    const profile = {
      odingUserId: user.uid,
      odingEmail: user.email,
      odingDisplayName: user.displayName,
      odingPhoto: user.photoURL,
      displayName: profileForm.displayName || user.displayName,
      bio: profileForm.bio || '',
      linkedParticipant: profileForm.linkedParticipant || '',
      updatedAt: new Date().toISOString()
    };
    
    const profileId = userProfile?.id || `profile_${user.uid}`;
    await setDoc(doc(db, 'profiles', profileId), profile, { merge: true });
  };

  // Add new participant
  const addNewParticipant = async () => {
    if (!newParticipantName.trim()) return;
    
    // Just set it as the linked participant - it will automatically be added to allParticipants
    setProfileForm({ ...profileForm, linkedParticipant: newParticipantName.trim() });
    setNewParticipantName('');
    setShowAddParticipant(false);
  };

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

  // AI Coach function
  const callAI = async (action, goal = '') => {
    setAiLoading(true);
    setAiResponse('');
    
    try {
      const participantHabits = selectedAiParticipant === 'All' 
        ? currentWeekHabits 
        : currentWeekHabits.filter(h => h.participant === selectedAiParticipant);
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          habits: action === 'insights' ? habits : participantHabits,
          participant: selectedAiParticipant,
          goal
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        setAiResponse(`Error: ${data.error}`);
      } else {
        setAiResponse(data.message);
      }
    } catch (error) {
      setAiResponse('Failed to connect to AI. Please try again.');
    }
    
    setAiLoading(false);
  };

  // Generate new quote
  const generateQuote = async () => {
    setQuoteLoading(true);
    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-quote',
          existingQuotes: quotes
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Quote error:', data.error);
      } else {
        // Save to Firestore
        await setDoc(doc(db, 'quotes', data.id), data);
      }
    } catch (error) {
      console.error('Failed to generate quote:', error);
    }
    setQuoteLoading(false);
  };

  // Generate PowerPoint for a quote
  // Delete a quote
  const deleteQuote = async (quoteId) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      await deleteDoc(doc(db, 'quotes', quoteId));
    }
  };

  const downloadQuotePPTX = async (quote) => {
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="pptxgen"]');
    
    if (existingScript && window.PptxGenJS) {
      generatePPTX(quote);
      return;
    }
    
    // Remove any existing failed script
    if (existingScript) {
      existingScript.remove();
    }
    
    // Dynamically load pptxgenjs from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
    script.async = true;
    
    script.onload = () => {
      // Wait for library to fully initialize
      setTimeout(() => {
        if (window.PptxGenJS) {
          generatePPTX(quote);
        } else {
          console.error('PptxGenJS not found on window after load');
          alert('PowerPoint library failed to initialize. Please refresh the page and try again.');
        }
      }, 200);
    };
    
    script.onerror = (e) => {
      console.error('Script load error:', e);
      alert('Failed to load PowerPoint library. Please check your internet connection and try again.');
    };
    
    document.head.appendChild(script);
  };

  const generatePPTX = (quote) => {
    try {
      // Create new presentation instance
      const pptx = new window.PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      pptx.title = `Weekly Quote - ${quote.author || 'Unknown'}`;
      pptx.author = 'The Accountability Group';
      
      // Slide 1: Title
      let slide1 = pptx.addSlide();
      slide1.addText('THE ACCOUNTABILITY GROUP', { 
        x: 0.5, y: 2, w: 9, h: 0.8, 
        fontSize: 32, bold: true, color: '1E3A5F',
        fontFace: 'Arial'
      });
      slide1.addShape(pptx.ShapeType.rect, { x: 0.5, y: 2.7, w: 3, h: 0.05, fill: { color: 'F5B800' } });
      
      const weekDate = quote.weekOf || quote.createdAt || new Date().toISOString();
      slide1.addText(`Week of ${new Date(weekDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, { 
        x: 0.5, y: 2.9, w: 9, h: 0.5, 
        fontSize: 18, color: '666666',
        fontFace: 'Arial'
      });
      
      // Slide 2: Quote
      let slide2 = pptx.addSlide();
      slide2.addText('Quote', { 
        x: 0.5, y: 0.5, w: 9, h: 0.6, 
        fontSize: 24, italic: true, color: '1E3A5F',
        fontFace: 'Georgia'
      });
      slide2.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1, w: 2, h: 0.05, fill: { color: 'F5B800' } });
      slide2.addText(`"${quote.quote || ''}"`, { 
        x: 0.5, y: 1.5, w: 9, h: 2, 
        fontSize: 28, color: '333333',
        fontFace: 'Georgia', valign: 'top'
      });
      slide2.addText(`— ${quote.author || 'Unknown'}`, { 
        x: 0.5, y: 3.5, w: 9, h: 0.5, 
        fontSize: 18, color: '666666',
        fontFace: 'Arial'
      });
      
      // Slide 3: About the Person
      let slide3 = pptx.addSlide();
      slide3.addText(`About ${quote.author || 'the Author'}`, { 
        x: 0.5, y: 0.5, w: 9, h: 0.6, 
        fontSize: 24, italic: true, color: '1E3A5F',
        fontFace: 'Georgia'
      });
      slide3.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1, w: 2, h: 0.05, fill: { color: 'F5B800' } });
      slide3.addText(quote.authorTitle || '', { 
        x: 0.5, y: 1.3, w: 9, h: 0.5, 
        fontSize: 18, bold: true, color: 'F5B800',
        fontFace: 'Arial'
      });
      slide3.addText(quote.authorBio || '', { 
        x: 0.5, y: 1.9, w: 9, h: 1.5, 
        fontSize: 16, color: '333333',
        fontFace: 'Arial', valign: 'top'
      });
      slide3.addText('Why This Quote Matters:', { 
        x: 0.5, y: 3.3, w: 9, h: 0.4, 
        fontSize: 16, bold: true, color: '1E3A5F',
        fontFace: 'Arial'
      });
      slide3.addText(quote.whyItMatters || '', { 
        x: 0.5, y: 3.7, w: 9, h: 1, 
        fontSize: 14, color: '666666',
        fontFace: 'Arial', valign: 'top'
      });
      
      // Slide 4: Applications
      let slide4 = pptx.addSlide();
      slide4.addText('Applying This Lesson', { 
        x: 0.5, y: 0.5, w: 9, h: 0.6, 
        fontSize: 24, italic: true, color: '1E3A5F',
        fontFace: 'Georgia'
      });
      slide4.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1, w: 2, h: 0.05, fill: { color: 'F5B800' } });
      
      slide4.addText('Personal Life:', { 
        x: 0.5, y: 1.3, w: 4, h: 0.4, 
        fontSize: 16, bold: true, color: '1E3A5F',
        fontFace: 'Arial'
      });
      // Handle both array and string formats
      const personalApp = quote.personalApplication || '';
      const personalPoints = Array.isArray(personalApp) 
        ? personalApp.slice(0, 4) 
        : (typeof personalApp === 'string' ? personalApp.split('\n').filter(p => p.trim()).slice(0, 4) : []);
      personalPoints.forEach((point, i) => {
        const pointText = typeof point === 'string' ? point.replace(/^[-•]\s*/, '') : String(point);
        slide4.addText(`• ${pointText}`, { 
          x: 0.5, y: 1.7 + (i * 0.4), w: 4, h: 0.4, 
          fontSize: 12, color: '333333',
          fontFace: 'Arial'
        });
      });
      
      slide4.addText('Business & Career:', { 
        x: 5, y: 1.3, w: 4.5, h: 0.4, 
        fontSize: 16, bold: true, color: '1E3A5F',
        fontFace: 'Arial'
      });
      // Handle both array and string formats
      const businessApp = quote.businessApplication || '';
      const businessPoints = Array.isArray(businessApp) 
        ? businessApp.slice(0, 4) 
        : (typeof businessApp === 'string' ? businessApp.split('\n').filter(p => p.trim()).slice(0, 4) : []);
      businessPoints.forEach((point, i) => {
        const pointText = typeof point === 'string' ? point.replace(/^[-•]\s*/, '') : String(point);
        slide4.addText(`• ${pointText}`, { 
          x: 5, y: 1.7 + (i * 0.4), w: 4.5, h: 0.4, 
          fontSize: 12, color: '333333',
          fontFace: 'Arial'
        });
      });
      
      // Slide 5: Closing
      let slide5 = pptx.addSlide();
      slide5.addText('Closing Thought', { 
        x: 0.5, y: 0.5, w: 9, h: 0.6, 
        fontSize: 24, italic: true, color: '1E3A5F',
        fontFace: 'Georgia'
      });
      slide5.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1, w: 2, h: 0.05, fill: { color: 'F5B800' } });
      slide5.addText(quote.closingThought || '', { 
        x: 0.5, y: 1.5, w: 9, h: 2, 
        fontSize: 20, color: '333333',
        fontFace: 'Georgia', valign: 'top'
      });
      slide5.addText('THE ACCOUNTABILITY GROUP', { 
        x: 0.5, y: 4.5, w: 9, h: 0.5, 
        fontSize: 14, color: '999999',
        fontFace: 'Arial'
      });
      
      // Generate filename
      const authorName = (quote.author || 'Quote').replace(/[^a-zA-Z0-9]/g, '_');
      const weekStr = quote.weekOf || new Date().toISOString().split('T')[0];
      
      // Download
      pptx.writeFile({ fileName: `Quote_${authorName}_${weekStr}.pptx` })
        .then(() => {
          console.log('PowerPoint generated successfully');
        })
        .catch(err => {
          console.error('Write file error:', err);
          alert('Failed to save PowerPoint file. Please try again.');
        });
        
    } catch (error) {
      console.error('PowerPoint generation error:', error);
      alert(`Failed to generate PowerPoint: ${error.message}`);
    }
  };

  // Get current week's quote
  const currentQuote = quotes.length > 0 ? quotes[0] : null;

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
          <div className="w-12 h-12 border-4 border-[#F5B800] border-t-[#1E3A5F] rounded-full animate-spin mx-auto mb-4"></div>
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
          <div className="w-12 h-12 border-4 border-[#F5B800] border-t-[#1E3A5F] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} onSignOut={handleSignOut} />
      <div className="flex-1 p-3 md:p-5 overflow-auto pb-32 md:pb-5">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src={LOGO_BASE64} alt="Logo" className="w-8 h-8" />
            <span className="font-bold text-[#1E3A5F]">Accountability</span>
          </div>
          {user?.photoURL && <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />}
        </div>
        
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-gray-400 text-xs md:text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-lg md:text-xl font-bold text-gray-800">Hello, {user.displayName?.split(' ')[0] || 'Team'} 👋</h1>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div className="relative" ref={calendarRef}>
              <button onClick={() => setShowCalendar(!showCalendar)} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-[#F5B800] text-sm transition-colors">
                <CalendarDays className="w-4 h-4 text-[#1E3A5F]" />
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
                    return <button key={i} onClick={() => handleCalendarDayClick(date)} disabled={!hasData} className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${isCurrentWeek ? 'bg-[#1E3A5F] text-white shadow-sm' : hasData ? isMonday ? 'bg-[#EBE6D3] text-[#0F2940] hover:bg-[#F5B800]' : 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}>{date.getDate()}</button>;
                  })}</div>
                  <div className="mt-3 pt-3 border-t border-gray-100"><p className="text-xs text-gray-400 text-center">Click any date to jump to that week</p></div>
                </div>
              )}
            </div>
            <button onClick={prevWeek} disabled={currentWeekIndex === 0} className="p-2 bg-white rounded-lg border border-gray-200 hover:border-[#F5B800] disabled:opacity-50 transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
            <button onClick={nextWeek} disabled={currentWeekIndex === ALL_WEEKS.length - 1} className="p-2 bg-white rounded-lg border border-gray-200 hover:border-[#F5B800] disabled:opacity-50 transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
          </div>
        </div>

        {activeView === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main content - left 3 columns */}
            <div className="lg:col-span-3 space-y-4">
              {/* Quote of the Week - compact */}
              {currentQuote && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Quote className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">Quote of the Week</span>
                  </div>
                  <blockquote className="text-sm md:text-base font-medium text-gray-800 italic">"{currentQuote.quote}"</blockquote>
                  <p className="text-xs text-gray-600 mt-1">— {currentQuote.author}</p>
                </div>
              )}
              
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <Target className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-green-600">+{overallStats.trend}%</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800 mt-1">{overallStats.rate}%</p>
                  <p className="text-xs text-gray-500">Completion</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <p className="text-xl font-bold text-gray-800 mt-1">{overallStats.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <Award className="w-4 h-4 text-green-500" />
                  <p className="text-xl font-bold text-gray-800 mt-1">{overallStats.exceeded}</p>
                  <p className="text-xs text-gray-500">Exceeded</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <p className="text-xl font-bold text-gray-800 mt-1">{overallStats.missed}</p>
                  <p className="text-xs text-gray-500">Missed</p>
                </div>
              </div>
              
              {/* Chart and breakdown side by side */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-white rounded-xl p-4 border border-gray-100">
                  <h3 className="font-semibold text-gray-800 text-sm mb-2">Completion Trend</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={weeklyTrendData.slice(-8)}>
                      <defs>{PARTICIPANTS.map(p => <linearGradient key={p} id={`g-${p}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={PARTICIPANT_COLORS[p]} stopOpacity={0.15} /><stop offset="95%" stopColor={PARTICIPANT_COLORS[p]} stopOpacity={0} /></linearGradient>)}</defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 10 }} />
                      {PARTICIPANTS.map(p => <Area key={p} type="monotone" dataKey={p} stroke={PARTICIPANT_COLORS[p]} strokeWidth={2} fill={`url(#g-${p})`} />)}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <h3 className="font-semibold text-gray-800 text-sm mb-2">Status</h3>
                  <ResponsiveContainer width="100%" height={100}>
                    <RechartsPie><Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={3} dataKey="value">{statusDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></RechartsPie>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-1 mt-1">{statusDistribution.slice(0,3).map(s => <span key={s.name} className="text-[10px] text-gray-500">{s.name}:{s.value}</span>)}</div>
                </div>
              </div>
              
              {/* Participant Performance - compact */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm mb-3">Performance</h3>
                <div className="space-y-2">{participantData.map(p => <div key={p.name} className="flex items-center gap-2"><div className="w-14 text-xs font-medium text-gray-700">{p.name}</div><div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p.rate}%`, backgroundColor: p.color }} /></div><div className="w-8 text-right text-xs font-semibold" style={{ color: p.color }}>{p.rate}%</div></div>)}</div>
              </div>
              
              {/* Recent Activity */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 text-sm">Recent Activity</h3>
                  <button onClick={() => setActiveView('feed')} className="text-xs text-[#1E3A5F] hover:underline">View all →</button>
                </div>
                {posts.slice(0, 2).map(post => (
                  <div key={post.id} className="flex gap-2 p-2 bg-gray-50 rounded-lg mb-2">
                    {post.authorPhoto ? <img src={post.authorPhoto} className="w-6 h-6 rounded-full" alt="" /> : <div className="w-6 h-6 rounded-full bg-[#1E3A5F] text-white text-xs flex items-center justify-center">{post.author?.[0]}</div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800">{post.author}</p>
                      <p className="text-xs text-gray-600 truncate">{post.content}</p>
                    </div>
                  </div>
                ))}
                {posts.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No posts yet</p>}
              </div>
            </div>
            
            {/* Right sidebar - Leaderboard & Streaks */}
            <div className="space-y-4">
              {/* Leaderboard */}
              <div className="bg-gradient-to-br from-[#1E3A5F] to-[#0F2940] rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-[#F5B800]" />
                  <h3 className="font-semibold text-sm">Leaderboard</h3>
                </div>
                <div className="space-y-2">
                  {leaderboard.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${i === 0 ? 'bg-[#F5B800] text-[#1E3A5F]' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-600 text-white' : 'bg-white/20'}`}>
                        {i === 0 ? '👑' : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{p.name}</p>
                      </div>
                      <p className="text-sm font-bold text-[#F5B800]">{p.score}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveView('compete')} className="w-full mt-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors">
                  View Challenges →
                </button>
              </div>
              
              {/* Streaks - compact */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <h3 className="font-semibold text-gray-800 text-sm">Streaks</h3>
                </div>
                <div className="space-y-2">
                  {PARTICIPANTS.map(p => (
                    <div key={p} className="flex items-center gap-2">
                      <span className="text-sm">🔥</span>
                      <span className="flex-1 text-xs text-gray-700">{p}</span>
                      <span className="text-sm font-bold text-orange-500">{calculateStreaks[p] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Active Bets Preview */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Swords className="w-4 h-4 text-purple-500" />
                  <h3 className="font-semibold text-gray-800 text-sm">Active Bets</h3>
                </div>
                {bets.filter(b => b.status === 'accepted').slice(0, 2).map(bet => (
                  <div key={bet.id} className="p-2 bg-purple-50 rounded-lg mb-2">
                    <p className="text-xs font-medium text-purple-800">{bet.challenger} vs {bet.challenged}</p>
                    <p className="text-[10px] text-purple-600">${bet.amount} - {bet.goal}</p>
                  </div>
                ))}
                {bets.filter(b => b.status === 'accepted').length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">No active bets</p>
                )}
                <button onClick={() => setActiveView('compete')} className="w-full mt-2 py-1.5 bg-purple-100 hover:bg-purple-200 rounded-lg text-xs font-medium text-purple-700 transition-colors">
                  Create Challenge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FEED VIEW */}
        {activeView === 'feed' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Create Post */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex gap-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} className="w-10 h-10 rounded-full" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center font-medium">
                    {user?.displayName?.[0] || '?'}
                  </div>
                )}
                <div className="flex-1">
                  {/* Formatting Toolbar */}
                  <div className="flex gap-1 mb-2">
                    <button 
                      onClick={() => applyFormat('bold')}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-600"
                      title="Bold"
                    >
                      B
                    </button>
                    <button 
                      onClick={() => applyFormat('italic')}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs italic text-gray-600"
                      title="Italic"
                    >
                      I
                    </button>
                    <button 
                      onClick={() => applyFormat('bullet')}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-600"
                      title="Bullet Point"
                    >
                      • List
                    </button>
                    <span className="text-xs text-gray-400 ml-2 self-center">Select text then click to format</span>
                  </div>
                  <textarea
                    ref={postTextRef}
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder="Share an update, win, or challenge... Use **bold** or _italic_"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F5B800] resize-none"
                    rows={3}
                  />
                  {postImagePreview && (
                    <div className="relative mt-2">
                      <img src={postImagePreview} alt="Preview" className="max-h-48 rounded-lg" />
                      <button 
                        onClick={() => { setNewPostImage(null); setPostImagePreview(null); }}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full text-white flex items-center justify-center"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-600 transition-colors"
                      >
                        <Image className="w-4 h-4" />
                        Photo
                      </button>
                    </div>
                    <button 
                      onClick={createPost}
                      disabled={!newPostText.trim() && !newPostImage}
                      className="px-4 py-1.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#162D4D] transition-colors disabled:opacity-50"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Posts Feed */}
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Post Header */}
                <div className="p-4 pb-0">
                  <div className="flex items-start gap-3">
                    {post.authorPhoto ? (
                      <img src={post.authorPhoto} className="w-10 h-10 rounded-full" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center font-medium">
                        {post.author?.[0] || '?'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">{post.author}</p>
                        <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-gray-700 mt-1 whitespace-pre-wrap">{renderFormattedText(post.content)}</div>
                    </div>
                    {post.authorId === user?.uid && (
                      <button onClick={() => deletePost(post.id)} className="text-gray-300 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Post Image */}
                {post.image && (
                  <div className="mt-3">
                    <img src={post.image} alt="" className="w-full max-h-96 object-cover" />
                  </div>
                )}
                
                {/* Reactions */}
                <div className="px-4 py-3 border-t border-gray-100 mt-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    {REACTIONS.map(emoji => {
                      const count = post.reactions?.[emoji]?.length || 0;
                      const hasReacted = post.reactions?.[emoji]?.includes(user?.uid);
                      return (
                        <button
                          key={emoji}
                          onClick={() => addReaction(post.id, emoji)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${hasReacted ? 'bg-[#F5B800]/20 border border-[#F5B800]' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span className="text-xs text-gray-600">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Comments Section */}
                <div className="px-4 pb-4">
                  <button 
                    onClick={() => setShowComments({ ...showComments, [post.id]: !showComments[post.id] })}
                    className="text-xs text-gray-500 hover:text-gray-700 mb-2"
                  >
                    {post.comments?.length || 0} comments
                  </button>
                  
                  {showComments[post.id] && (
                    <div className="space-y-2">
                      {post.comments?.map(comment => (
                        <div key={comment.id} className="flex gap-2 p-2 bg-gray-50 rounded-lg">
                          {comment.authorPhoto ? (
                            <img src={comment.authorPhoto} className="w-6 h-6 rounded-full" alt="" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 text-xs flex items-center justify-center">
                              {comment.author?.[0]}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-medium text-gray-800">{comment.author}</p>
                            <p className="text-xs text-gray-600">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add Comment */}
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={commentTexts[post.id] || ''}
                          onChange={(e) => setCommentTexts({ ...commentTexts, [post.id]: e.target.value })}
                          placeholder="Write a comment..."
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#F5B800]"
                          onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                        />
                        <button 
                          onClick={() => addComment(post.id)}
                          className="px-3 py-1.5 bg-[#1E3A5F] text-white rounded-lg text-xs hover:bg-[#162D4D]"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {posts.length === 0 && (
              <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet. Be the first to share!</p>
              </div>
            )}
          </div>
        )}

        {/* COMPETE VIEW */}
        {activeView === 'compete' && (
          <div className="space-y-4">
            {/* Header with Create Challenge */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Compete & Challenge</h2>
                <p className="text-sm text-gray-500">Challenge your teammates to reach their goals!</p>
              </div>
              <button 
                onClick={() => setShowNewBet(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                <Swords className="w-4 h-4" />
                New Challenge
              </button>
            </div>
            
            {/* Leaderboard - Full */}
            <div className="bg-gradient-to-br from-[#1E3A5F] via-[#1E3A5F] to-purple-900 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#F5B800] rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-[#1E3A5F]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Season Leaderboard</h3>
                  <p className="text-white/60 text-sm">Compete for the top spot!</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leaderboard.map((p, i) => (
                  <div key={p.name} className={`relative rounded-xl p-4 ${i === 0 ? 'bg-gradient-to-br from-[#F5B800] to-amber-600 text-[#1E3A5F]' : 'bg-white/10'}`}>
                    {i === 0 && (
                      <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <Crown className="w-5 h-5 text-[#F5B800]" />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${i === 0 ? 'bg-white text-[#1E3A5F]' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-600 text-white' : 'bg-white/20'}`}>
                        {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{p.name}</p>
                        <p className={`text-sm ${i === 0 ? 'text-[#1E3A5F]/70' : 'text-white/60'}`}>{p.rate}% completion</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{p.score}</p>
                        <p className={`text-xs ${i === 0 ? 'text-[#1E3A5F]/70' : 'text-white/60'}`}>points</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Flame className={`w-4 h-4 ${i === 0 ? 'text-[#1E3A5F]' : 'text-orange-400'}`} />
                      <span className={`text-sm ${i === 0 ? 'text-[#1E3A5F]/70' : 'text-white/60'}`}>{p.streak} week streak</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Active Challenges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pending Challenges */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-500" />
                  Pending Challenges
                </h3>
                {bets.filter(b => b.status === 'pending').length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No pending challenges</p>
                ) : (
                  <div className="space-y-3">
                    {bets.filter(b => b.status === 'pending').map(bet => (
                      <div key={bet.id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Swords className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-purple-800">{bet.challenger}</span>
                            <span className="text-purple-400">vs</span>
                            <span className="font-medium text-purple-800">{bet.challenged}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {bet.challengerId === user?.uid && (
                              <>
                                <button onClick={() => setEditingBet(bet)} className="p-1 text-purple-400 hover:text-purple-600">
                                  <Wand2 className="w-3 h-3" />
                                </button>
                                <button onClick={() => deleteBet(bet.id)} className="p-1 text-purple-400 hover:text-red-500">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-purple-700 mb-1">{bet.goal}</p>
                        {bet.reward && <p className="text-xs text-purple-500 mb-1">🎁 {bet.reward}</p>}
                        <p className="text-xs text-purple-500 mb-3">Deadline: {new Date(bet.deadline).toLocaleDateString()}</p>
                        {(bet.challenged === user?.displayName || bet.challenged === userProfile?.linkedParticipant) && bet.challengerId !== user?.uid && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => acceptBet(bet.id)}
                              className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => declineBet(bet.id)}
                              className="flex-1 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Active Challenges */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Active Challenges
                </h3>
                {bets.filter(b => b.status === 'accepted').length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No active challenges</p>
                ) : (
                  <div className="space-y-3">
                    {bets.filter(b => b.status === 'accepted').map(bet => (
                      <div key={bet.id} className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⚔️</span>
                            <span className="font-medium text-gray-800">{bet.challenger}</span>
                            <span className="text-gray-400">vs</span>
                            <span className="font-medium text-gray-800">{bet.challenged}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {bet.challengerId === user?.uid && (
                              <button onClick={() => deleteBet(bet.id)} className="p-1 text-gray-400 hover:text-red-500">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{bet.goal}</p>
                        {bet.reward && <p className="text-xs text-orange-600 mb-2">🎁 {bet.reward}</p>}
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">Ends: {new Date(bet.deadline).toLocaleDateString()}</p>
                          {(bet.challengerId === user?.uid || bet.challenged === user?.displayName || bet.challenged === userProfile?.linkedParticipant) && (
                            <div className="flex gap-1">
                              <button 
                                onClick={() => completeBet(bet.id, bet.challenger)}
                                className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                              >
                                {bet.challenger} won
                              </button>
                              <button 
                                onClick={() => completeBet(bet.id, bet.challenged)}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                              >
                                {bet.challenged} won
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Completed Challenges */}
            {bets.filter(b => b.status === 'completed').length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <PartyPopper className="w-5 h-5 text-pink-500" />
                  Completed Challenges
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {bets.filter(b => b.status === 'completed').map(bet => (
                    <div key={bet.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{bet.challenger} vs {bet.challenged}</span>
                        <button onClick={() => deleteBet(bet.id)} className="p-1 text-gray-300 hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">{bet.goal}</p>
                      <p className="text-sm font-medium text-purple-600 mt-1">🏆 Winner: {bet.winner}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* New Challenge Modal */}
            {showNewBet && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Swords className="w-5 h-5 text-purple-600" />
                    Create New Challenge
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Challenge Who?</label>
                      <select 
                        value={newBet.challenged}
                        onChange={(e) => setNewBet({ ...newBet, challenged: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">Select opponent...</option>
                        {allParticipants.filter(p => p !== userProfile?.linkedParticipant && p !== user?.displayName).map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">The Challenge</label>
                      <input
                        type="text"
                        value={newBet.goal}
                        onChange={(e) => setNewBet({ ...newBet, goal: e.target.value })}
                        placeholder="e.g., Complete all habits for 2 weeks"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-600 block mb-1">Reward (optional)</label>
                        <input
                          type="text"
                          value={newBet.reward}
                          onChange={(e) => setNewBet({ ...newBet, reward: e.target.value })}
                          placeholder="Bragging rights 🏆"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 block mb-1">Deadline</label>
                        <input
                          type="date"
                          value={newBet.deadline}
                          onChange={(e) => setNewBet({ ...newBet, deadline: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={() => setShowNewBet(false)}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={createBet}
                      disabled={!newBet.challenged || !newBet.goal}
                      className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      Send Challenge
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Edit Challenge Modal */}
            {editingBet && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-600" />
                    Edit Challenge
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Challenge Who?</label>
                      <select 
                        value={editingBet.challenged}
                        onChange={(e) => setEditingBet({ ...editingBet, challenged: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      >
                        {allParticipants.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">The Challenge</label>
                      <input
                        type="text"
                        value={editingBet.goal}
                        onChange={(e) => setEditingBet({ ...editingBet, goal: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-600 block mb-1">Reward (optional)</label>
                        <input
                          type="text"
                          value={editingBet.reward || ''}
                          onChange={(e) => setEditingBet({ ...editingBet, reward: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 block mb-1">Deadline</label>
                        <input
                          type="date"
                          value={editingBet.deadline}
                          onChange={(e) => setEditingBet({ ...editingBet, deadline: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={() => setEditingBet(null)}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={updateBet}
                      disabled={!editingBet.challenged || !editingBet.goal}
                      className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'tracker' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">{['All', ...allParticipants].map(p => <button key={p} onClick={() => setSelectedParticipant(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedParticipant === p ? 'bg-[#1E3A5F] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#F5B800]'}`}>{p === 'All' ? `All (${currentWeekHabits.length})` : `${p} (${currentWeekHabits.filter(h => h.participant === p).length})`}</button>)}</div>
            <div className="space-y-2">{filteredHabits.length === 0 ? <div className="bg-white rounded-xl p-8 text-center border border-gray-100"><p className="text-gray-400 mb-2">No habits for this week</p><button onClick={() => setActiveView('add')} className="px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#162D4D] transition-colors">Add a Habit</button></div> : filteredHabits.map(h => {
              const st = getStatus(h), cfg = STATUS_CONFIG[st];
              return <div key={h.id} className="bg-white rounded-xl p-3 border border-gray-100 hover:border-gray-200 transition-colors"><div className="flex flex-col md:flex-row md:items-center gap-3"><div className="flex-1"><div className="flex items-center gap-2 mb-0.5"><span className={`px-2 py-0.5 rounded text-xs font-medium ${cfg.bgColor} ${cfg.textColor}`}>{st}</span><span className="text-gray-400 text-xs">{h.participant}</span></div><h3 className="text-gray-800 font-medium text-sm">{h.habit}</h3><p className="text-gray-400 text-xs">{h.daysCompleted.length}/{h.target} days</p></div><div className="flex items-center gap-1">{DAYS.map((d, i) => <button key={d} onClick={() => toggleDay(h.id, i)} className={`w-8 h-8 md:w-7 md:h-7 rounded text-xs font-medium transition-colors ${h.daysCompleted.includes(i) ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>{d[0]}</button>)}<button onClick={() => deleteHabit(h.id)} className="w-8 h-8 md:w-7 md:h-7 rounded bg-red-50 text-red-400 hover:bg-red-100 ml-1 transition-colors"><Trash2 className="w-3 h-3 mx-auto" /></button></div></div></div>;
            })}</div>
          </div>
        )}

        {activeView === 'scorecard' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">{Object.entries(rangeLabels).map(([k, v]) => <button key={k} onClick={() => setScorecardRange(k)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${scorecardRange === k ? 'bg-[#1E3A5F] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#F5B800]'}`}>{v}</button>)}</div>
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
              <div className="flex gap-2 mb-4">{['single', 'bulk'].map(m => <button key={m} onClick={() => setAddMode(m)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${addMode === m ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{m === 'single' ? 'Single' : 'Bulk'}</button>)}</div>
              {addMode === 'single' ? (
                <div className="space-y-3">
                  <input type="text" value={newHabit.habit} onChange={(e) => setNewHabit({ ...newHabit, habit: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F5B800]" placeholder="Habit name" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={newHabit.participant} onChange={(e) => setNewHabit({ ...newHabit, participant: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F5B800]">{allParticipants.map(p => <option key={p} value={p}>{p}</option>)}</select>
                    <select value={newHabit.target} onChange={(e) => setNewHabit({ ...newHabit, target: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F5B800]">{[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} days</option>)}</select>
                  </div>
                  <button onClick={addHabit} className="w-full bg-[#1E3A5F] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#162D4D] transition-colors">Add Habit</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea value={bulkHabits} onChange={(e) => setBulkHabits(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm h-28 focus:outline-none focus:border-[#F5B800]" placeholder="One habit per line..." />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={bulkParticipant} onChange={(e) => setBulkParticipant(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F5B800]">{allParticipants.map(p => <option key={p} value={p}>{p}</option>)}</select>
                    <select value={bulkTarget} onChange={(e) => setBulkTarget(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F5B800]">{[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} days</option>)}</select>
                  </div>
                  <button onClick={addBulkHabits} className="w-full bg-[#1E3A5F] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#162D4D] transition-colors">Add {bulkHabits.split('\n').filter(l => l.trim()).length} Habits</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'ai-coach' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0F2940] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8" />
                <h2 className="text-2xl font-bold">AI Coach</h2>
              </div>
              <p className="text-[#EBE6D3]">Get personalized insights, feedback, and habit suggestions powered by AI.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Weekly Feedback */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Weekly Coach</h3>
                    <p className="text-xs text-gray-400">Get feedback on your progress</p>
                  </div>
                </div>
                <select 
                  value={selectedAiParticipant} 
                  onChange={(e) => setSelectedAiParticipant(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
                >
                  {allParticipants.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button 
                  onClick={() => callAI('weekly-coach')}
                  disabled={aiLoading}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                  Get Feedback
                </button>
              </div>

              {/* Team Insights */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Team Insights</h3>
                    <p className="text-xs text-gray-400">Analyze patterns across everyone</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-3">Discover trends, compare progress, and find opportunities for improvement.</p>
                <button 
                  onClick={() => callAI('insights')}
                  disabled={aiLoading}
                  className="w-full bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                  Analyze Team
                </button>
              </div>

              {/* Habit Suggestions */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Habit Suggestions</h3>
                    <p className="text-xs text-gray-400">Get AI-recommended habits</p>
                  </div>
                </div>
                <input 
                  type="text"
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  placeholder="I want to get healthier..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
                />
                <button 
                  onClick={() => callAI('suggest-habits', aiGoal)}
                  disabled={aiLoading || !aiGoal.trim()}
                  className="w-full bg-amber-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Suggest Habits
                </button>
              </div>

              {/* Habit Writer */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F3E8] flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-[#162D4D]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Habit Writer</h3>
                    <p className="text-xs text-gray-400">Turn goals into trackable habits</p>
                  </div>
                </div>
                <input 
                  type="text"
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  placeholder="Read more books..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
                />
                <button 
                  onClick={() => callAI('write-habit', aiGoal)}
                  disabled={aiLoading || !aiGoal.trim()}
                  className="w-full bg-[#1E3A5F] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#162D4D] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  Write Habit
                </button>
              </div>
            </div>

            {/* AI Response */}
            {(aiResponse || aiLoading) && (
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E3A5F] to-[#0F2940] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800">AI Response</h3>
                </div>
                {aiLoading ? (
                  <div className="flex items-center gap-3 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <div className="text-gray-700 text-sm">
                    <Markdown>{aiResponse}</Markdown>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeView === 'quotes' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Inspirational Quotes</h2>
                <p className="text-sm text-gray-500">Weekly wisdom for the accountability group</p>
              </div>
              <button
                onClick={generateQuote}
                disabled={quoteLoading}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {quoteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Generate New Quote
              </button>
            </div>

            {/* Quote List */}
            {quotes.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                <Quote className="w-12 h-12 text-amber-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No quotes yet. Generate your first weekly quote!</p>
                <button
                  onClick={generateQuote}
                  disabled={quoteLoading}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {quoteLoading ? 'Generating...' : 'Generate Quote'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {quotes.map((quote, index) => (
                  <div 
                    key={quote.id} 
                    className={`bg-white rounded-xl p-4 md:p-6 border ${index === 0 ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100'}`}
                  >
                    {index === 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">Current Week</span>
                      </div>
                    )}
                    
                    <blockquote className="text-lg md:text-xl font-medium text-gray-800 mb-3 italic">
                      "{quote.quote}"
                    </blockquote>
                    
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold text-gray-800">{quote.author}</p>
                        <p className="text-sm text-amber-600">{quote.authorTitle}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(quote.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{quote.authorBio}</p>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Why It Matters</p>
                      <p className="text-sm text-gray-600">{quote.whyItMatters}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-[#F5F3E8] rounded-lg p-4">
                        <p className="text-sm font-medium text-[#0F2940] mb-2">Personal Application</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{quote.personalApplication}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-700 mb-2">Business Application</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{quote.businessApplication}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <p className="text-sm italic text-gray-500 flex-1 mr-4">"{quote.closingThought}"</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadQuotePPTX(quote)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F3E8] hover:bg-[#EBE6D3] rounded-lg text-sm text-[#1E3A5F] transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden md:inline">PowerPoint</span>
                        </button>
                        <button
                          onClick={() => deleteQuote(quote.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-sm text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE VIEW */}
        {activeView === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-[#1E3A5F] to-[#0F2940] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-4">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-20 h-20 rounded-full border-4 border-white/20" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold">{userProfile?.displayName || user?.displayName || 'Anonymous'}</h2>
                  <p className="text-white/60">{user?.email}</p>
                  {userProfile?.linkedParticipant && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-[#F5B800] text-[#1E3A5F] rounded-lg text-xs font-medium">
                        Linked to: {userProfile.linkedParticipant}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Profile Settings */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#1E3A5F]" />
                Profile Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Display Name</label>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    placeholder={user?.displayName || 'Your name'}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F5B800]"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Bio</label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F5B800] resize-none"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Link to Habit Tracker Participant</label>
                  <p className="text-xs text-gray-400 mb-2">Connect your profile to a participant to track your habits</p>
                  <div className="flex gap-2">
                    <select
                      value={profileForm.linkedParticipant}
                      onChange={(e) => setProfileForm({ ...profileForm, linkedParticipant: e.target.value })}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F5B800]"
                    >
                      <option value="">Not linked</option>
                      {allParticipants.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowAddParticipant(true)}
                      className="px-3 py-2 bg-[#F5B800] text-[#1E3A5F] rounded-lg text-sm font-medium hover:bg-[#E5AB00] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={saveProfile}
                  className="w-full py-2 bg-[#1E3A5F] text-white rounded-lg font-medium hover:bg-[#162D4D] transition-colors"
                >
                  Save Profile
                </button>
              </div>
            </div>
            
            {/* Stats Overview */}
            {userProfile?.linkedParticipant && (
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#1E3A5F]" />
                  Your Stats
                </h3>
                
                {(() => {
                  const myStats = leaderboard.find(l => l.name === userProfile.linkedParticipant);
                  const myStreak = calculateStreaks[userProfile.linkedParticipant] || 0;
                  return myStats ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-purple-50 rounded-xl">
                        <p className="text-3xl font-bold text-purple-600">{myStats.rate}%</p>
                        <p className="text-xs text-purple-500">Completion Rate</p>
                      </div>
                      <div className="text-center p-4 bg-amber-50 rounded-xl">
                        <p className="text-3xl font-bold text-amber-600">{myStats.score}</p>
                        <p className="text-xs text-amber-500">Total Points</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-xl">
                        <p className="text-3xl font-bold text-orange-600">{myStreak}</p>
                        <p className="text-xs text-orange-500">Week Streak</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No stats available yet</p>
                  );
                })()}
              </div>
            )}
            
            {/* Account Actions */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Account</h3>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
            
            {/* Add New Participant Modal */}
            {showAddParticipant && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Participant</h3>
                  <p className="text-sm text-gray-500 mb-4">Create a new participant name for the habit tracker</p>
                  
                  <input
                    type="text"
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                    placeholder="Enter participant name"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-[#F5B800]"
                  />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowAddParticipant(false); setNewParticipantName(''); }}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addNewParticipant}
                      disabled={!newParticipantName.trim()}
                      className="flex-1 py-2 bg-[#1E3A5F] text-white rounded-lg font-medium hover:bg-[#162D4D] disabled:opacity-50"
                    >
                      Add & Link
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <MobileNav activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
}
