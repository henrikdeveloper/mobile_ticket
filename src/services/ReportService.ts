import { databaseService } from './DatabaseService';
import { ticketService } from './TicketService';
import { DailyStats, ServiceRecord } from '../models/ServiceRecord';
import { Ticket } from '../models/Ticket';

class ReportService {
    /**
     * gera relatório diário
     */
    async generateDailyReport(date: string): Promise<{
        stats: DailyStats | null;
        tickets: ServiceRecord[];
    }> {
        // atualiza estatísticas antes de gerar relatório
        await databaseService.updateDailyStats(date);

        const stats = await databaseService.getDailyStats(date);
        const tickets = await ticketService.getTicketsByDate(date);

        const serviceRecords: ServiceRecord[] = tickets.map(this.ticketToServiceRecord);

        return {
            stats,
            tickets: serviceRecords
        };
    }

    /**
     * gera relatório mensal
     */
    async generateMonthlyReport(year: number, month: number): Promise<{
        summary: {
            totalIssued: number;
            totalAttended: number;
            spIssued: number;
            spAttended: number;
            sgIssued: number;
            sgAttended: number;
            seIssued: number;
            seAttended: number;
            avgServiceTime: number;
        };
        dailyStats: DailyStats[];
        allTickets: ServiceRecord[];
    }> {
        const dailyStats = await databaseService.getMonthlyStats(year, month);

        // calcula totais do mês
        const summary = {
            totalIssued: dailyStats.reduce((sum, day) => sum + day.totalIssued, 0),
            totalAttended: dailyStats.reduce((sum, day) => sum + day.totalAttended, 0),
            spIssued: dailyStats.reduce((sum, day) => sum + day.spIssued, 0),
            spAttended: dailyStats.reduce((sum, day) => sum + day.spAttended, 0),
            sgIssued: dailyStats.reduce((sum, day) => sum + day.sgIssued, 0),
            sgAttended: dailyStats.reduce((sum, day) => sum + day.sgAttended, 0),
            seIssued: dailyStats.reduce((sum, day) => sum + day.seIssued, 0),
            seAttended: dailyStats.reduce((sum, day) => sum + day.seAttended, 0),
            avgServiceTime: this.calculateMonthlyAvgServiceTime(dailyStats)
        };

        // obtém todos os tickets do mês
        const allTickets: ServiceRecord[] = [];
        for (const dayStat of dailyStats) {
            const tickets = await ticketService.getTicketsByDate(dayStat.date);
            allTickets.push(...tickets.map(this.ticketToServiceRecord));
        }

        return {
            summary,
            dailyStats,
            allTickets
        };
    }

    /**
     * exporta relatório em formato CSV
     */
    exportToCSV(tickets: ServiceRecord[]): string {
        const headers = [
            'Número da Senha',
            'Tipo',
            'Data de Emissão',
            'Hora de Emissão',
            'Guichê',
            'Hora de Início',
            'Hora de Fim',
            'Atendida'
        ];

        const rows = tickets.map(ticket => [
            ticket.ticketNumber,
            ticket.ticketType,
            ticket.issueDate,
            ticket.issueTime,
            ticket.counterNumber?.toString() || '',
            ticket.serviceStartTime || '',
            ticket.serviceEndTime || '',
            ticket.attended ? 'Sim' : 'Não'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        return csvContent;
    }

    /**
     * exporta estatísticas em formato JSON
     */
    exportStatsToJSON(stats: DailyStats | any): string {
        return JSON.stringify(stats, null, 2);
    }

    /**
     * gera relatório de tempo médio de atendimento
     */
    async generateServiceTimeReport(date: string): Promise<{
        overall: number;
        byType: {
            SP: number;
            SG: number;
            SE: number;
        };
    }> {
        const tickets = await ticketService.getTicketsByDate(date);
        const attendedTickets = tickets.filter(t => t.attended && t.serviceDuration);

        const spTickets = attendedTickets.filter(t => t.ticketType === 'SP');
        const sgTickets = attendedTickets.filter(t => t.ticketType === 'SG');
        const seTickets = attendedTickets.filter(t => t.ticketType === 'SE');

        return {
            overall: this.calculateAvg(attendedTickets.map(t => t.serviceDuration || 0)),
            byType: {
                SP: this.calculateAvg(spTickets.map(t => t.serviceDuration || 0)),
                SG: this.calculateAvg(sgTickets.map(t => t.serviceDuration || 0)),
                SE: this.calculateAvg(seTickets.map(t => t.serviceDuration || 0))
            }
        };
    }

    /**
     * gera relatório de taxa de abandono
     */
    async generateAbandonmentReport(date: string): Promise<{
        total: number;
        abandoned: number;
        rate: number;
        byType: {
            SP: { total: number; abandoned: number; rate: number };
            SG: { total: number; abandoned: number; rate: number };
            SE: { total: number; abandoned: number; rate: number };
        };
    }> {
        const tickets = await ticketService.getTicketsByDate(date);

        const spTickets = tickets.filter(t => t.ticketType === 'SP');
        const sgTickets = tickets.filter(t => t.ticketType === 'SG');
        const seTickets = tickets.filter(t => t.ticketType === 'SE');

        return {
            total: tickets.length,
            abandoned: tickets.filter(t => t.abandoned).length,
            rate: this.calculateRate(tickets.filter(t => t.abandoned).length, tickets.length),
            byType: {
                SP: {
                    total: spTickets.length,
                    abandoned: spTickets.filter(t => t.abandoned).length,
                    rate: this.calculateRate(spTickets.filter(t => t.abandoned).length, spTickets.length)
                },
                SG: {
                    total: sgTickets.length,
                    abandoned: sgTickets.filter(t => t.abandoned).length,
                    rate: this.calculateRate(sgTickets.filter(t => t.abandoned).length, sgTickets.length)
                },
                SE: {
                    total: seTickets.length,
                    abandoned: seTickets.filter(t => t.abandoned).length,
                    rate: this.calculateRate(seTickets.filter(t => t.abandoned).length, seTickets.length)
                }
            }
        };
    }

    // ============ HELPERS ============

    private ticketToServiceRecord(ticket: Ticket): ServiceRecord {
        return {
            ticketNumber: ticket.ticketNumber,
            ticketType: ticket.ticketType,
            issueDate: ticket.issueDate,
            issueTime: ticket.issueTime,
            counterNumber: ticket.counterNumber,
            serviceStartTime: ticket.serviceStartTime,
            serviceEndTime: ticket.serviceEndTime,
            attended: ticket.attended
        };
    }

    private calculateMonthlyAvgServiceTime(dailyStats: DailyStats[]): number {
        const validDays = dailyStats.filter(day => day.avgServiceTime > 0);
        if (validDays.length === 0) return 0;

        const total = validDays.reduce((sum, day) => sum + day.avgServiceTime, 0);
        return total / validDays.length;
    }

    private calculateAvg(values: number[]): number {
        if (values.length === 0) return 0;
        const total = values.reduce((sum, val) => sum + val, 0);
        return total / values.length;
    }

    private calculateRate(count: number, total: number): number {
        if (total === 0) return 0;
        return (count / total) * 100;
    }

    /**
     * baixa relatório como arquivo
     */
    downloadReport(content: string, filename: string, type: 'csv' | 'json'): void {
        const mimeType = type === 'csv' ? 'text/csv' : 'application/json';
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        URL.revokeObjectURL(url);
    }
}

export const reportService = new ReportService();
