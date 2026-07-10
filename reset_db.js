import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
let supabaseUrl = '';
let supabaseAnonKey = '';

for (const line of envLines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = line.split('=')[1].trim();
  }
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Đang khởi tạo tài khoản admin...');
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: 'admin@gmail.com',
    password: '123456',
  });

  if (signUpErr) {
    if (signUpErr.message.includes('already registered')) {
        console.error('Lỗi: Email admin@gmail.com đã tồn tại trong hệ thống. Hãy chắc chắn bạn đã xóa sạch cơ sở dữ liệu trước khi chạy script này.');
    } else {
        console.error('Lỗi khi tạo user auth:', signUpErr.message);
    }
  } else {
    // Chờ 2 giây để trigger DB tạo user_profile tự động (nếu có)
    await new Promise(resolve => setTimeout(resolve, 2000));
      
    const userId = signUpData.user?.id;
    if (userId) {
      console.log('Tạo auth user thành công:', userId);
      // Create or update user_profile with admin role
      const { error: profileErr } = await supabase.from('user_profiles').upsert({
        auth_user_id: userId,
        full_name: 'Quản trị viên',
        phone: '0901234567',
        id_card_number: '000000000000',
        kyc_status: 'VERIFIED',
        role: 'admin'
      }, { onConflict: 'auth_user_id' });
      
      if (profileErr) {
        console.error('Lỗi khi gán quyền admin cho user profile:', profileErr.message);
      } else {
        console.log('Đã tạo thành công tài khoản: admin@gmail.com - 123456 mang quyền Admin!');
      }
    }
  }
}

run();
