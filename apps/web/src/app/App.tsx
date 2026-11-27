import { BrowserRouter, Route, Routes } from "react-router";
import { HomePage } from "../features/home/HomePage.tsx";
import { InfoPage } from "../features/info/InfoPage.tsx";
import { ProfilePage } from "../features/profile/ProfilePage.tsx";
import { SettingsPage } from "../features/settings/SettingsPage.tsx";
import { TasksPage } from "../features/tasks/TasksPage.tsx";
import { AppShell } from "./AppShell.tsx";

// The app's screens. Each feature lives in src/features/<name>/;
// add its route here and its entry in sections.ts.
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="info" element={<InfoPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
