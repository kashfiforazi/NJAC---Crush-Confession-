export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="text-4xl font-heading font-extrabold mb-6">Terms of Service</h1>
      <div className="glass-card p-8 space-y-4 prose dark:prose-invert">
        <p>By using NJAC Crush & Confession, you agree to the following terms:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Do not post hateful, bullying, or illegal content.</li>
          <li>We reserve the right to remove or reject any confession.</li>
          <li>Be respectful of others.</li>
        </ul>
      </div>
    </div>
  );
}
