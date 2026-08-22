'use client';
export default function ErrorBoundary({ error }) {
  return (
    <div style={{ padding: 20, color: 'red' }}>
      <h1>Avenix Error: {error.message}</h1>
      <pre>{error.stack}</pre>
    </div>
  );
}
