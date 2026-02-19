import { HttpClient, json } from '@aurelia/fetch-client';
import { resolve } from 'aurelia';
import { IRoom } from '../models/room';
import Swal from 'sweetalert2';

export class Dashboard {
    private http = resolve(HttpClient);
    public rooms: IRoom[] = [];

    // --- ตัวแปรสำหรับควบคุมการกรองข้อมูล ---
    public searchTerm: string = '';
    public filterStatus: string = 'All';
    public filterType: string = 'All';

    // --- ตัวแปรสำหรับ Modal เช็คอิน ---
    public showModal: boolean = false;
    public tenantName: string = '';
    public tenantPhone: string = '';
    public selectedRoom: IRoom | null = null;

    // --- ตัวแปรสำหรับค่าน้ำค่าไฟ ---
    public showUtilityModal = false;
    public prevElectric = 0;
    public currElectric = 0;
    public prevWater = 0;
    public currWater = 0;

    // ✅ เพิ่มตัวแปรสำหรับระบบจัดการสลิป (เพื่อให้ my-app.ts และ dashboard.html หายแดง)
    public pendingPayments: any[] = [];
    public showSlipModal: boolean = false;
    public selectedSlipUrl: string = '';

    async attached() {
        await this.loadRooms();
        await this.loadPendingPayments(); // ⚡ ดึงข้อมูลสลิปทันทีที่เข้าหน้าจอ
    }

    async loadRooms() {
        try {
            const response = await this.http.fetch('http://localhost:5000/api/Room');
            if (response.ok) {
                this.rooms = await response.json();
            }
        } catch (error) {
            console.error('ดึงข้อมูลไม่สำเร็จ:', error);
        }
    }

    // ✅ ฟังก์ชันดึงรายการสลิปที่รอตรวจสอบจาก Backend
    // ✅ แก้ไขฟังก์ชันดึงรายการสลิปเพื่อให้ได้ข้อมูลชื่อผู้เช่าและวันที่
    async loadPendingPayments() {
        try {
            // แนะนำให้ใช้ this.http (Aurelia Fetch Client) แทน fetch ปกติเพื่อให้เป็นมาตรฐานเดียวกัน
            const response = await this.http.fetch("http://localhost:5000/api/Payment/pending");

            if (response.ok) {
                const data = await response.json();

                // ตรวจสอบว่า Backend ส่งข้อมูลมาในรูปแบบที่มีการ Join ตารางมาแล้วหรือไม่
                // ข้อมูลควรประกอบด้วย: id, roomNumber, tenantName, paymentDate, slipUrl
                this.pendingPayments = data;

                console.log("รายการสลิปที่โหลดมา:", this.pendingPayments);
            }
        } catch (error) {
            console.error('ไม่สามารถดึงรายการสลิปได้:', error);
            // ไม่ต้องแสดง Alert ทุกครั้งที่โหลดพลาดเพื่อไม่ให้กวนการทำงานหน้าหลัก
        }
    }

    // ✅ ฟังก์ชันดูรูปสลิป
    viewSlip(url: string) {
        if (!url) {
            console.warn('ไม่มี slipUrl');
            return;
        }

        this.selectedSlipUrl = url;
        this.showSlipModal = true;
    }


    // ✅ ฟังก์ชันอนุมัติการชำระเงิน
    async approvePayment(payment: any) {
        const result = await Swal.fire({
            title: 'ยืนยันการอนุมัติ?',
            text: `คุณต้องการอนุมัติยอดชำระเงินห้อง ${payment.roomNumber} ใช่หรือไม่?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#198754',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'ใช่, อนุมัติเลย',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                const response = await this.http.fetch(`http://localhost:5000/api/Payment/approve/${payment.id}`, {
                    method: 'POST'
                });

                if (response.ok) {
                    Swal.fire('สำเร็จ!', 'อนุมัติการชำระเงินเรียบร้อยแล้ว', 'success');
                    await this.loadPendingPayments();
                    await this.loadRooms();
                }
            } catch (error) {
                Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการอนุมัติ', 'error');
            }
        }
    }

    // ✅ ฟังก์ชันปฏิเสธการชำระเงิน
    async rejectPayment(payment: any) {
        const result = await Swal.fire({
            title: 'ปฏิเสธสลิป?',
            text: `คุณต้องการปฏิเสธหลักฐานการโอนของห้อง ${payment.roomNumber} หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'ใช่, ปฏิเสธสลิป',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                const response = await this.http.fetch(`http://localhost:5000/api/Payment/reject/${payment.id}`, {
                    method: 'POST'
                });

                if (response.ok) {
                    Swal.fire('เรียบร้อย', 'ปฏิเสธสลิปเรียบร้อยแล้ว', 'info');
                    await this.loadPendingPayments();
                }
            } catch (error) {
                Swal.fire('ผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
            }
        }
    }


    // --- ฟังก์ชันเดิม (จดมิเตอร์/เช็คอิน) ---
    async openUtilityModal(room: IRoom) {
        this.selectedRoom = room;
        this.showUtilityModal = true;
        this.currElectric = 0;
        this.currWater = 0;

        try {
            const response = await this.http.fetch(`http://localhost:5000/api/Invoice/latest/${room.id}`);
            if (response.ok) {
                const lastInvoice = await response.json();
                this.prevElectric = lastInvoice.currentElectricityMeter ?? 0;
                this.prevWater = lastInvoice.currentWaterMeter ?? 0;
            } else {
                this.prevElectric = 0;
                this.prevWater = 0;
            }
        } catch (error) {
            this.prevElectric = 0;
            this.prevWater = 0;
        }
    }

    async saveUtilityUsage() {
        if (!this.selectedRoom) return;

        // 1. ตรวจสอบตัวเลขเบื้องต้น
        if (Number(this.currElectric) < Number(this.prevElectric) || Number(this.currWater) < Number(this.prevWater)) {
            Swal.fire('ข้อมูลไม่ถูกต้อง', 'เลขมิเตอร์ครั้งนี้ห้ามน้อยกว่าครั้งก่อน', 'error');
            return;
        }

        // 2. จัดเตรียมข้อมูลส่งให้ Backend (เช็คชื่อตัวแปรให้ตรงกับ C# Model)
        const utilityData = {
            RoomId: this.selectedRoom.id, // ✅ มั่นใจว่าใช้ R ตัวใหญ่ และ .id มีค่า
            CurrentElectricityMeter: Number(this.currElectric),
            PreviousElectricityMeter: Number(this.prevElectric),
            CurrentWaterMeter: Number(this.currWater),
            PreviousWaterMeter: Number(this.prevWater),
            ReadingDate: new Date().toISOString()
        };

        try {
            const response = await this.http.fetch('http://localhost:5000/api/Invoice/generate', {
                method: 'POST',
                body: json(utilityData)
            });

            if (response.ok) {
                this.showUtilityModal = false;
                await this.loadRooms();

                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกสำเร็จ',
                    text: 'สร้างบิลค่าน้ำค่าไฟเรียบร้อยแล้ว',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                // ✅ ถ้า Backend ตอบกลับมาว่าไม่พบห้อง ให้แสดง Error แจ้งเตือน
                const errorMsg = await response.text();
                Swal.fire('เกิดข้อผิดพลาด', `เซิร์ฟเวอร์แจ้งว่า: ${errorMsg}`, 'error');
            }
        } catch (error) {
            Swal.fire('Network Error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
        }
    }

    get availableRoomsCount() {
        return this.rooms.filter(r => r.status === 'Available').length;
    }

    get totalRevenue() {
        return this.rooms
            .filter(r => r.status === 'Occupied')
            .reduce((sum, r) => sum + (r.monthlyRent ?? 0), 0);
    }

    get occupancyRate() {
        if (this.rooms.length === 0) return 0;
        const occupied = this.rooms.length - this.availableRoomsCount;
        return Math.round((occupied / this.rooms.length) * 100);
    }

    get filteredRooms() {
        return this.rooms.filter(room => {
            const matchesSearch = room.roomNumber.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesStatus = this.filterStatus === 'All' || room.status === this.filterStatus;
            const matchesType = this.filterType === 'All' || room.type === this.filterType;
            return matchesSearch && matchesStatus && matchesType;
        });
    }

    openCheckInModal(room: IRoom) {
        if (room.status === 'Occupied') {
            if (confirm(`คุณต้องการเช็คเอาต์ออกจากห้อง ${room.roomNumber} ใช่หรือไม่?`)) {
                this.toggleStatus(room);
            }
            return;
        }
        this.selectedRoom = room;
        this.tenantName = '';
        this.tenantPhone = '';
        this.showModal = true;
    }

    async toggleStatus(room: IRoom) {
        try {
            const username = `user${room.roomNumber}`;
            await this.http.fetch(`http://localhost:5000/api/Auth/delete-by-username/${username}`, {
                method: 'DELETE'
            });

            const updatedRoom = {
                ...room,
                status: 'Available',
                currentTenant: null
            };

            const response = await this.http.fetch(`http://localhost:5000/api/Room/${room.id}`, {
                method: 'PUT',
                body: json(updatedRoom)
            });

            if (response.ok) {
                alert(`เช็คเอาต์ห้อง ${room.roomNumber} เรียบร้อยแล้ว`);
                await this.loadRooms();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async confirmCheckIn() {
        if (!this.selectedRoom || !this.tenantName) return;
        const registerData = {
            Username: `user${this.selectedRoom.roomNumber}`,
            PasswordHash: this.selectedRoom.roomNumber.toString(),
            RoomId: this.selectedRoom.id,
            Role: 'User'
        };

        try {
            const regResponse = await this.http.fetch('http://localhost:5000/api/Auth/register', {
                method: 'POST',
                body: json(registerData)
            });

            if (regResponse.ok) {
                const updatedRoom = {
                    ...this.selectedRoom,
                    status: 'Occupied',
                    currentTenant: {
                        name: this.tenantName,
                        phoneNumber: this.tenantPhone,
                        roomId: this.selectedRoom.id
                    }
                };
                await this.http.fetch(`http://localhost:5000/api/Room/${this.selectedRoom.id}`, {
                    method: 'PUT',
                    body: json(updatedRoom)
                });
                alert(`เช็คอินสำเร็จ!`);
                this.showModal = false;
                await this.loadRooms();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }



    logout() {
        localStorage.clear();
        window.location.href = '#/login';
    }
}