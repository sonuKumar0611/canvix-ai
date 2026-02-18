export default function FooterSection() {
  return (
    <footer className="py-16">
      <div className="mx-auto max-w-5xl px-6">
        <span className="text-muted-foreground block text-center text-sm">
          {" "}
          © {new Date().getFullYear()} Canvix AI, All rights reserved
        </span>
      </div>
    </footer>
  );
}
