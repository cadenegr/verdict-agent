import { Card, Page } from "../../components/ui/index.ts";

// Placeholder: this app has no accounts. Replace it when a project adds sign-in.
export function ProfilePage() {
  return (
    <Page title="Profile">
      <Card title="No account needed">
        <p>Everything you add stays on this device. Nothing is sent anywhere.</p>
      </Card>
    </Page>
  );
}
