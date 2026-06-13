import { Route, Routes } from 'react-router-dom';
import { CalendarPage } from './pages/CalendarPage';
import { EditorPage } from './pages/EditorPage';
import { GoalsPage } from './pages/GoalsPage';
import { NewIdeaPage } from './pages/NewIdeaPage';
import { TodayPage } from './pages/TodayPage';
import { WeeklyReviewPage } from './pages/WeeklyReviewPage';

// v0.1 execution graph: Today ⇄ Editor, Today → New Idea → Editor.
// v0.2d planning graph (D-46): Today · Calendar · Goals via the NavHeader switch.
// Result is a state inside the editor, never a route.
export function App() {
  return (
    <Routes>
      <Route path="/" element={<TodayPage />} />
      <Route path="/ideas/new" element={<NewIdeaPage />} />
      <Route path="/posts/:id" element={<EditorPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/review" element={<WeeklyReviewPage />} />
    </Routes>
  );
}
