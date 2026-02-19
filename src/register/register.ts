import { IHttpClient, json } from '@aurelia/fetch-client';
import { IRouter } from '@aurelia/router';
import { inject } from 'aurelia';

@inject(IHttpClient, IRouter)
export class Register {
    public username = '';
    public password = '';
    public roomId = '';

    constructor(private http: IHttpClient, private router: IRouter) {}

    async register() {
        try {
            const response = await this.http.fetch('http://localhost:5000/api/Auth/register', {
                method: 'POST',
                body: json({
                    username: this.username,
                    password: this.password,
                    roomId: Number(this.roomId),
                    role: 'User' // กำหนดเป็นผู้เช่าโดยอัตโนมัติ
                })
            });

            if (response.ok) {
                alert('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ');
                this.router.load('login');
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการลงทะเบียน');
        }
    }
}