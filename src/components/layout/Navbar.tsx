import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/sets", label: "Sets" },
  { href: "/cards", label: "Cards" },
  { href: "/collection", label: "Collection" },
  { href: "/missing", label: "Missing" },
];

export function Navbar() {
  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14 gap-8">
          <Link href="/" className="font-bold text-lg tracking-tight">
            VS System
          </Link>
          <div className="flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
