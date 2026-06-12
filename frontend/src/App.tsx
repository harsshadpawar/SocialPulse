import { TodayPage } from './pages/TodayPage';

// Routing (react-router) arrives in M2 with the New Idea page.
// v0.1 nav graph: Today ⇄ Editor, Today → New Idea → Editor. App opens directly into Today.
export function App() {
  return <TodayPage />;
}
