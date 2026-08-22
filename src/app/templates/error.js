'use client';
export default function TemplatesErrorBoundary({ error }) {
  return (
    <div style={{ padding: 20, color: 'red' }}>
      <h1>Templates Error: {error.message}</h1>
      <pre>{error.stack}</pre>
    </div>
  );
}
