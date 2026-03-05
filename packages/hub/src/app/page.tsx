export default function HomePage() {
  return (
    <main style={{ maxWidth: 600, margin: "4rem auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Agora Hub</h1>
      <p>Federation identity and reputation service for the Christian Debate network.</p>
      <p>
        This service provides OpenID Connect authentication so that users can
        maintain a single identity across all federated debate sites.
      </p>
    </main>
  );
}
