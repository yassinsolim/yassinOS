import Link from "next/link";
import Head from "next/head";
import { memo } from "react";

const NotFound = (): React.ReactElement => (
  <>
    <Head>
      <title>Page Not Found</title>
    </Head>
    <main
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        justifyContent: "center",
        minHeight: "70vh",
        padding: "32px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 28, margin: 0 }}>404 – Page Not Found</h1>
      <p style={{ color: "#666", margin: 0 }}>
        The page you are looking for doesn&apos;t exist or was moved.
      </p>
      <Link
        href="/"
        style={{
          border: "1px solid #333",
          borderRadius: 8,
          padding: "10px 14px",
          textDecoration: "none",
        }}
      >
        Return to desktop
      </Link>
    </main>
  </>
);

export default memo(NotFound);
