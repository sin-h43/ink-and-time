import AuthGate from "@/components/Authgate";
import DoMEApp from "@/components/doMEApp";
import AuthProvider from "@/lib/Authcontext";
export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      <AuthProvider>
      <AuthGate>
        <DoMEApp />
      </AuthGate>

      </AuthProvider>
    </main>
  );
}