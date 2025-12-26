import { ThemeToggle } from "../theme-toggle";

export default function ThemeToggleExample() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">Tema</h2>
        <ThemeToggle />
      </div>
    </div>
  );
}
