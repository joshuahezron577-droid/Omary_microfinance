'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/superbase';
import Sidebar from '../../components/admin/SideBar';
import TopNav from '../../components/admin/TopNav';
import StatsCards from '../../components/admin/StatsCards';
import LineChartSection from '../../components/admin/LineChartSecton';
import PendingRequestsTable from '../../components/admin/PendingReguestTable';
import Footer from '../../components/admin/Footer';

export default function AdminDashboard() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/log_in';
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Kama si admin — mrudishe user dashboard
      if (!profile || profile.role !== 'admin') {
        window.location.href = '/user_dashbourd';
        return;
      }

      setChecking(false);
    };

    checkRole();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0c0f0e] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0c0f0e] text-white flex font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        
        <main className="flex-1 min-w-0 p-4 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Admin Dashboard</h2>
            <p className="text-xs text-neutral-400 mt-1">Platform overview — users, loan requests, and active loans.</p>
          </div>

          <StatsCards />
          <LineChartSection />
          <PendingRequestsTable />
        </main>
        <Footer />
      </div>
    </div>
  );
}
