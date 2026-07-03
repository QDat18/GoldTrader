import React from 'react';
import { Outlet } from 'react-router-dom';

export default function BlankLayout() {
  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Outlet />
    </main>
  );
}
