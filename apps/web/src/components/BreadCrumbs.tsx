"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Ported from frontend/src/components/BreadCrumbs.tsx. react-router's
 * `useLocation()` / `Link` -> Next's `usePathname()` (next/navigation) /
 * `Link` (next/link). Behavior (path-segment breadcrumb trail) is
 * unchanged.
 */
export default function Breadcrumbs() {
  const pathname = usePathname();
  const pathnames = pathname.split("/").filter((x) => x);

  return (
    <nav aria-label="Breadcrumb" className="breadcrumb-nav">
      <ol className="flex list-none p-0">
        <li className="breadcrumb-item">
          <Link title="Home" href="/">
            Home
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;

          return (
            <li key={to} className={`breadcrumb-item ${last ? "active" : ""}`}>
              <span className="separator"> / </span>
              {last ? (
                <span aria-current="page">{value.replace(/-/g, " ")}</span>
              ) : (
                <Link href={to}>{value.replace(/-/g, " ")}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
