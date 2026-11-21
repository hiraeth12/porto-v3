import Link from "next/link";
import "@/components/ui/project-detail/project-detail.css";

export default function ProjectNotFound() {
  return (
    <div className="pd-page-shell">
      <header className="pd-top-bar">
        <div className="pd-nav-left">
          <Link href="/documents" className="pd-back-btn">
            <span>← Back to Finder Explorer</span>
          </Link>
        </div>
      </header>

      <main
        style={{
          maxWidth: "var(--portfolio-content-width)",
          margin: "auto",
          textAlign: "center",
          padding: "64px 20px",
        }}
      >
        <span className="pd-eyebrow-pill">404 · Not Found</span>
        <h1
          className="pd-title"
          style={{ marginTop: "18px", marginBottom: "14px" }}
        >
          Project showcase unavailable.
        </h1>
        <p
          className="pd-description"
          style={{ marginInline: "auto", marginBottom: "28px" }}
        >
          The requested project entry could not be located in the portfolio
          archive.
        </p>
        <div
          className="pd-actions-row"
          style={{ justifyContent: "center" }}
        >
          <Link href="/documents" className="pd-cta-btn pd-cta-btn--primary">
            <span>Open Finder Explorer</span>
          </Link>
          <Link href="/#work" className="pd-cta-btn pd-cta-btn--secondary">
            <span>Return Home</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
