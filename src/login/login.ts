import { IHttpClient, json } from '@aurelia/fetch-client';
import { IRouter } from '@aurelia/router';
import { inject } from 'aurelia';
import Swal from 'sweetalert2';

@inject(IHttpClient, IRouter)
export class Login {
    public username = '';
    public password = '';
    public isLoading = false;

    constructor(
        private http: IHttpClient,
        private router: IRouter
    ) {
        this.http.configure(config => {
            config.withBaseUrl('http://localhost:5000/api/');
        });
    }

    async login() {
        if (!this.username || !this.password) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณากรอกข้อมูล',
                text: 'โปรดระบุชื่อผู้ใช้และรหัสผ่านเพื่อเข้าสู่ระบบ',
                confirmButtonColor: '#ffc107'
            });
            return;
        }

        Swal.fire({
            title: 'กำลังตรวจสอบข้อมูล...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        this.isLoading = true;

        try {
            const response = await this.http.fetch('Auth/login', {
                method: 'POST',
                body: json({
                    username: this.username,
                    password: this.password
                })
            });

            if (response.ok) {
                const data = await response.json();

                // เก็บข้อมูลลง LocalStorage
                localStorage.setItem('username', data.username);
                localStorage.setItem('role', data.role);
                localStorage.setItem('roomId', data.roomId);

                // แสดงแจ้งเตือนสำเร็จ
                await Swal.fire({
                    icon: 'success',
                    title: 'เข้าสู่ระบบสำเร็จ',
                    text: `สวัสดีคุณ ${data.username}`,
                    timer: 1000,
                    showConfirmButton: false
                });

                // ✅ เปลี่ยนหน้าและบังคับ Refresh เพื่อให้ Navbar อัปเดตชื่อทันที
                if (data.role === 'Admin') {
                    window.location.href = '#/dashboard';
                } else {
                    window.location.href = '#/user-dashboard';
                }

                // ⚡ สั่งรีโหลดหน้าจอ 1 ครั้ง
                window.location.reload();

            } else if (response.status === 401) {
                Swal.fire({
                    icon: 'error',
                    title: 'ข้อมูลไม่ถูกต้อง',
                    text: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
                    confirmButtonColor: '#d33'
                });
            } else {
                Swal.fire('เกิดข้อผิดพลาด', `Error: ${response.statusText}`, 'error');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้',
                text: 'กรุณาตรวจสอบการเชื่อมต่อ Backend',
                footer: '<span class="text-muted">Localhost:5000 อาจจะยังไม่ทำงาน</span>'
            });
        } finally {
            this.isLoading = false;
        }
    }
}