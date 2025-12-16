// components/Layout.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

// 🔴 REMOVIDO: O componente GlobalPrintStyles e sua lógica de estilos agressivos foram excluídos.

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 🔴 A chamada ao GlobalPrintStyles FOI REMOVIDA DAQUI */}

      <Sidebar />
      <main className="pl-64">
        <div className="container mx-auto p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;