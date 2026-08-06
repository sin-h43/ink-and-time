import AuthGate from "@/components/Authgate";
import DoMEApp from "@/components/doMEApp";
export default function Home() {
  return (

<main className = "dome-shell">
  <AuthGate >
        <DoMEApp />
      </AuthGate>
    </main>
  );
}