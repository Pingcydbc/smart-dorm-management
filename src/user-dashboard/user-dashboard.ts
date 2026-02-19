import { IHttpClient } from '@aurelia/fetch-client';
import { inject } from 'aurelia';
// ✅ แก้ไขการ Import เพื่อให้ Vite หาไฟล์เจอและรันผ่าน
import jsPDF from 'jspdf/dist/jspdf.es.min.js';
import 'jspdf-autotable';
import Swal from 'sweetalert2';

@inject(IHttpClient)
export class UserDashboard {
    public username: string = '';
    public roomNumber: string = '';
    public invoiceStatus: string = 'Pending';
    public totalAmount: number = 0;
    public roomRent: number = 0;
    public waterBill: number = 0;
    public electricityBill: number = 0;
    public room: any = null;

    // ✅ ตัวแปรสำหรับระบบแจ้งโอนเงิน
    public selectedFile: File | null = null;
    public currentInvoiceId: number | null = null;
    invoice: any;
    selectedInvoice: any;

    constructor(private http: IHttpClient) {
        this.username = localStorage.getItem('username') ?? 'User';
    }

    // --- 📤 ระบบแจ้งชำระเงิน ---

    // ฟังก์ชันเมื่อเลือกไฟล์รูปภาพ
    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
        }
    }

    // ฟังก์ชันส่งหลักฐานการโอน
    // ... (ส่วนการ Import และตัวแปรคงเดิม)

    // ✅ ฟังก์ชันส่งหลักฐานการโอน (SweetAlert2)
    async submitPayment() {
        if (!this.selectedFile) {
            Swal.fire('กรุณาเลือกไฟล์', 'กรุณาแนบรูปภาพสลิปการโอนเงิน', 'warning');
            return;
        }

        if (!this.currentInvoiceId) {
            Swal.fire('ไม่พบบิล', 'คุณยังไม่มีบิลค้างชำระในระบบ', 'info');
            return;
        }

        // แสดง Loading ขณะกำลังอัปโหลด
        Swal.fire({
            title: 'กำลังส่งหลักฐาน...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const formData = new FormData();
            formData.append('slip', this.selectedFile);
            formData.append('invoiceId', this.currentInvoiceId.toString());

            const response = await fetch("http://localhost:5000/api/Payment/upload-slip", {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'ส่งหลักฐานสำเร็จ',
                    text: 'แอดมินกำลังตรวจสอบข้อมูลของคุณ',
                    confirmButtonColor: '#0d6efd'
                });
                this.selectedFile = null;
                await this.loadUserInvoice();
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            Swal.fire('อัปโหลดล้มเหลว', 'เกิดข้อผิดพลาดในการส่งไฟล์ กรุณาลองใหม่', 'error');
        }
    }




    // --- 📄 ระบบส่งออก PDF ---

    exportPdf() {
        if (!this.roomNumber) return;

        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(`Smart Dorm - Room ${this.roomNumber}`, 10, 20);

        doc.setFontSize(12);
        doc.text(`Tenant: ${this.username}`, 10, 30);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 40);

        (doc as any).autoTable({
            startY: 50,
            head: [['Description', 'Amount (Baht)']],
            body: [
                ['Room Rent', this.roomRent.toLocaleString()],
                ['Water Bill', this.waterBill.toLocaleString()],
                ['Electricity Bill', this.electricityBill.toLocaleString()],
            ],
            foot: [['Total Amount', this.totalAmount.toLocaleString()]],
            theme: 'grid'
        });

        doc.save(`Invoice_${this.roomNumber}.pdf`);
    }

    async attached() {
        await this.loadUserInvoice();
    }

    async loadUserInvoice() {
        const roomId = localStorage.getItem('roomId');
        if (!roomId) {
            window.location.href = '#/login';
            return;
        }

        // 1. ⚡ ล้างค่าเก่าออกก่อนทุกครั้งที่โหลด เพื่อป้องกันข้อมูลค้างจากห้องอื่น
        this.currentInvoiceId = null;
        this.invoiceStatus = 'No Invoice';
        this.waterBill = 0;
        this.electricityBill = 0;

        try {
            // 2. ดึงข้อมูลห้องพักเพื่อเอาค่าเช่าพื้นฐาน
            const roomResponse = await this.http.fetch(`http://localhost:5000/api/Room/${roomId}`);
            if (roomResponse.ok) {
                const roomData = await roomResponse.json();
                this.room = roomData;
                this.roomNumber = roomData.roomNumber;
                this.roomRent = roomData.monthlyRent;
                this.totalAmount = roomData.monthlyRent; // ตั้งยอดเริ่มต้นไว้ที่ค่าเช่า
            }

            // 3. 🔍 ดึงบิลล่าสุด (เพื่อเอา ID ไปแจ้งโอนเงิน)
            const invoiceResponse = await this.http.fetch(`http://localhost:5000/api/Invoice/latest/${roomId}`);

            if (invoiceResponse.ok) {
                const invoice = await invoiceResponse.json();

                // ✅ จุดสำคัญ: เก็บ ID บิลที่ได้จาก Backend
                this.currentInvoiceId = invoice.id;
                this.invoiceStatus = invoice.status;
                this.waterBill = invoice.totalWater;
                this.electricityBill = invoice.totalElectricity;
                this.totalAmount = invoice.grandTotal;

                console.log("✅ โหลดบิลสำเร็จ ID:", this.currentInvoiceId);
            } else {
                // กรณีไม่มีบิล (แอดมินยังไม่เคยจดมิเตอร์)
                this.currentInvoiceId = null;
                this.invoiceStatus = 'Pending Admin Action';
                console.log("⚠️ ห้องนี้ยังไม่มีการออกบิลค่าน้ำค่าไฟ");
            }

        } catch (error) {
            console.error('❌ ไม่สามารถโหลดข้อมูลได้:', error);
            this.currentInvoiceId = null;
        }
    }

    logout() {
        localStorage.clear();
        window.location.href = '/login';
    }
}