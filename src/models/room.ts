// src/models/room.ts

export interface ITenant {
    id?: number;
    name: string;
    phoneNumber: string;
    roomId: number;
}

export interface IRoom {
    id: number;
    roomNumber: string;
    type: string;
    monthlyRent: number;
    status: string;
    currentTenant?: ITenant | null; 
}