import { supabase } from '@/lib/supabase';
import AdminList from './AdminList';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const { data: interviews, error } = await supabase
    .from('interviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="p-10 text-red-500 font-bold">Error loading interviews: {error.message}</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black uppercase">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">똑디 견적 인터뷰 고객 리드 관리 시스템</p>
          </div>
          <div className="bg-black text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em]">
            Total {interviews?.length || 0}
          </div>
        </header>

        <AdminList initialInterviews={interviews || []} />
      </div>
    </main>
  );
}

