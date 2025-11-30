import { Ticket, TicketType } from '../models/Ticket';
import { databaseService } from './DatabaseService';
import { generateTicketNumber, formatDate, formatTime, isWithinWorkingHours } from '../utils/ticketGenerator';

class TicketService {
    /**
     * Gera uma nova senha
     */
    async generateTicket(type: TicketType): Promise<Ticket> {
        // Verifica horário de expediente
        if (!isWithinWorkingHours()) {
            throw new Error('Fora do horário de expediente (7h - 17h)');
        }

        const now = new Date();
        const date = formatDate(now);
        const time = formatTime(now);

        // Obtém próxima sequência para este tipo
        const sequence = await databaseService.getNextSequence(type, date);

        // Gera número da senha
        const ticketNumber = generateTicketNumber(type, sequence, now);

        const ticket: Ticket = {
            ticketNumber,
            ticketType: type,
            issueDate: date,
            issueTime: time,
            attended: false,
            abandoned: false
        };

        // Salva no banco
        const id = await databaseService.insertTicket(ticket);
        ticket.id = id;

        // Atualiza estatísticas
        await databaseService.updateDailyStats(date);

        return ticket;
    }

    /**
     * Obtém uma senha pelo número
     */
    async getTicket(ticketNumber: string): Promise<Ticket | null> {
        return await databaseService.getTicketByNumber(ticketNumber);
    }

    /**
     * Obtém todas as senhas pendentes de hoje
     */
    async getPendingTickets(): Promise<Ticket[]> {
        const date = formatDate();
        return await databaseService.getPendingTickets(date);
    }

    /**
     * Obtém senhas pendentes por tipo
     */
    async getPendingTicketsByType(type: TicketType): Promise<Ticket[]> {
        const date = formatDate();
        return await databaseService.getPendingTicketsByType(date, type);
    }

    /**
     * Marca uma senha como abandonada
     */
    async markAsAbandoned(ticketId: number): Promise<void> {
        const ticket = await databaseService.getTicketById(ticketId);
        if (!ticket) throw new Error('Ticket not found');

        ticket.abandoned = true;
        await databaseService.updateTicket(ticket);

        // Atualiza estatísticas
        await databaseService.updateDailyStats(ticket.issueDate);
    }

    /**
     * Inicia o atendimento de uma senha
     */
    async startService(ticketId: number, counterNumber: number): Promise<void> {
        const ticket = await databaseService.getTicketById(ticketId);
        if (!ticket) throw new Error('Ticket not found');

        ticket.counterNumber = counterNumber;
        ticket.serviceStartTime = formatTime();

        await databaseService.updateTicket(ticket);
    }

    /**
     * Finaliza o atendimento de uma senha
     */
    async finishService(ticketId: number): Promise<void> {
        const ticket = await databaseService.getTicketById(ticketId);
        if (!ticket) throw new Error('Ticket not found');

        const now = new Date();
        ticket.attended = true;
        ticket.serviceEndTime = formatTime(now);

        // Calcula duração do atendimento
        if (ticket.serviceStartTime) {
            const [startH, startM, startS] = ticket.serviceStartTime.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(startH, startM, startS);

            const durationMs = now.getTime() - startDate.getTime();
            ticket.serviceDuration = Math.round(durationMs / (1000 * 60)); // em minutos
        }

        await databaseService.updateTicket(ticket);

        // Atualiza estatísticas
        await databaseService.updateDailyStats(ticket.issueDate);
    }

    /**
     * Obtém as últimas 5 senhas chamadas
     */
    async getLastFiveCalled(): Promise<Ticket[]> {
        return await databaseService.getLastFiveCalledTickets();
    }

    /**
     * Obtém todas as senhas de uma data
     */
    async getTicketsByDate(date: string): Promise<Ticket[]> {
        return await databaseService.getTicketsByDate(date);
    }

    /**
     * Obtém contagem de senhas pendentes por tipo
     */
    async getPendingCount(): Promise<{
        SP: number;
        SG: number;
        SE: number;
        total: number;
    }> {
        const pending = await this.getPendingTickets();

        return {
            SP: pending.filter(t => t.ticketType === 'SP').length,
            SG: pending.filter(t => t.ticketType === 'SG').length,
            SE: pending.filter(t => t.ticketType === 'SE').length,
            total: pending.length
        };
    }

    /**
     * Descarta senhas não atendidas ao final do expediente
     */
    async discardPendingTickets(): Promise<number> {
        const pending = await this.getPendingTickets();

        for (const ticket of pending) {
            if (ticket.id) {
                await this.markAsAbandoned(ticket.id);
            }
        }

        return pending.length;
    }
}

export const ticketService = new TicketService();
