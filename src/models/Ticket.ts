export type TicketType = 'SP' | 'SG' | 'SE';

export interface Ticket {
    id?: number;
    ticketNumber: string;
    ticketType: TicketType;
    issueDate: string;
    issueTime: string;
    attended: boolean;
    abandoned: boolean;
    counterNumber?: number;
    serviceStartTime?: string;
    serviceEndTime?: string;
    serviceDuration?: number; // em minutos
}

export interface TicketTypeInfo {
    code: TicketType;
    name: string;
    priority: number;
    color: string;
}

export const TICKET_TYPES: Record<TicketType, TicketTypeInfo> = {
    SG: {
        code: 'SG',
        name: 'Senha Geral',
        priority: 3,
        color: '#2ecc71'
    },
    SP: {
        code: 'SP',
        name: 'Senha Prioritária',
        priority: 1,
        color: '#e74c3c'
    },
    SE: {
        code: 'SE',
        name: 'Retirada de Exames',
        priority: 2,
        color: '#3498db'
    }
};
