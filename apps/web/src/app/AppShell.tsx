import { Outlet } from "react-router";
import { Footer } from "./Footer.tsx";
import { Header } from "./Header.tsx";

// The layout of every screen: header, the screen itself, footer.
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-content flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
