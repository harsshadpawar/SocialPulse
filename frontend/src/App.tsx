import { Route, Routes } from 'react-router-dom';
import { EditorPage } from './pages/EditorPage';
import { NewIdeaPage } from './pages/NewIdeaPage';
import { TodayPage } from './pages/TodayPage';

// The whole v0.1 nav graph: Today ⇄ Editor, Today → New Idea → Editor.
// No other routes exist; Result is a state inside the editor, never a route.
export function App() {
  return (
    <Routes>
      <Route path="/" element={<TodayPage />} />
      <Route path="/ideas/new" element={<NewIdeaPage />} />
      <Route path="/posts/:id" element={<EditorPage />} />
    </Routes>
  );
}
