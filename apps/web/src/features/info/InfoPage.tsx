import { Card, Page } from "../../components/ui/index.ts";

const title = import.meta.env.VITE_APP_TITLE || "My App";
const description = import.meta.env.VITE_APP_DESCRIPTION || "";

// About the app: what it is and how to install it.
export function InfoPage() {
  return (
    <Page title="Information" intro={description || undefined}>
      <Card title={`About ${title}`}>
        <p>It works without an internet connection, and your data stays on this device.</p>
      </Card>
      <Card title="Install it">
        <p>
          Open the browser menu and choose <strong>Install app</strong> or{" "}
          <strong>Add to Home screen</strong>. It then opens like any other app.
        </p>
      </Card>
    </Page>
  );
}
