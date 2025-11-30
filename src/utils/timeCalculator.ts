import { TicketType } from '../models/Ticket';

/**
 * Calcula o tempo médio de atendimento com variação aleatória
 * @param ticketType Tipo da senha
 * @returns Tempo em minutos
 */
export function calculateServiceTime(ticketType: TicketType): number {
    switch (ticketType) {
        case 'SP':
            // TM = 15 minutos, variação de ±5 minutos (10 a 20 min)
            return 15 + (Math.random() * 10 - 5);

        case 'SG':
            // TM = 5 minutos, variação de ±3 minutos (2 a 8 min)
            return 5 + (Math.random() * 6 - 3);

        case 'SE':
            // 95% = menos de 1 minuto, 5% = 5 minutos
            return Math.random() < 0.95 ? Math.random() : 5;

        default:
            return 5;
    }
}

/**
 * Simula se o cliente vai comparecer (5% de abandono)
 * @returns true se o cliente compareceu, false se abandonou
 */
export function willClientAttend(): boolean {
    return Math.random() >= 0.05; // 95% comparecem, 5% abandonam
}

/**
 * Calcula o tempo estimado de espera baseado na posição na fila
 * @param position Posição na fila
 * @param avgServiceTime Tempo médio de atendimento
 * @returns Tempo estimado em minutos
 */
export function calculateEstimatedWaitTime(
    position: number,
    avgServiceTime: number = 5
): number {
    return position * avgServiceTime;
}

/**
 * Formata tempo em minutos para string legível
 * @param minutes Tempo em minutos
 * @returns String formatada (ex: "15 min", "1h 30min")
 */
export function formatWaitTime(minutes: number): string {
    if (minutes < 60) {
        return `${Math.round(minutes)} min`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (mins === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${mins}min`;
}

/**
 * Calcula a diferença em minutos entre duas datas
 */
export function getMinutesDifference(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}
