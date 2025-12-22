import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Target, Calendar, ChevronLeft, ChevronRight, Plus, Trash2, BarChart3, CalendarDays, TrendingUp, TrendingDown, Award, CheckCircle2, XCircle, Home, ChevronDown, ChevronUp, LogOut, User, Sparkles, MessageCircle, Lightbulb, Wand2, Send, Loader2, Quote, Download, RefreshCw, Flame, Trophy, MessageSquare, Star, Crown, Medal, Heart, ThumbsUp, Zap, Camera, Image, Users, DollarSign, Swords, Gift, PartyPopper, MapPin, X, Edit3, Eye } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, AreaChart, Area } from 'recharts';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

// Brand Logo (base64 encoded)
const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGYktHRAD/AP8A/6C9p5MAAAAHdElNRQfpDBUTOzRczqziAAAUWElEQVR42u2beZRfVZXvP/uce+9vqjmpSlIhA5AwBEgqg8hsd4sBpduhm4eAQtNLHEDtttWg9kKfStvY8KTRRsQBXN3Y2jQPGUJQGVQeSvcDQlKVQOIKY0asStWvKr+q33TPOfv98YsubRKgMgDP9fuuqr+q7jl7f+93n33OPvtCE0000UQTTTTRRBNNNNFEE0000cQkIK/l5CNrpmIRSSfAO3ApOvMtQy/5zM4HZyAGEQPZqWj+yB2vKYHRqz2h3zANNc6YWm4KaucBR/iWen/Ull07+PzEyxscQ3tXVl2lvtiUo2P8mjmbMGGTzxSL4nMaHzP0h0Hg4EOzf1fh2tVexUclkVrmaCF3AcRnomE+hPtF5CdaSrHRyweEEUUrKaI6KMgVYN5EiDZGlal3g35/Ym32qYx26njZIyC6e/6Okwf//wnhen8PIdtDVC3OUtFRUSmJaEZ88pdgP4O0zAUglJ5Uk54tajb4/CjxkWOvaPzqmhwJPSjhGNH4P5DcAiQGLW0C/yVM/fshkCqhTTAdPmWzyTjiRQeeRHPAQ7S/m9hNJamUTjUaX2WCLZjMuJWQfAyif8L0zEUyECbGEf9F4/Mb1FZeMXkA2cUVVFJMyD0B4QtobRyJwE6bD/F1hMwHbd92MRoXDMlVcRKfEoVO3MD01zeBaX8nJrShpnQCwd6ImtmQjlHtOB2NPo3tyYMHP+wR93W1lds1KmEXTl4Ztm87wYyjpnwHuOtxxYDWIZreAtHndO2cU0X8KNjZaHSjSvV44/P4/u7XL4E2tBKkdigkX0Wi+SAjEolF7fsxnR1oHfxwHcINKumV4jN1s2j7vs+3eDsSMnUlvRIJ38AXa4QymK5uiD6AdQK6EzJHoMk1SHqIaP71SaDvPwSNypFo9AnIHY9kgTCIi+Yi2ZPRusOPPI74D2HSFaJmzCzesv8OLNmCiIyqqX8S8R/CF9cQxj3YN+Gzs9DwAhKD5E5G7UfS/Fbj+2e+/ggUtYjPL0LN/8C0gHpAnwV7OtTWwNiF2PRCjPar4eg0Sm19YP8dqa3tJbV1i8rRoOsw7iIYvwjcesScgfA0mtKwyZ4Xlw85QsKB23zs10i19dMbLyEouDgg7hSwPZgM+OEyRocQLJreBNFpBPtp0EREP57Uu32aHd7/F4cSV7q9JqUZqL0WpAb6IOK/i4SpIGOEdByiFohmQTgZzMbKQK9BUUBz+7GM7DOBtYFpxD6DoseDpqhZjcjhSLJbff5JxI8R4r9AWt8C0o6Ol5DwNxNdm3+cL/aSLNy+3wQmfTvwa4U03v6jpDZ3Nhp9BVM4FvS9hNKPMG4l+AHUnYTEgtbno4ZE42UoEyBPvCYhHBGhppoRjf5WNDpLQgyqpkFgzYNbQyh8EDvzbCTXjpariPsHNaWbCyO9ahftP3m/TSZ924lrMzVQuQnc1YRKiuTbiWaei+bfD/4RtFpHIkCt+AwS7F+I2g+HzC7rB2a9+goUjUGjRagsB5mi2Z0Z0swWREAr2zC5JdjpS/ETEIrjiL8KW7tWNONM3/6TN2PRqaiqBFWTyee9XXIffk1vXaV6tQSNcTs/RtSZx874I9hRQCvPIsmRwBbNDhdI86cCc0299TpRefJVVaBbPx2p50DNmWA6QBbhs0cgPInW6wgZTPsi3HCKH34E8e9TU/tHDVHVHADlTTlqKRP5OVSTrjfWM93/s1SLuzuW/Cl28XYIdkKpfRFx78cNP4ofTjHtSxCXQasTCBvwyXFgjkHiGaJmuYSYdM20V49A0YiQH8uichIkgJ2KysmI7GzUVEJCGL0NSudh0j+rJaVbA9Rt39b9Jq9zwSn4zvmYdNcyTPJNbPxZ4uw1waXdbYvPouV0IURaq+R3/ACbnoWWzieM3g6mAyFAGGvYmrQhWVBO8/Gu2Jjo1STQIC7qBOYi8e6VQPpAetB0G0xciNlxEaI7VORk6yKL7v9a13HsKWj7LEgrS7HJtzFmISJgo/dIJn+turQnnt2Hc4JUW4wiyxCewxTfC/W/QtMdiJneUF9EY02UeSZkOgT7KiaRIKCSQymAbRii9CIsQPyXEPoJ3dei0a2ixsSh4CDsn/KOPQXa5oCrLMMmNyK2r1ELEUBETHy+yRQ+Z6sj8Zz3LSCrHV7URKi9Fd/6JST9T8T/PbAA6IYIVEFpbfgiryKBoiCaAnVQkAygXQ2S9DlCfAsafxB4Ro17QE2duO/X+07eMacR2uag9YllauJvI2bRi0xCt4vw00s2PuxciFCpo5L+HOUZyHyCkPke8CQSFNWORuQEANfYd+nBJ9A9MRu3fnYcjLYrbgT0OXA0jkq0gU6g9guYthPBAmGVcW2jKvV9D9sFJxHaDoH6+DJs/B0R07cH8rah/iOHPXr77d/sO0NH+u8lUMP4lhL4O5EITPvpqP086DCinYgFTUH0GYwf8eJa62t7o/ra3oNHoDhBvHQabz8tYnOIrkRrCgFEDGqOx7SdhmRAa4NIuFdteY/Vlo7FZ9LR95a2jr7lbR1L3sqUPZF3zGlo+1xIy8vEJt+RPStvmwT34ZFHfnjH84uX6/DanwAQ9w2hpoqKPkAob0MyYNrOJJg+xNBQXBoQ7tIgeaPJCitRuzX2IBKoigTNo+bdhGgF4n4I6S/QOmAFTd6A6TD4UZBwj0YT6/akvo6lb29k7qTtaySt/wy22y97B9nf+Z/2BSdD+ywkLS8VG39nL2G7leAuHflft905ddHpOrzm3t/7u4oj2NKvIKzCFcF0RJCcAlJDa0D6M0hvF40uEzXni0hBJlljntwaKIAhAsmg5qMQ/RG4v0MndqAhwbb3ohXQ6lPgr5W0NXVx6bePT+k9hI5lbwf1U4mz12DshZjoAuLsNah2597wLtqAjqNPhPbZaCNsb9wLeVsI7pL6SR+/q+uvz2S4//4Xmet1O9a1OSR8HWpPESbAdM6BYNHS8+D+DqLlYD8KkkM0mWyNfnIEqoJqAAJqcqj9IkaqULseMe1IksePDiLhMik/3y/ZGpkF4wDMPWE5YeYyDNotcfYaTPRekEYaFfseouSrIfgeecO7oPMwJK0sE5vsUXk0yLu0vOiiuzM//yIju8P2vyNZDMGmCB0DSPgUvrgTiVuQqB3q1yFEqL0ColzDJ8Jkc8mkCNTG7ziqY5gskMxpVFj8L8Eawvg4VD6JhE1amPUmrSe/fTaODM7mUInejthz+f37GEHsuWKTr+Fdj9YnlupewhZ0C95dWl5wwd2Fx65nZO29L+2gWoIpHo8JG6G2glAqQxyBfxS1n4XsIbs31CVUJia7nZncGmgDxLXRRo3Ng2kDlbeBWYS6IbR0A+LuR6NrIT5FQobaI417iExkkNo4Ia3dqd7dDBpeFJXGnkOUuVlsfKO8BHly8vl35x6/gZE1P35Je8cfmItoBtHoNDS+BhvuQce/TUiHULsUNX+CbQOtg+gzat2oSjh4BAYFU+2og/6fxqQJmEIOlXdC2IH6H6KZC1D7ZlRmUJ5ClGlMsf7n96BrViLW7iStrCD47/Li3bWIscv3pjwJ7tLaceffLT+9gdGBn7ysvZnOKvhWUGai5gw0eTf4/0DcFlTegWlNGhvqOqA/NbVCDXEHj8Bo4TbUVAF3F4RN+FGwXaB2CSIGQwBzXiO8ZU5oezr53edLwOjqlYiNR6hXVkjwN8krOaKobpHgLqkveOfd2ce+ycjA/a/MOWsJ2a0RmDlIAdSch2i1sRjZhdgu8KOAbkTCnWpr2ON2HDwCn/3ZXKCGhEM2IeFqtFxGU7AdraiZhso8iA9DWgCmiSY52cMUxdV3gbVFTScuI7ibeCkSVbcQ0kvcYW9dlay5meLAfZNYcwyEbA6YhskD0RGoHIqaWdjODrQGOlFCwpel3vK0TlJ9kyZwVmedIDYfoi1zMOnNiP8cfqiIyYIkHShHgc02dvlkUBPtbYrR1SsRExdJK5fJXkgUdIuou6R61DtXJRtvpdh/36Sck2CQYCKUHGIBm0N1PiS9SAbc0E4kfAap/CBkxuaqai7tn3EQk4gIImJE4y8Qko9h3PfQyrvxxf9EknbgUMQ2zpWiFUSd2BzVx1r2OF5x9V1gTJG0/Dskyu4f3Uxwl9QOf+uq/LrvM/wy2fa/o7q2nQfleUF82jhiBhDjwcxDMu2E4i+heg4mvRXyK0Sjy0FFwkHMwiEIxnWMo7IFtVcSkjswpgWK5xF23QByKFCBAKpPaXC54MZPjIoF/Po9dwVMX303mKhIWtkdzkFFdbOo+1Bl3hmrCk/+YK/7vL3BD0wj6hmTNzHrVEULEJ7bXS+oAEeh49+E0fMxpo2QuYNgrkDlWevay0H8wSMwXrwVNWWQcC/oGCQnoMn30MzlSPodJDwIPkIdEB4WMkcLma+Ynuxh4rLUN2ZfNOYGoLh65W+U+CkJ7ssS0kvKvSf9qHXD/2ao/6eTcqj2K5CQxQzOnkeIrhKNjwD9L/BAiCD8ApN+G00+i8b/BsmJQBHCfWqrJJOsGk26nKXUCdRWQ3gIBExnHjIXo/G/gFmPug2oqyC6FuRQgjmRYD+jNs1F9b23VRRX300hw0gmLX4u48Z+3LX5HobW3DdZ84grs1CTZlD7CdS8EZUjgccbNrEeMevw0b+gmYuRtgKqQLhfbX1AzeSTyKTr2EHLWO0qK+4bovVTCeV2omngh5eh5SuQ+kOo9iJmFyodjcqHvEd88jA+/90wMBOzcNsex972Xz8CmLwXvwndJ7uRcgtE5bMhuaAxd6UTIyV04tfg1qPmCqQwH9sFbghIB5FwnbhMNeQnJj3npBUYLymiUkNt7V7w16MVj9sJ0TQwnfNQOQPxNYQuCONIApLPobKCaPxw9OD1dEqaQ+PxWahZgSnkG0dtdoH0gBtD5Sxs1/zdLxy0WgN/tUte+KWaGtFRQwefQAC7eCsmRA6pX4WEr6LVKuk2MAUw3b2QPQy1fwz6HJpWMS2APRo157hoq/EDvR1u01xJ1+9/u1m6sZ3xIuLX9bbWZm4WNHoHxAsxedC0guizqDkd4qOJps/GtEC6FUJlAtEvq6l/Pap3B9u3b63C+3yxbhZvBbG7MLXLEf8BtP4Y6fYaWgXJGLB/iVHQdH1jX5IHlbdEblqPaPJ5U+Yc620u9M+mumnfbAj9M7H1XJLfPPft4pPPZ7b3dqG8GSlIozvCrQMVsOdjWhO0IqRbq1B/GBP+ClP9B1FbMYv3/bZwn+Np8KEpkDF4Fxyx+zebyiqCfSO66yQ0WoToQtT+DeJ/RhhbiO1IcOPzICqgphWVf0XMLeCuzBRP2ODXPY097pWFkFvXhanOAC0dTkguA/Ne0FtALMg8bCv44RoSHoDoo6ApoXQb1AcQHsb4R72pl/BixOzfZdc+K1BEUAeCmWvT+Co0vrhRcA23EFU/jKkvB70TI13o+FONf862E+gE/zBESaPwEN2mmR1nmKfPwT/x8iEd1k3DDnwK4tKbUXsb5D4AUR78LwkUkEIXWged+BUiU4C7MPXlRJW/xuptjRpgfLH1uSuN2Fn7ep35Wx7252G3dhYhqpoobfkQaq5CJAMyCmEI9CmExxAdBP9GNPcuSFrR0nsQ/wiaeQDTORctg1Y2I/5i0eS+EI3uVYluXTc2bUdN+scE+12kMAeTgzDyLFRPR+LDkLaVaC1FKj8EHkRtD8oJiMxvnNe1HbSG+BVOdn3LaiHY/ehT3O8mc79mJqr1yEjLpai9ApNvazQYpTTuHVwJ/FMIoPZYCHcSVS7CZf8Wsl8g6jb4naDVx7Duz1HZYhY9v5c1bzagvYToNmg5gWgKuBcCVC8nqlyLK3wD7AWIX4dqFcyRkHQg2UZ0hypoZQz85cFM3CAaO7t4/1pNDkiXvl8zExUfmZA9H+wVSGZ2IyPvPgNrBULFoTUB7xB/DeJuItjPIIULsV0RbhCkepm4wtWaHcYc+8Lvk7d+OpQ7IK58EgpXEfUIbihFyzdh/LVo9D7UfBSJYiQTMPkIkwMUfBlCCbT2HOI+q6b872js7AFocjpgnzm4x2fgGJKE3iVgPwnmbWAbajTZ3fkqsLuE5BF9DMJ9oMci+T+BbBu66zFM9W1ghszCzXtQX+hF86uQ9j50fBAt34fYzai8FewiJCcNtZlGBITK7mKpHwNdifiv1Do398e7pmm08NcHxO8D+p1Ivb8Nqx0gPichPh7Mn6IsBXqACJESsAm0H7SM0As6E+EoNDoOJUL8PxKFr4Zjnt9pnpqupErID4rZNbuXYD+N2ksRqlB7BJVnwAyBbN/dHnE0cBSqnY23xSCij0JYqSZ9VLBVs2jLgXT54H0r5wamoHgxWsiJ2oIqiPUBNS2oXbK7r3Ax2G4kakF9B/gEqCBsRPQW8KuAGDXvAHM2KvNQzWCiOphR1JUaCSsMIHov4h9Fwi51NgYQ6yZCVK6IWrXHDh8UPw/qx4a7HppBa6chBD9HQuZs1J4IsgiiOUg2xuQbbSGhAmHXLki/h4Q7QY4HcwlKFjAIRQjXozwB8i6I3o1pbbSnobuTw0QK/nkkPA7+F0Hrt4rwwr6eMF4pzEEd3CjBgyo7G00+SKOjS0C94nd53AvDhOF7oHYudvzjoMMgsxrM8CTwxO7Gnx5MeEZt+SNQO5dQvAc3OIIf9Wi9ceOqWkA1UuVZVMf2tePqdaPA32BirSEnswi4RIKdK8gRIJ1ABfRpjHsGjeah5lKQM4ANEK5H3P2ggiZnglwKzEH0DiR8S8VtEx/NAzkcyIAWEd2k4p4TonrZbKPlOP+HQeDeQ3wmLS0RSlgqRP8KUoLwNZV0pWhScnYQ8TGWqahUO4Toz1HzEURFxV0kSP/I1jpTz3rhNfPhNSXQjSbIs9NQyIrIEiQ8LSH3ax8NEh/3+x8fuoEujOtBzfjMxr1G+L8oVY7ajs0GmmiiiSaaaKKJJppoookmmmiiiSaaaKKJJpp4neP/AbHHp0bYmXQtAAAAAElFTkSuQmCC";

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

const Sidebar = ({ activeView, setActiveView, user, userProfile, onSignOut }) => {
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
  
  // Use profile photo if available, otherwise fall back to Google photo
  const displayPhoto = userProfile?.photoURL || user?.photoURL;
  const displayName = userProfile?.displayName || user?.displayName || 'User';
  
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
          {displayPhoto ? (
            <img src={displayPhoto} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#EBE6D3] flex items-center justify-center">
              <User className="w-4 h-4 text-[#162D4D]" />
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-gray-800 truncate">{displayName}</p>
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
  const [aiConversation, setAiConversation] = useState([]); // {role: 'user'|'assistant', content: string}
  const [aiFollowUp, setAiFollowUp] = useState('');
  const [suggestedHabits, setSuggestedHabits] = useState([]); // [{habit: string, target: number, added: boolean}]
  const [quoteHabitSuggestions, setQuoteHabitSuggestions] = useState([]); // Suggestions from quote
  const [quoteHabitLoading, setQuoteHabitLoading] = useState(false);
  
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
  const [newBet, setNewBet] = useState({ challenger: '', challenged: [], goal: '', reward: '', deadline: '', isGroup: false });
  const [showNewBet, setShowNewBet] = useState(false);
  const [editingBet, setEditingBet] = useState(null);
  
  // Profile state
  const [profiles, setProfiles] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ 
    displayName: '', 
    bio: '', 
    linkedParticipant: '',
    location: '',
    goals: '',
    photoURL: ''
  });
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [viewingProfile, setViewingProfile] = useState(null); // For viewing other profiles
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  
  // Habit editing state
  const [editingHabit, setEditingHabit] = useState(null); // {id, habit, target}
  const [weekHabitSuggestions, setWeekHabitSuggestions] = useState([]); // AI suggestions for new week
  const [weekSuggestLoading, setWeekSuggestLoading] = useState(false);
  
  // Weekly Check-ins state (legacy - now part of feed)
  const [checkIns, setCheckIns] = useState([]);
  const [checkInText, setCheckInText] = useState('');
  const [checkInWins, setCheckInWins] = useState('');
  const [checkInChallenges, setCheckInChallenges] = useState('');
  
  const calendarRef = useRef(null);
  const fileInputRef = useRef(null);
  const postTextRef = useRef(null);
  const profilePhotoRef = useRef(null);

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
          linkedParticipant: myProfile.linkedParticipant || '',
          location: myProfile.location || '',
          goals: myProfile.goals || '',
          photoURL: myProfile.photoURL || ''
        });
        setProfilePhotoPreview(myProfile.photoURL || null);
      }
    }, (error) => {
      console.error('Profiles error:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Get profile by participant name
  const getProfileByParticipant = (participantName) => {
    return profiles.find(p => p.linkedParticipant === participantName);
  };

  // Get profile photo for a participant
  const getParticipantPhoto = (participantName) => {
    const profile = getProfileByParticipant(participantName);
    return profile?.photoURL || null;
  };

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
        return sum + (h.daysCompleted?.length || 0);
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
  }, [habits, calculateStreaks, allParticipants]);

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
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Scale down if too large
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            
            // Also limit height
            const maxHeight = 800;
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to compressed base64
            let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            console.log(`Image compressed: ${width}x${height}, quality ${quality}, size: ${compressedBase64.length}`);
            
            // Progressively reduce quality if still too large (Firestore limit ~1MB per doc)
            const maxSize = 700000; // Leave room for other document fields
            let currentQuality = quality;
            
            while (compressedBase64.length > maxSize && currentQuality > 0.1) {
              currentQuality -= 0.1;
              compressedBase64 = canvas.toDataURL('image/jpeg', currentQuality);
              console.log(`Re-compressed at quality ${currentQuality.toFixed(1)}, size: ${compressedBase64.length}`);
            }
            
            // If still too large, reduce dimensions
            if (compressedBase64.length > maxSize) {
              const scale = 0.7;
              canvas.width = Math.round(width * scale);
              canvas.height = Math.round(height * scale);
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
              console.log(`Scaled down to ${canvas.width}x${canvas.height}, size: ${compressedBase64.length}`);
            }
            
            resolve(compressedBase64);
          } catch (err) {
            console.error('Canvas error:', err);
            reject(err);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle image selection for post
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('Selected file:', file.name, file.type, file.size);
    
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    try {
      // Compress the image aggressively for posts
      const compressedImage = await compressImage(file, 500, 0.6);
      console.log('Final compressed image size:', compressedImage.length, 'characters');
      
      if (compressedImage.length > 900000) {
        alert('Image is still too large after compression. Please try a smaller image.');
        return;
      }
      
      setNewPostImage(compressedImage);
      setPostImagePreview(compressedImage);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Failed to process image: ' + error.message);
    }
    
    // Reset the input so the same file can be selected again
    e.target.value = '';
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
      // Use profile photo if available, otherwise Google photo
      const authorPhoto = userProfile?.photoURL || user.photoURL || null;
      
      const post = {
        id: `post_${Date.now()}`,
        author: userProfile?.linkedParticipant || user.displayName || 'Anonymous',
        authorPhoto: authorPhoto,
        authorId: user.uid,
        content: newPostText,
        image: newPostImage || null,
        reactions: {},
        comments: [],
        createdAt: new Date().toISOString()
      };
      
      console.log('Creating post, image size:', newPostImage ? newPostImage.length : 0);
      
      await setDoc(doc(db, 'posts', post.id), post);
      setNewPostText('');
      setNewPostImage(null);
      setPostImagePreview(null);
    } catch (error) {
      console.error('Error creating post:', error);
      if (error.message?.includes('bytes') || error.code === 'invalid-argument') {
        alert('Image is too large for the database. Please try a smaller image or post without an image.');
      } else {
        alert('Failed to create post: ' + error.message);
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
    // For group challenges, check if at least one participant selected
    // For 1v1, check if challenged is set
    const hasParticipants = newBet.isGroup 
      ? (newBet.challenged && newBet.challenged.length > 0)
      : newBet.challenged;
    
    if (!hasParticipants || !newBet.goal) return;
    
    const bet = {
      id: `bet_${Date.now()}`,
      challenger: userProfile?.linkedParticipant || user.displayName || 'Anonymous',
      challengerId: user.uid,
      challengerPhoto: userProfile?.photoURL || user.photoURL,
      challenged: newBet.isGroup ? newBet.challenged : [newBet.challenged], // Always store as array
      isGroup: newBet.isGroup || false,
      goal: newBet.goal,
      reward: newBet.reward || 'Bragging rights! 🏆',
      deadline: newBet.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending', // pending, accepted, declined, completed
      acceptedBy: [], // Track who has accepted (for group challenges)
      declinedBy: [], // Track who has declined
      acceptedAt: null,
      completedAt: null,
      winner: null,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'bets', bet.id), bet);
    setNewBet({ challenger: '', challenged: [], goal: '', reward: '', deadline: '', isGroup: false });
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

  // Accept challenge (updated for group support)
  const acceptBet = async (betId) => {
    const bet = bets.find(b => b.id === betId);
    if (!bet) return;
    
    const myName = userProfile?.linkedParticipant || user.displayName;
    
    if (bet.isGroup) {
      // For group challenges, add to acceptedBy array
      const acceptedBy = [...(bet.acceptedBy || [])];
      if (!acceptedBy.includes(myName)) {
        acceptedBy.push(myName);
      }
      
      // Check if all participants have accepted
      const allAccepted = bet.challenged.every(p => acceptedBy.includes(p));
      
      await setDoc(doc(db, 'bets', betId), { 
        ...bet, 
        acceptedBy,
        status: allAccepted ? 'accepted' : 'pending',
        acceptedAt: allAccepted ? new Date().toISOString() : null
      }, { merge: true });
    } else {
      // 1v1 challenge - original behavior
      await setDoc(doc(db, 'bets', betId), { 
        ...bet, 
        status: 'accepted',
        acceptedBy: [myName],
        acceptedAt: new Date().toISOString()
      }, { merge: true });
    }
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

  // Handle profile photo upload
  const handleProfilePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('Profile photo selected:', file.name, file.type, file.size);
    
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    try {
      // Compress profile photo to smaller size (profile photos are small)
      const compressedImage = await compressImage(file, 150, 0.7);
      console.log('Profile photo compressed, size:', compressedImage.length);
      
      if (compressedImage.length > 200000) {
        // Profile photos should be small
        const smallerImage = await compressImage(file, 100, 0.5);
        setProfilePhotoPreview(smallerImage);
        setProfileForm({ ...profileForm, photoURL: smallerImage });
      } else {
        setProfilePhotoPreview(compressedImage);
        setProfileForm({ ...profileForm, photoURL: compressedImage });
      }
    } catch (error) {
      console.error('Error compressing profile image:', error);
      alert('Failed to process image: ' + error.message);
    }
    
    // Reset the input
    e.target.value = '';
  };

  // Save profile
  const saveProfile = async () => {
    if (!user) return;
    
    try {
      const profile = {
        odingUserId: user.uid,
        odingEmail: user.email,
        odingDisplayName: user.displayName,
        odingPhoto: user.photoURL,
        displayName: profileForm.displayName || user.displayName,
        bio: profileForm.bio || '',
        linkedParticipant: profileForm.linkedParticipant || '',
        location: profileForm.location || '',
        goals: profileForm.goals || '',
        photoURL: profileForm.photoURL || user.photoURL || '',
        updatedAt: new Date().toISOString()
      };
      
      const profileId = userProfile?.id || `profile_${user.uid}`;
      await setDoc(doc(db, 'profiles', profileId), profile, { merge: true });
      alert('Profile saved!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  // Open profile view for a participant
  const openProfileView = (participantName) => {
    const profile = getProfileByParticipant(participantName);
    if (profile) {
      setViewingProfile({ ...profile, participantName });
    } else {
      // Create a minimal profile view for unlinked participants
      setViewingProfile({ 
        participantName,
        displayName: participantName,
        linkedParticipant: participantName
      });
    }
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

  const weeklyTrendData = useMemo(() => {
    // Get weeks based on selected range
    let weeksToShow = ALL_WEEKS;
    
    if (scorecardRange === 'week') {
      const idx = ALL_WEEKS.indexOf(currentWeek);
      weeksToShow = ALL_WEEKS.slice(Math.max(0, idx - 7), idx + 1);
    } else if (scorecardRange === '4weeks') {
      const idx = ALL_WEEKS.indexOf(currentWeek);
      weeksToShow = ALL_WEEKS.slice(Math.max(0, idx - 7), idx + 1);
    } else if (scorecardRange === 'quarter') {
      const d = new Date(currentWeek + 'T00:00:00');
      const quarterStart = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
      weeksToShow = ALL_WEEKS.filter(w => new Date(w + 'T00:00:00') >= quarterStart && new Date(w + 'T00:00:00') <= d);
    }
    
    return weeksToShow.map(week => {
      const wH = habits.filter(h => h.weekStart === week);
      const completed = wH.filter(h => ['Done', 'Exceeded'].includes(getStatus(h))).length;
      const byP = {};
      allParticipants.forEach(p => {
        const pH = wH.filter(h => h.participant === p);
        byP[p] = pH.length > 0 ? Math.round((pH.filter(h => ['Done', 'Exceeded'].includes(getStatus(h))).length / pH.length) * 100) : 0;
      });
      return { week: formatWeekString(week), rate: wH.length > 0 ? Math.round((completed / wH.length) * 100) : 0, ...byP };
    });
  }, [habits, ALL_WEEKS, scorecardRange, currentWeek, allParticipants]);

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

  const participantData = useMemo(() => allParticipants.map(p => {
    const pH = getRangeHabits.filter(h => h.participant === p);
    const completed = pH.filter(h => ['Done', 'Exceeded'].includes(getStatus(h))).length;
    return { name: p, rate: pH.length > 0 ? Math.round((completed / pH.length) * 100) : 0, completed, total: pH.length, color: PARTICIPANT_COLORS[p] || '#6366f1' };
  }), [getRangeHabits, allParticipants]);

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

  // Edit existing habit
  const updateHabit = async () => {
    if (!editingHabit || !editingHabit.habit.trim()) return;
    
    const habit = habits.find(h => h.id === editingHabit.id);
    if (!habit) return;
    
    await setDoc(doc(db, 'habits', editingHabit.id), {
      ...habit,
      habit: editingHabit.habit,
      target: parseInt(editingHabit.target)
    });
    
    setEditingHabit(null);
  };

  // Move habit up or down in the list
  const moveHabit = async (habitId, direction) => {
    const currentHabits = currentWeekHabits.filter(h => 
      h.participant === (userProfile?.linkedParticipant || selectedParticipant)
    );
    const idx = currentHabits.findIndex(h => h.id === habitId);
    if (idx === -1) return;
    
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= currentHabits.length) return;
    
    // Swap order values
    const habit1 = currentHabits[idx];
    const habit2 = currentHabits[newIdx];
    
    const order1 = habit1.order || idx;
    const order2 = habit2.order || newIdx;
    
    await setDoc(doc(db, 'habits', habit1.id), { ...habit1, order: order2 });
    await setDoc(doc(db, 'habits', habit2.id), { ...habit2, order: order1 });
  };

  // Auto-suggest habits based on past 4 weeks
  const suggestWeeklyHabits = async () => {
    setWeekSuggestLoading(true);
    setWeekHabitSuggestions([]);
    
    try {
      // Get habits from past 4 weeks
      const idx = ALL_WEEKS.indexOf(currentWeek);
      const past4Weeks = ALL_WEEKS.slice(Math.max(0, idx - 4), idx);
      const participant = userProfile?.linkedParticipant || selectedAiParticipant;
      
      const pastHabits = habits.filter(h => 
        h.participant === participant && 
        past4Weeks.includes(h.weekStart)
      );
      
      // Calculate success rates for each habit
      const habitStats = {};
      pastHabits.forEach(h => {
        const key = h.habit;
        if (!habitStats[key]) {
          habitStats[key] = { habit: key, totalCompleted: 0, totalTarget: 0, count: 0 };
        }
        habitStats[key].totalCompleted += h.daysCompleted?.length || 0;
        habitStats[key].totalTarget += h.target || 5;
        habitStats[key].count++;
      });
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest-weekly',
          participant,
          pastHabits: Object.values(habitStats).map(s => ({
            habit: s.habit,
            successRate: s.totalTarget > 0 ? Math.round((s.totalCompleted / s.totalTarget) * 100) : 0,
            timesTracked: s.count
          }))
        })
      });
      
      const data = await response.json();
      
      if (!data.error && data.message) {
        const habitMatches = data.message.match(/(?:^|\n)[-•*]\s*(.+?)(?:\s*[-–]\s*(\d+)\s*(?:days?|x)?)?(?=\n|$)/gim);
        if (habitMatches) {
          const parsed = habitMatches.map(match => {
            const cleaned = match.replace(/^[\n\s]*[-•*]\s*/, '').trim();
            const targetMatch = cleaned.match(/[-–]\s*(\d+)\s*(?:days?|x)?/);
            const habitName = cleaned.replace(/\s*[-–]\s*\d+\s*(?:days?|x)?\s*(?:per\s*)?(?:week)?$/i, '').trim();
            return {
              habit: habitName,
              target: targetMatch ? parseInt(targetMatch[1]) : 5,
              added: false
            };
          }).filter(h => h.habit.length > 3 && h.habit.length < 100);
          setWeekHabitSuggestions(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to suggest weekly habits:', error);
    }
    
    setWeekSuggestLoading(false);
  };

  // Add habit from weekly suggestions
  const addWeeklyHabit = async (habit, index) => {
    if (!currentWeek) return;
    
    const participant = userProfile?.linkedParticipant || selectedAiParticipant;
    const newHabitDoc = {
      id: `habit_${Date.now()}_weekly_${index}`,
      participant,
      habit: habit.habit,
      target: habit.target,
      daysCompleted: [],
      weekStart: currentWeek,
      order: currentWeekHabits.filter(h => h.participant === participant).length + index
    };
    
    await setDoc(doc(db, 'habits', newHabitDoc.id), newHabitDoc);
    
    setWeekHabitSuggestions(prev => prev.map((h, i) => 
      i === index ? { ...h, added: true } : h
    ));
  };

  // AI Coach function
  const callAI = async (action, goal = '', followUp = '') => {
    setAiLoading(true);
    
    // If it's a follow-up, don't clear the response
    if (!followUp) {
      setAiResponse('');
      setSuggestedHabits([]);
    }
    
    try {
      const participantHabits = selectedAiParticipant === 'All' 
        ? currentWeekHabits 
        : currentWeekHabits.filter(h => h.participant === selectedAiParticipant);
      
      // Build conversation context
      const conversationContext = followUp ? aiConversation : [];
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: followUp ? 'follow-up' : action,
          habits: action === 'insights' ? habits : participantHabits,
          participant: selectedAiParticipant,
          goal: followUp || goal,
          conversation: conversationContext
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        setAiResponse(`Error: ${data.error}`);
      } else {
        const newMessage = data.message;
        setAiResponse(newMessage);
        
        // Update conversation history
        if (followUp) {
          setAiConversation([
            ...aiConversation,
            { role: 'user', content: followUp },
            { role: 'assistant', content: newMessage }
          ]);
        } else {
          setAiConversation([
            { role: 'user', content: `${action}: ${goal || selectedAiParticipant}` },
            { role: 'assistant', content: newMessage }
          ]);
        }
        
        // Parse suggested habits from response (for suggest-habits action)
        if (action === 'suggest-habits' || action === 'write-habit') {
          const habitMatches = newMessage.match(/(?:^|\n)[-•*]\s*(.+?)(?:\s*[-–]\s*(\d+)\s*(?:days?|x)?\s*(?:per\s*)?(?:week)?)?(?=\n|$)/gim);
          if (habitMatches) {
            const parsed = habitMatches.map(match => {
              const cleaned = match.replace(/^[\n\s]*[-•*]\s*/, '').trim();
              const targetMatch = cleaned.match(/[-–]\s*(\d+)\s*(?:days?|x)?/);
              const habitName = cleaned.replace(/\s*[-–]\s*\d+\s*(?:days?|x)?\s*(?:per\s*)?(?:week)?$/i, '').trim();
              return {
                habit: habitName,
                target: targetMatch ? parseInt(targetMatch[1]) : 5,
                added: false
              };
            }).filter(h => h.habit.length > 3 && h.habit.length < 100);
            setSuggestedHabits(parsed);
          }
        }
      }
    } catch (error) {
      setAiResponse('Failed to connect to AI. Please try again.');
    }
    
    setAiLoading(false);
    setAiFollowUp('');
  };

  // Add a suggested habit
  const addSuggestedHabit = async (habit, index) => {
    if (!currentWeek) return;
    
    const participant = userProfile?.linkedParticipant || selectedAiParticipant;
    const newHabitDoc = {
      id: `habit_${Date.now()}_${index}`,
      participant,
      habit: habit.habit,
      target: habit.target,
      daysCompleted: [],
      weekStart: currentWeek
    };
    
    await setDoc(doc(db, 'habits', newHabitDoc.id), newHabitDoc);
    
    // Mark as added
    setSuggestedHabits(prev => prev.map((h, i) => 
      i === index ? { ...h, added: true } : h
    ));
  };

  // Generate habit suggestions from a quote
  const suggestHabitsFromQuote = async (quote) => {
    setQuoteHabitLoading(true);
    setQuoteHabitSuggestions([]);
    
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quote-habits',
          quote: quote.quote,
          author: quote.author,
          personalApplication: quote.personalApplication,
          businessApplication: quote.businessApplication,
          participant: userProfile?.linkedParticipant || selectedAiParticipant
        })
      });
      
      const data = await response.json();
      
      if (!data.error && data.message) {
        // Parse habits from the response
        const habitMatches = data.message.match(/(?:^|\n)[-•*]\s*(.+?)(?:\s*[-–]\s*(\d+)\s*(?:days?|x)?\s*(?:per\s*)?(?:week)?)?(?=\n|$)/gim);
        if (habitMatches) {
          const parsed = habitMatches.map(match => {
            const cleaned = match.replace(/^[\n\s]*[-•*]\s*/, '').trim();
            const targetMatch = cleaned.match(/[-–]\s*(\d+)\s*(?:days?|x)?/);
            const habitName = cleaned.replace(/\s*[-–]\s*\d+\s*(?:days?|x)?\s*(?:per\s*)?(?:week)?$/i, '').trim();
            return {
              habit: habitName,
              target: targetMatch ? parseInt(targetMatch[1]) : 5,
              added: false
            };
          }).filter(h => h.habit.length > 3 && h.habit.length < 100);
          setQuoteHabitSuggestions(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to suggest habits from quote:', error);
    }
    
    setQuoteHabitLoading(false);
  };

  // Add habit from quote suggestion
  const addQuoteHabit = async (habit, index) => {
    if (!currentWeek) return;
    
    const participant = userProfile?.linkedParticipant || selectedAiParticipant;
    const newHabitDoc = {
      id: `habit_${Date.now()}_quote_${index}`,
      participant,
      habit: habit.habit,
      target: habit.target,
      daysCompleted: [],
      weekStart: currentWeek
    };
    
    await setDoc(doc(db, 'habits', newHabitDoc.id), newHabitDoc);
    
    setQuoteHabitSuggestions(prev => prev.map((h, i) => 
      i === index ? { ...h, added: true } : h
    ));
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
      <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} userProfile={userProfile} onSignOut={handleSignOut} />
      <div className="flex-1 p-3 md:p-5 overflow-auto pb-32 md:pb-5">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src={LOGO_BASE64} alt="Logo" className="w-8 h-8" />
            <span className="font-bold text-[#1E3A5F]">Accountability</span>
          </div>
          <button onClick={() => setActiveView('profile')}>
            {(userProfile?.photoURL || user?.photoURL) ? (
              <img src={userProfile?.photoURL || user?.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-sm font-medium">
                {user?.displayName?.[0] || '?'}
              </div>
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-gray-400 text-xs md:text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-lg md:text-xl font-bold text-gray-800">Hello, {userProfile?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Team'} 👋</h1>
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
              
              {/* Timeframe Selector */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(rangeLabels).map(([k, v]) => (
                    <button 
                      key={k} 
                      onClick={() => setScorecardRange(k)} 
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${scorecardRange === k ? 'bg-[#1E3A5F] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#F5B800]'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              
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
                  <h3 className="font-semibold text-gray-800 text-sm mb-2">Completion Trend ({scorecardRange === 'week' ? 'Week' : scorecardRange === '4weeks' ? '4 Weeks' : scorecardRange === 'quarter' ? 'Quarter' : 'All Time'})</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={weeklyTrendData}>
                      <defs>{allParticipants.map(p => <linearGradient key={p} id={`g-${p}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={PARTICIPANT_COLORS[p] || '#6366f1'} stopOpacity={0.15} /><stop offset="95%" stopColor={PARTICIPANT_COLORS[p] || '#6366f1'} stopOpacity={0} /></linearGradient>)}</defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 10 }} />
                      {allParticipants.map(p => <Area key={p} type="monotone" dataKey={p} stroke={PARTICIPANT_COLORS[p] || '#6366f1'} strokeWidth={2} fill={`url(#g-${p})`} />)}
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
              
              {/* Participant Performance - compact with profile photos */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm mb-3">Performance</h3>
                <div className="space-y-2">{participantData.map(p => {
                  const profile = getProfileByParticipant(p.name);
                  return (
                  <div key={p.name} className="flex items-center gap-2">
                    <button onClick={() => openProfileView(p.name)} className="flex items-center gap-2 w-20 hover:opacity-80">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: p.color }}>{p.name[0]}</div>
                      )}
                      <span className="text-xs font-medium text-gray-700 truncate">{p.name}</span>
                    </button>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p.rate}%`, backgroundColor: p.color }} /></div>
                    <div className="w-8 text-right text-xs font-semibold" style={{ color: p.color }}>{p.rate}%</div>
                  </div>
                );})}</div>
              </div>
              
              {/* Recent Activity */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 text-sm">Recent Activity</h3>
                  <button onClick={() => setActiveView('feed')} className="text-xs text-[#1E3A5F] hover:underline">View all →</button>
                </div>
                {posts.slice(0, 2).map(post => {
                  const authorProfile = getProfileByParticipant(post.author);
                  const displayPhoto = authorProfile?.photoURL || post.authorPhoto;
                  return (
                  <div key={post.id} className="flex gap-2 p-2 bg-gray-50 rounded-lg mb-2">
                    <button onClick={() => openProfileView(post.author)}>
                      {displayPhoto ? <img src={displayPhoto} className="w-6 h-6 rounded-full object-cover hover:ring-2 hover:ring-[#F5B800]" alt="" /> : <div className="w-6 h-6 rounded-full bg-[#1E3A5F] text-white text-xs flex items-center justify-center">{post.author?.[0]}</div>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <button onClick={() => openProfileView(post.author)} className="text-xs font-medium text-gray-800 hover:text-[#1E3A5F] hover:underline">{post.author}</button>
                      <p className="text-xs text-gray-600 truncate">{post.content}</p>
                    </div>
                  </div>
                );})}
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
                  {leaderboard.map((p, i) => {
                    const profile = getProfileByParticipant(p.name);
                    return (
                    <button key={p.name} onClick={() => openProfileView(p.name)} className="w-full flex items-center gap-2 hover:bg-white/10 rounded-lg p-1 -m-1 transition-colors">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${i === 0 ? 'bg-[#F5B800] text-[#1E3A5F]' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-600 text-white' : 'bg-white/20'}`}>
                          {i === 0 ? '👑' : i + 1}
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{p.name}</p>
                      </div>
                      <p className="text-sm font-bold text-[#F5B800]">{p.score}</p>
                    </button>
                  );})}
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
                  {allParticipants.map(p => {
                    const profile = getProfileByParticipant(p);
                    return (
                    <button key={p} onClick={() => openProfileView(p)} className="w-full flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <span className="text-sm">🔥</span>
                      )}
                      <span className="flex-1 text-xs text-gray-700 text-left">{p}</span>
                      <span className="text-sm font-bold text-orange-500">{calculateStreaks[p] || 0}</span>
                    </button>
                  );})}
                </div>
              </div>
              
              {/* Active Challenges Preview */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Swords className="w-4 h-4 text-purple-500" />
                  <h3 className="font-semibold text-gray-800 text-sm">Active Challenges</h3>
                </div>
                {bets.filter(b => b.status === 'accepted').slice(0, 2).map(bet => (
                  <div key={bet.id} className="p-2 bg-purple-50 rounded-lg mb-2">
                    <p className="text-xs font-medium text-purple-800">{bet.challenger} vs {Array.isArray(bet.challenged) ? bet.challenged.join(', ') : bet.challenged}</p>
                    <p className="text-[10px] text-purple-600">{bet.goal}</p>
                    {bet.reward && <p className="text-[10px] text-purple-500">🎁 {bet.reward}</p>}
                  </div>
                ))}
                {bets.filter(b => b.status === 'accepted').length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">No active challenges</p>
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
                {(userProfile?.photoURL || user?.photoURL) ? (
                  <img src={userProfile?.photoURL || user?.photoURL} className="w-10 h-10 rounded-full object-cover" alt="" />
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
            {posts.map(post => {
              const authorProfile = getProfileByParticipant(post.author);
              const displayPhoto = authorProfile?.photoURL || post.authorPhoto;
              return (
              <div key={post.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Post Header */}
                <div className="p-4 pb-0">
                  <div className="flex items-start gap-3">
                    <button onClick={() => openProfileView(post.author)} className="flex-shrink-0">
                      {displayPhoto ? (
                        <img src={displayPhoto} className="w-10 h-10 rounded-full object-cover hover:ring-2 hover:ring-[#F5B800] transition-all" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center font-medium hover:ring-2 hover:ring-[#F5B800] transition-all">
                          {post.author?.[0] || '?'}
                        </div>
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openProfileView(post.author)} className="font-semibold text-gray-800 hover:text-[#1E3A5F] hover:underline">{post.author}</button>
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
            );})}
            
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
                {leaderboard.map((p, i) => {
                  const profile = getProfileByParticipant(p.name);
                  return (
                  <div key={p.name} className={`relative rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-transform ${i === 0 ? 'bg-gradient-to-br from-[#F5B800] to-amber-600 text-[#1E3A5F]' : 'bg-white/10'}`} onClick={() => openProfileView(p.name)}>
                    {i === 0 && (
                      <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <Crown className="w-5 h-5 text-[#F5B800]" />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="" className={`w-12 h-12 rounded-full object-cover border-2 ${i === 0 ? 'border-white' : 'border-white/30'}`} />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${i === 0 ? 'bg-white text-[#1E3A5F]' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-600 text-white' : 'bg-white/20'}`}>
                          {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : p.name[0]}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-bold text-lg hover:underline">{p.name}</p>
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
                );})}
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
                    {bets.filter(b => b.status === 'pending').map(bet => {
                      const challengedList = Array.isArray(bet.challenged) ? bet.challenged : [bet.challenged];
                      const myName = userProfile?.linkedParticipant || user?.displayName;
                      const isChallengee = challengedList.includes(myName);
                      const hasAccepted = bet.acceptedBy?.includes(myName);
                      const hasDeclined = bet.declinedBy?.includes(myName);
                      
                      return (
                        <div key={bet.id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {bet.isGroup && <span className="px-1.5 py-0.5 bg-purple-200 text-purple-800 text-[10px] font-medium rounded">GROUP</span>}
                              <Swords className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-purple-800">{bet.challenger}</span>
                              <span className="text-purple-400">vs</span>
                              <span className="font-medium text-purple-800">
                                {challengedList.length > 2 
                                  ? `${challengedList.slice(0, 2).join(', ')} +${challengedList.length - 2}`
                                  : challengedList.join(', ')}
                              </span>
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
                          <p className="text-xs text-purple-500 mb-2">Deadline: {new Date(bet.deadline).toLocaleDateString()}</p>
                          
                          {/* Group challenge status */}
                          {bet.isGroup && bet.acceptedBy?.length > 0 && (
                            <p className="text-xs text-green-600 mb-2">
                              ✓ Accepted: {bet.acceptedBy.join(', ')}
                            </p>
                          )}
                          
                          {isChallengee && bet.challengerId !== user?.uid && !hasAccepted && !hasDeclined && (
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
                          {hasAccepted && (
                            <p className="text-xs text-green-600 font-medium">✓ You accepted - waiting for others</p>
                          )}
                        </div>
                      );
                    })}
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
                    {bets.filter(b => b.status === 'accepted').map(bet => {
                      const challengedList = Array.isArray(bet.challenged) ? bet.challenged : [bet.challenged];
                      const allParticipantsInChallenge = [bet.challenger, ...challengedList];
                      const myName = userProfile?.linkedParticipant || user?.displayName;
                      const isParticipant = allParticipantsInChallenge.includes(myName) || bet.challengerId === user?.uid;
                      
                      return (
                        <div key={bet.id} className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {bet.isGroup && <span className="px-1.5 py-0.5 bg-orange-200 text-orange-800 text-[10px] font-medium rounded">GROUP</span>}
                              <span className="text-lg">⚔️</span>
                              <span className="font-medium text-gray-800">{bet.challenger}</span>
                              <span className="text-gray-400">vs</span>
                              <span className="font-medium text-gray-800">
                                {challengedList.length > 2 
                                  ? `${challengedList.slice(0, 2).join(', ')} +${challengedList.length - 2}`
                                  : challengedList.join(', ')}
                              </span>
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
                            {isParticipant && (
                              <div className="flex gap-1 flex-wrap">
                                {allParticipantsInChallenge.map(p => (
                                  <button 
                                    key={p}
                                    onClick={() => completeBet(bet.id, p)}
                                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                                  >
                                    {p} won
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                        <span className="text-sm text-gray-600">{bet.challenger} vs {Array.isArray(bet.challenged) ? bet.challenged.join(', ') : bet.challenged}</span>
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
                <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Swords className="w-5 h-5 text-purple-600" />
                    Create New Challenge
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Challenge Type Toggle */}
                    <div>
                      <label className="text-sm text-gray-600 block mb-2">Challenge Type</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNewBet({ ...newBet, isGroup: false, challenged: '' })}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${!newBet.isGroup ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          <User className="w-4 h-4" />
                          1 vs 1
                        </button>
                        <button
                          onClick={() => setNewBet({ ...newBet, isGroup: true, challenged: [] })}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${newBet.isGroup ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          <Users className="w-4 h-4" />
                          Group
                        </button>
                      </div>
                    </div>
                    
                    {/* Participant Selection */}
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">
                        {newBet.isGroup ? 'Challenge Who? (select multiple)' : 'Challenge Who?'}
                      </label>
                      
                      {newBet.isGroup ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            {allParticipants.filter(p => p !== userProfile?.linkedParticipant && p !== user?.displayName).map(p => {
                              const isSelected = Array.isArray(newBet.challenged) && newBet.challenged.includes(p);
                              return (
                                <button
                                  key={p}
                                  onClick={() => {
                                    const current = Array.isArray(newBet.challenged) ? newBet.challenged : [];
                                    if (isSelected) {
                                      setNewBet({ ...newBet, challenged: current.filter(x => x !== p) });
                                    } else {
                                      setNewBet({ ...newBet, challenged: [...current, p] });
                                    }
                                  }}
                                  className={`p-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isSelected ? 'bg-purple-100 text-purple-700 border-2 border-purple-400' : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'}`}
                                >
                                  {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                  {p}
                                </button>
                              );
                            })}
                          </div>
                          {Array.isArray(newBet.challenged) && newBet.challenged.length > 0 && (
                            <p className="text-xs text-purple-600">
                              Selected: {newBet.challenged.join(', ')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <select 
                          value={typeof newBet.challenged === 'string' ? newBet.challenged : ''}
                          onChange={(e) => setNewBet({ ...newBet, challenged: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="">Select opponent...</option>
                          {allParticipants.filter(p => p !== userProfile?.linkedParticipant && p !== user?.displayName).map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">The Challenge</label>
                      <input
                        type="text"
                        value={newBet.goal}
                        onChange={(e) => setNewBet({ ...newBet, goal: e.target.value })}
                        placeholder={newBet.isGroup ? "e.g., Everyone hits 80% completion this month" : "e.g., Complete all habits for 2 weeks"}
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
                      onClick={() => { setShowNewBet(false); setNewBet({ challenger: '', challenged: [], goal: '', reward: '', deadline: '', isGroup: false }); }}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={createBet}
                      disabled={!(newBet.isGroup ? (Array.isArray(newBet.challenged) && newBet.challenged.length > 0) : newBet.challenged) || !newBet.goal}
                      className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {newBet.isGroup ? 'Send Group Challenge' : 'Send Challenge'}
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
            
            {/* No habits - Show AI suggestions */}
            {currentWeekHabits.length === 0 ? (
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#F5F3E8] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-[#1E3A5F]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Start Your Week Fresh!</h3>
                  <p className="text-gray-500 text-sm">No habits set for this week yet. Get AI suggestions based on your past performance, or add habits manually.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                  <button 
                    onClick={suggestWeeklyHabits}
                    disabled={weekSuggestLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                  >
                    {weekSuggestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    AI Suggest Habits
                  </button>
                  <button 
                    onClick={() => setActiveView('add')} 
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#162D4D] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Manually
                  </button>
                </div>
                
                {/* AI Suggestions */}
                {weekHabitSuggestions.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      AI Suggested Habits
                    </h4>
                    <div className="space-y-2">
                      {weekHabitSuggestions.map((habit, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${habit.added ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${habit.added ? 'text-green-700' : 'text-gray-800'}`}>{habit.habit}</p>
                            <p className="text-xs text-gray-500">{habit.target} days/week</p>
                          </div>
                          {habit.added ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle2 className="w-4 h-4" />
                              Added!
                            </span>
                          ) : (
                            <button
                              onClick={() => addWeeklyHabit(habit, idx)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[#1E3A5F] text-white rounded-lg text-sm hover:bg-[#162D4D] transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Add
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* AI Suggest button when some habits exist */}
                <div className="flex justify-end mb-2">
                  <button 
                    onClick={suggestWeeklyHabits}
                    disabled={weekSuggestLoading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
                  >
                    {weekSuggestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    AI Suggest More
                  </button>
                </div>
                
                {/* AI Suggestions panel */}
                {weekHabitSuggestions.length > 0 && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Suggested Habits
                      </h4>
                      <button onClick={() => setWeekHabitSuggestions([])} className="text-purple-400 hover:text-purple-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {weekHabitSuggestions.map((habit, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${habit.added ? 'bg-green-100' : 'bg-white'}`}>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${habit.added ? 'text-green-700' : 'text-gray-800'}`}>{habit.habit}</p>
                            <p className="text-xs text-gray-500">{habit.target} days</p>
                          </div>
                          {habit.added ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <button onClick={() => addWeeklyHabit(habit, idx)} className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 flex-shrink-0">
                              Add
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Habit list */}
                {filteredHabits.sort((a, b) => (a.order || 0) - (b.order || 0)).map((h, idx) => {
                  const st = getStatus(h), cfg = STATUS_CONFIG[st];
                  const isEditing = editingHabit?.id === h.id;
                  
                  return (
                    <div key={h.id} className="bg-white rounded-xl p-3 border border-gray-100 hover:border-gray-200 transition-colors">
                      {isEditing ? (
                        <div className="flex flex-col gap-3">
                          <input
                            type="text"
                            value={editingHabit.habit}
                            onChange={(e) => setEditingHabit({ ...editingHabit, habit: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F5B800]"
                          />
                          <div className="flex items-center gap-2">
                            <select
                              value={editingHabit.target}
                              onChange={(e) => setEditingHabit({ ...editingHabit, target: e.target.value })}
                              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            >
                              {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} days</option>)}
                            </select>
                            <button onClick={updateHabit} className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">Save</button>
                            <button onClick={() => setEditingHabit(null)} className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${cfg.bgColor} ${cfg.textColor}`}>{st}</span>
                              <span className="text-gray-400 text-xs">{h.participant}</span>
                            </div>
                            <h3 className="text-gray-800 font-medium text-sm">{h.habit}</h3>
                            <p className="text-gray-400 text-xs">{h.daysCompleted.length}/{h.target} days</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Move buttons */}
                            <div className="flex flex-col mr-1">
                              <button 
                                onClick={() => moveHabit(h.id, 'up')} 
                                className="w-6 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                disabled={idx === 0}
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => moveHabit(h.id, 'down')} 
                                className="w-6 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                disabled={idx === filteredHabits.length - 1}
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>
                            {/* Day buttons */}
                            {DAYS.map((d, i) => (
                              <button 
                                key={d} 
                                onClick={() => toggleDay(h.id, i)} 
                                className={`w-8 h-8 md:w-7 md:h-7 rounded text-xs font-medium transition-colors ${h.daysCompleted.includes(i) ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              >
                                {d[0]}
                              </button>
                            ))}
                            {/* Edit button */}
                            <button 
                              onClick={() => setEditingHabit({ id: h.id, habit: h.habit, target: h.target })}
                              className="w-8 h-8 md:w-7 md:h-7 rounded bg-blue-50 text-blue-400 hover:bg-blue-100 ml-1 transition-colors"
                            >
                              <Edit3 className="w-3 h-3 mx-auto" />
                            </button>
                            {/* Delete button */}
                            <button 
                              onClick={() => deleteHabit(h.id)} 
                              className="w-8 h-8 md:w-7 md:h-7 rounded bg-red-50 text-red-400 hover:bg-red-100 ml-1 transition-colors"
                            >
                              <Trash2 className="w-3 h-3 mx-auto" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeView === 'scorecard' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">{Object.entries(rangeLabels).map(([k, v]) => <button key={k} onClick={() => setScorecardRange(k)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${scorecardRange === k ? 'bg-[#1E3A5F] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#F5B800]'}`}>{v}</button>)}</div>
            {allParticipants.map(p => {
              const pH = getRangeHabits.filter(h => h.participant === p);
              const completed = pH.filter(h => ['Done', 'Exceeded'].includes(getStatus(h))).length;
              const rate = pH.length > 0 ? Math.round((completed / pH.length) * 100) : 0;
              const profile = getProfileByParticipant(p);
              return (
                <div key={p} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => openProfileView(p)} className="flex items-center gap-3 hover:opacity-80">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: PARTICIPANT_COLORS[p] || '#6366f1' }}>{p[0]}</div>
                      )}
                      <h3 className="font-bold text-gray-800">{p}</h3>
                    </button>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: PARTICIPANT_COLORS[p] || '#6366f1' }}>{rate}%</p>
                      <p className="text-xs text-gray-400">completion</p>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: PARTICIPANT_COLORS[p] || '#6366f1' }} />
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-gray-800">{pH.length}</p>
                      <p className="text-xs text-gray-400">Total</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-green-600">{completed}</p>
                      <p className="text-xs text-gray-400">Completed</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-emerald-600">{pH.filter(h => getStatus(h) === 'Exceeded').length}</p>
                      <p className="text-xs text-gray-400">Exceeded</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-red-500">{pH.filter(h => getStatus(h) === 'Missed').length}</p>
                      <p className="text-xs text-gray-400">Missed</p>
                    </div>
                  </div>
                </div>
              );
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
                  {aiResponse && (
                    <button 
                      onClick={() => { setAiResponse(''); setAiConversation([]); setSuggestedHabits([]); }}
                      className="ml-auto text-xs text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {aiLoading ? (
                  <div className="flex items-center gap-3 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-gray-700 text-sm mb-4">
                      <Markdown>{aiResponse}</Markdown>
                    </div>
                    
                    {/* Suggested Habits with Add Buttons */}
                    {suggestedHabits.length > 0 && (
                      <div className="border-t border-gray-100 pt-4 mt-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Quick Add Habits
                        </h4>
                        <div className="space-y-2">
                          {suggestedHabits.map((habit, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${habit.added ? 'bg-green-50' : 'bg-gray-50'}`}>
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${habit.added ? 'text-green-700' : 'text-gray-800'}`}>
                                  {habit.habit}
                                </p>
                                <p className="text-xs text-gray-500">{habit.target} days/week</p>
                              </div>
                              {habit.added ? (
                                <span className="flex items-center gap-1 text-green-600 text-sm">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Added!
                                </span>
                              ) : (
                                <button
                                  onClick={() => addSuggestedHabit(habit, idx)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-[#1E3A5F] text-white rounded-lg text-sm hover:bg-[#162D4D] transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Follow-up Conversation */}
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={aiFollowUp}
                          onChange={(e) => setAiFollowUp(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && aiFollowUp.trim() && callAI('follow-up', '', aiFollowUp)}
                          placeholder="Ask a follow-up question..."
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F5B800]"
                        />
                        <button
                          onClick={() => callAI('follow-up', '', aiFollowUp)}
                          disabled={aiLoading || !aiFollowUp.trim()}
                          className="px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#162D4D] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
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
                    
                    {/* Improved Application Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-[#F5F3E8] rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-[#0F2940] mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Personal Application
                        </h4>
                        <ul className="space-y-2">
                          {(Array.isArray(quote.personalApplication) 
                            ? quote.personalApplication 
                            : (quote.personalApplication || '').split(/[.•]/).filter(s => s.trim())
                          ).map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-[#F5B800] mt-0.5">•</span>
                              <span>{typeof item === 'string' ? item.trim() : item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Business Application
                        </h4>
                        <ul className="space-y-2">
                          {(Array.isArray(quote.businessApplication) 
                            ? quote.businessApplication 
                            : (quote.businessApplication || '').split(/[.•]/).filter(s => s.trim())
                          ).map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{typeof item === 'string' ? item.trim() : item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {/* AI Habit Suggestions from Quote */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Apply This Wisdom to Your Habits
                        </h4>
                        <button
                          onClick={() => suggestHabitsFromQuote(quote)}
                          disabled={quoteHabitLoading}
                          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                          {quoteHabitLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Wand2 className="w-3 h-3" />
                          )}
                          Suggest Habits
                        </button>
                      </div>
                      
                      {quoteHabitSuggestions.length > 0 ? (
                        <div className="space-y-2">
                          {quoteHabitSuggestions.map((habit, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${habit.added ? 'bg-green-100' : 'bg-white'}`}>
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${habit.added ? 'text-green-700' : 'text-gray-800'}`}>
                                  {habit.habit}
                                </p>
                                <p className="text-xs text-gray-500">{habit.target} days/week</p>
                              </div>
                              {habit.added ? (
                                <span className="flex items-center gap-1 text-green-600 text-sm">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Added!
                                </span>
                              ) : (
                                <button
                                  onClick={() => addQuoteHabit(habit, idx)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700 transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add Habit
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-purple-600/70 text-center py-2">
                          Click "Suggest Habits" to get AI-powered habit ideas based on this quote's wisdom
                        </p>
                      )}
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
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Profile Header with Photo Upload */}
            <div className="bg-gradient-to-br from-[#1E3A5F] to-[#0F2940] rounded-2xl p-6 text-white">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Profile Photo with Upload */}
                <div className="relative group">
                  {profilePhotoPreview || userProfile?.photoURL || user?.photoURL ? (
                    <img 
                      src={profilePhotoPreview || userProfile?.photoURL || user?.photoURL} 
                      alt="" 
                      className="w-28 h-28 rounded-full border-4 border-white/20 object-cover" 
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center">
                      <User className="w-14 h-14 text-white" />
                    </div>
                  )}
                  <input
                    type="file"
                    ref={profilePhotoRef}
                    onChange={handleProfilePhotoSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => profilePhotoRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-[#F5B800] rounded-full flex items-center justify-center text-[#1E3A5F] hover:bg-[#E5AB00] transition-colors shadow-lg"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-center md:text-left flex-1">
                  <h2 className="text-2xl font-bold">{userProfile?.displayName || user?.displayName || 'Anonymous'}</h2>
                  <p className="text-white/60">{user?.email}</p>
                  {userProfile?.location && (
                    <div className="flex items-center justify-center md:justify-start gap-1 mt-1 text-white/70">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{userProfile.location}</span>
                    </div>
                  )}
                  {userProfile?.linkedParticipant && (
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                      <span className="px-3 py-1 bg-[#F5B800] text-[#1E3A5F] rounded-lg text-sm font-medium">
                        🎯 {userProfile.linkedParticipant}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Quick Stats */}
                {userProfile?.linkedParticipant && (() => {
                  const myStats = leaderboard.find(l => l.name === userProfile.linkedParticipant);
                  const myStreak = calculateStreaks[userProfile.linkedParticipant] || 0;
                  return myStats ? (
                    <div className="flex gap-4 md:gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-[#F5B800]">{myStats.rate}%</p>
                        <p className="text-xs text-white/60">Completion</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-[#F5B800]">{myStats.score}</p>
                        <p className="text-xs text-white/60">Points</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-orange-400">{myStreak}🔥</p>
                        <p className="text-xs text-white/60">Streak</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Profile Settings - Left Column */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-[#1E3A5F]" />
                    Edit Profile
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <label className="text-sm text-gray-600 block mb-1">Location</label>
                      <input
                        type="text"
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        placeholder="City, Country"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F5B800]"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-600 block mb-1">Bio</label>
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={2}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F5B800] resize-none"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-600 block mb-1">Goals & Motivations</label>
                      <textarea
                        value={profileForm.goals}
                        onChange={(e) => setProfileForm({ ...profileForm, goals: e.target.value })}
                        placeholder="What are you working towards?"
                        rows={2}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F5B800] resize-none"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-600 block mb-1">Link to Habit Tracker</label>
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
                  </div>
                  
                  <button
                    onClick={saveProfile}
                    className="w-full mt-4 py-2 bg-[#1E3A5F] text-white rounded-lg font-medium hover:bg-[#162D4D] transition-colors"
                  >
                    Save Profile
                  </button>
                </div>
                
                {/* Active Challenges */}
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Swords className="w-5 h-5 text-purple-500" />
                    Active Challenges
                  </h3>
                  {(() => {
                    const myChallenges = bets.filter(b => 
                      (b.status === 'pending' || b.status === 'accepted') &&
                      (b.challenger === userProfile?.linkedParticipant || 
                       (Array.isArray(b.challenged) ? b.challenged.includes(userProfile?.linkedParticipant) : b.challenged === userProfile?.linkedParticipant) ||
                       b.challengerId === user?.uid)
                    );
                    return myChallenges.length > 0 ? (
                      <div className="space-y-3">
                        {myChallenges.map(bet => (
                          <div key={bet.id} className={`p-3 rounded-lg ${bet.status === 'pending' ? 'bg-purple-50 border border-purple-100' : 'bg-yellow-50 border border-yellow-200'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded ${bet.status === 'pending' ? 'bg-purple-200 text-purple-700' : 'bg-yellow-200 text-yellow-700'}`}>
                                  {bet.status}
                                </span>
                                <span className="font-medium text-gray-800">{bet.challenger} vs {Array.isArray(bet.challenged) ? bet.challenged.join(', ') : bet.challenged}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{bet.goal}</p>
                            {bet.reward && <p className="text-xs text-gray-500 mt-1">🎁 {bet.reward}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm text-center py-4">No active challenges</p>
                    );
                  })()}
                </div>
              </div>
              
              {/* Right Sidebar */}
              <div className="space-y-4">
                {/* Challenge Stats */}
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">Challenge Record</h3>
                  {(() => {
                    const wonChallenges = bets.filter(b => 
                      b.status === 'completed' && 
                      (b.winner === userProfile?.linkedParticipant)
                    ).length;
                    const lostChallenges = bets.filter(b => 
                      b.status === 'completed' && 
                      (b.challenger === userProfile?.linkedParticipant || (Array.isArray(b.challenged) ? b.challenged.includes(userProfile?.linkedParticipant) : b.challenged === userProfile?.linkedParticipant)) &&
                      b.winner !== userProfile?.linkedParticipant
                    ).length;
                    return (
                      <div className="flex items-center justify-around">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{wonChallenges}</p>
                          <p className="text-xs text-gray-500">Won</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-500">{lostChallenges}</p>
                          <p className="text-xs text-gray-500">Lost</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Team Members */}
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">Team Members</h3>
                  <div className="space-y-2">
                    {allParticipants.map(p => {
                      const profile = getProfileByParticipant(p);
                      return (
                        <button 
                          key={p}
                          onClick={() => openProfileView(p)}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          {profile?.photoURL ? (
                            <img src={profile.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-sm font-medium">
                              {p[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{p}</p>
                            {profile?.bio && <p className="text-xs text-gray-400 truncate">{profile.bio}</p>}
                          </div>
                          <Eye className="w-4 h-4 text-gray-300" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Account Actions */}
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
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
        
        {/* Profile Viewing Modal - for viewing other participants */}
        {viewingProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
              {/* Modal Header */}
              <div className="bg-gradient-to-br from-[#1E3A5F] to-[#0F2940] rounded-t-2xl p-6 text-white relative">
                <button 
                  onClick={() => setViewingProfile(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-4">
                  {viewingProfile.photoURL ? (
                    <img src={viewingProfile.photoURL} alt="" className="w-20 h-20 rounded-full border-4 border-white/20 object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-3xl font-bold">{viewingProfile.participantName?.[0] || '?'}</span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{viewingProfile.displayName || viewingProfile.participantName}</h2>
                    {viewingProfile.location && (
                      <div className="flex items-center gap-1 mt-1 text-white/70">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{viewingProfile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 bg-[#F5B800] text-[#1E3A5F] rounded-lg text-sm font-medium">
                        🎯 {viewingProfile.participantName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-6">
                {/* Stats Row */}
                {(() => {
                  const stats = leaderboard.find(l => l.name === viewingProfile.participantName);
                  const streak = calculateStreaks[viewingProfile.participantName] || 0;
                  return stats ? (
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-3 bg-purple-50 rounded-xl">
                        <p className="text-2xl font-bold text-purple-600">{stats.rate}%</p>
                        <p className="text-xs text-purple-500">Completion</p>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-xl">
                        <p className="text-2xl font-bold text-amber-600">{stats.score}</p>
                        <p className="text-xs text-amber-500">Points</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-xl">
                        <p className="text-2xl font-bold text-orange-600">{streak}🔥</p>
                        <p className="text-xs text-orange-500">Streak</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <p className="text-2xl font-bold text-blue-600">#{leaderboard.findIndex(l => l.name === viewingProfile.participantName) + 1}</p>
                        <p className="text-xs text-blue-500">Rank</p>
                      </div>
                    </div>
                  ) : null;
                })()}
                
                {/* Bio */}
                {viewingProfile.bio && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">About</h4>
                    <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3">{viewingProfile.bio}</p>
                  </div>
                )}
                
                {/* Goals */}
                {viewingProfile.goals && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Goals & Motivations</h4>
                    <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3">{viewingProfile.goals}</p>
                  </div>
                )}
                
                {/* Active Challenges */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Active Challenges</h4>
                  {(() => {
                    const theirChallenges = bets.filter(b => 
                      (b.status === 'pending' || b.status === 'accepted') &&
                      (b.challenger === viewingProfile.participantName || (Array.isArray(b.challenged) ? b.challenged.includes(viewingProfile.participantName) : b.challenged === viewingProfile.participantName))
                    );
                    return theirChallenges.length > 0 ? (
                      <div className="space-y-2">
                        {theirChallenges.map(bet => (
                          <div key={bet.id} className="p-3 bg-purple-50 rounded-lg text-sm">
                            <div className="flex items-center gap-2">
                              <Swords className="w-4 h-4 text-purple-500" />
                              <span className="font-medium">{bet.challenger}</span>
                              <span className="text-gray-400">vs</span>
                              <span className="font-medium">{Array.isArray(bet.challenged) ? bet.challenged.join(', ') : bet.challenged}</span>
                            </div>
                            <p className="text-gray-600 mt-1">{bet.goal}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No active challenges</p>
                    );
                  })()}
                </div>
                
                {/* Challenge Record */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Challenge Record</h4>
                  {(() => {
                    const won = bets.filter(b => b.status === 'completed' && b.winner === viewingProfile.participantName).length;
                    const lost = bets.filter(b => 
                      b.status === 'completed' && 
                      (b.challenger === viewingProfile.participantName || (Array.isArray(b.challenged) ? b.challenged.includes(viewingProfile.participantName) : b.challenged === viewingProfile.participantName)) &&
                      b.winner !== viewingProfile.participantName
                    ).length;
                    return (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
                          <Trophy className="w-4 h-4 text-green-600" />
                          <span className="font-bold text-green-600">{won}</span>
                          <span className="text-sm text-green-600">Won</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="font-bold text-red-500">{lost}</span>
                          <span className="text-sm text-red-500">Lost</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Challenge Button */}
                {viewingProfile.participantName !== userProfile?.linkedParticipant && (
                  <button
                    onClick={() => {
                      setViewingProfile(null);
                      setNewBet({ ...newBet, challenged: viewingProfile.participantName });
                      setShowNewBet(true);
                      setActiveView('compete');
                    }}
                    className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Swords className="w-5 h-5" />
                    Challenge {viewingProfile.participantName}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <MobileNav activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
}
