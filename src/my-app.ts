// ✅ วิธีแก้: ลอง Import แบบระบุชื่อให้ครบ หรือใช้ชื่อที่ TypeScript รู้จักแน่นอน
import { Route } from '@aurelia/router';
import { Dashboard } from './dashboard/dashboard';
import { Login } from './login/login';
import { Register } from './register/register';
import { UserDashboard } from './user-dashboard/user-dashboard';
import Swal from 'sweetalert2';

export class MyApp {
  public username: string | null = '';

  static routes = [
    { path: ['', 'login'], component: Login, title: 'เข้าสู่ระบบ' },
    { path: 'dashboard', component: Dashboard, title: 'หน้าหลัก Admin' },
    { path: 'register', component: Register, title: 'ลงทะเบียน' },
    { path: 'user-dashboard', component: UserDashboard, title: 'ข้อมูลบิลของคุณ' }
  ];

  attached() {
    this.username = localStorage.getItem('username');
  }

  async logout() {
    const result = await Swal.fire({
      title: 'ออกจากระบบ?',
      text: "คุณต้องการออกจากระบบใช่หรือไม่?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      localStorage.clear();
      
      await Swal.fire({
        icon: 'success',
        title: 'ออกจากระบบสำเร็จ',
        timer: 1000,
        showConfirmButton: false
      });
      
      window.location.href = '#/login';

      window.location.reload();
    }
  }
}