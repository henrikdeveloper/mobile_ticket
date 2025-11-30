export interface DailyStats {
    id?: number;
    date: string;
    totalIssued: number;
    totalAttended: number;
    spIssued: number;
    spAttended: number;
    sgIssued: number;
    sgAttended: number;
    seIssued: number;
    seAttended: number;
    avgServiceTime: number;
}

export interface ServiceRecord {
    ticketNumber: string;
    ticketType: string;
    issueDate: string;
    issueTime: string;
    counterNumber?: number;
    serviceStartTime?: string;
    serviceEndTime?: string;
    attended: boolean;
}
