import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import {
  GridIcon,
  BoxCubeIcon,
  GroupIcon,
  ListIcon,
  PieChartIcon,
  UserIcon,
  HorizontaLDots,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";

const ALL_NAV_ITEMS = [
  { icon: <GridIcon />, name: "Dashboard", path: "/", roles: ["admin", "analista"] },
  { icon: <BoxCubeIcon />, name: "Inventario", path: "/inventory", roles: ["admin", "proveedor"] },
  { icon: <GroupIcon />, name: "Clientes", path: "/customers", roles: ["admin", "analista"] },
  { icon: <ListIcon />, name: "Pedidos", path: "/orders", roles: ["admin", "vendedor"] },
  { icon: <PieChartIcon />, name: "Analytics", path: "/analytics", roles: ["admin", "analista"] },
  { icon: <UserIcon />, name: "Usuarios", path: "/users", roles: ["admin"] },
];

const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();

  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  const visibleNavItems = ALL_NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const renderMenuItems = (items) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav) => (
        <li key={nav.name}>
          <Link
            to={nav.path}
            className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
          >
            <span className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
              {nav.icon}
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className="menu-item-text">{nav.name}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <span className="text-xl font-bold text-gray-800 dark:text-white/90">Dashboard ERP</span>
          ) : (
            <span className="text-xl font-bold text-gray-800 dark:text-white/90">DE</span>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Menú" : <HorizontaLDots className="size-6" />}
              </h2>
              {renderMenuItems(visibleNavItems)}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;