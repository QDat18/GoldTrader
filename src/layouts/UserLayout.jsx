import React from 'react';
import { Outlet } from 'react-router-dom';
import { UserNavbar } from '../components/Navbar';
import Ticker from '../components/Ticker';
import Footer from '../components/Footer';

export default function UserLayout() {
  return (
    <>
      <UserNavbar />
      <Ticker />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
