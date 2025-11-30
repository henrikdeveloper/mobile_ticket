import { TicketType } from '../models/Ticket';

/**
 * Gera o número da senha no formato YYMMDD-PPSQ
 * @param type Tipo da senha (SP, SG, SE)
 * @param sequence Sequência do dia para este tipo
 * @param date Data de emissão (opcional, padrão: hoje)
 * @returns Número da senha formatado
 */
export function generateTicketNumber(
    type: TicketType,
    sequence: number,
    date: Date = new Date()
): string {
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const sq = sequence.toString().padStart(2, '0');

    return `${yy}${mm}${dd}-${type}${sq}`;
}

/**
 * Extrai informações de um número de senha
 * @param ticketNumber Número da senha
 * @returns Objeto com informações extraídas
 */
export function parseTicketNumber(ticketNumber: string): {
    year: number;
    month: number;
    day: number;
    type: TicketType;
    sequence: number;
} | null {
    const regex = /^(\d{2})(\d{2})(\d{2})-(SP|SG|SE)(\d{2})$/;
    const match = ticketNumber.match(regex);

    if (!match) return null;

    return {
        year: 2000 + parseInt(match[1]),
        month: parseInt(match[2]),
        day: parseInt(match[3]),
        type: match[4] as TicketType,
        sequence: parseInt(match[5])
    };
}

/**
 * Formata data no formato YYYY-MM-DD
 */
export function formatDate(date: Date = new Date()): string {
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formata hora no formato HH:MM:SS
 */
export function formatTime(date: Date = new Date()): string {
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const ss = date.getSeconds().toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

/**
 * Verifica se está dentro do horário de expediente (7h - 17h)
 */
export function isWithinWorkingHours(date: Date = new Date()): boolean {
    const hour = date.getHours();
    return hour >= 7 && hour < 17;
}

/**
 * Retorna a data/hora de início do expediente
 */
export function getWorkingHoursStart(date: Date = new Date()): Date {
    const start = new Date(date);
    start.setHours(7, 0, 0, 0);
    return start;
}

/**
 * Retorna a data/hora de fim do expediente
 */
export function getWorkingHoursEnd(date: Date = new Date()): Date {
    const end = new Date(date);
    end.setHours(17, 0, 0, 0);
    return end;
}
