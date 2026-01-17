'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, FileCode, Settings } from 'lucide-react';

export default function SidebarNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
      // Para dashboard exacto
      if (href === '/admin') {
          return pathname === '/admin';
      }
      // Para subrutas
      return pathname.startsWith(href);
  };

  const navItems = [
    { href: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { href: '/admin/users', icon: <Users size={20} />, label: 'Usuarios' },
    { href: '/admin/artifacts', icon: <FileCode size={20} />, label: 'Artefactos' },
    { href: '/admin/settings', icon: <Settings size={20} />, label: 'Configuración' },
  ];

  return (
    <nav className="flex-1 p-4 space-y-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive(item.href)
              ? 'bg-[#0A2540] text-[#00D4B3] shadow-lg shadow-[#00D4B3]/5'
              : 'text-[#94A3B8] hover:bg-[#1E2329] hover:text-white'
          }`}
        >
          {item.icon}
          <span className="font-medium text-sm">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
