// components/Navigation.tsx
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="mb-6">
      <ul className="flex gap-6">
        <li>
          <Link href="/admin/messages">
            <a className="text-lg text-[#1a4d4f] hover:underline">المراسلات</a>
          </Link>
        </li>
        <li>
          <Link href="/admin/emails">
            <a className="text-lg text-[#1a4d4f] hover:underline">البريد الإلكتروني</a>
          </Link>
        </li>
      </ul>
    </nav>
  );
}