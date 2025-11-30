import initSqlJs, { Database } from 'sql.js';
import { Ticket } from '../models/Ticket';
import { DailyStats } from '../models/ServiceRecord';

class DatabaseService {
    private db: Database | null = null;
    private initialized = false;

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            const SQL = await initSqlJs({
                locateFile: (file: string) => `https://sql.js.org/dist/${file}`
            });

            // Tenta carregar do localStorage
            const savedDb = localStorage.getItem('queue_db');
            if (savedDb) {
                const u8 = new Uint8Array(JSON.parse(savedDb));
                this.db = new SQL.Database(u8);
                console.log('Database loaded from localStorage');
            } else {
                this.db = new SQL.Database();
                console.log('New database created');
            }

            await this.createTables();
            this.initialized = true;
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    private saveToStorage(): void {
        if (this.db) {
            const data = this.db.export();
            const arr = Array.from(data);
            localStorage.setItem('queue_db', JSON.stringify(arr));
        }
    }

    private async createTables(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        // Tabela de tickets
        this.db.run(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_number TEXT UNIQUE NOT NULL,
        ticket_type TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        issue_time TEXT NOT NULL,
        attended INTEGER DEFAULT 0,
        abandoned INTEGER DEFAULT 0,
        counter_number INTEGER,
        service_start_time TEXT,
        service_end_time TEXT,
        service_duration INTEGER
      )
    `);

        // Tabela de estatísticas diárias
        this.db.run(`
      CREATE TABLE IF NOT EXISTS daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        total_issued INTEGER DEFAULT 0,
        total_attended INTEGER DEFAULT 0,
        sp_issued INTEGER DEFAULT 0,
        sp_attended INTEGER DEFAULT 0,
        sg_issued INTEGER DEFAULT 0,
        sg_attended INTEGER DEFAULT 0,
        se_issued INTEGER DEFAULT 0,
        se_attended INTEGER DEFAULT 0,
        avg_service_time REAL DEFAULT 0
      )
    `);

        // Índices para melhor performance
        this.db.run('CREATE INDEX IF NOT EXISTS idx_ticket_date ON tickets(issue_date)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_ticket_type ON tickets(ticket_type)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_ticket_attended ON tickets(attended)');
    }

    // ============ TICKETS ============

    async insertTicket(ticket: Ticket): Promise<number> {
        if (!this.db) throw new Error('Database not initialized');

        this.db.run(
            `INSERT INTO tickets (
        ticket_number, ticket_type, issue_date, issue_time,
        attended, abandoned
      ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                ticket.ticketNumber,
                ticket.ticketType,
                ticket.issueDate,
                ticket.issueTime,
                ticket.attended ? 1 : 0,
                ticket.abandoned ? 1 : 0
            ]
        );

        const result = this.db.exec('SELECT last_insert_rowid() as id');
        this.saveToStorage();
        return result[0].values[0][0] as number;
    }

    async getTicketById(id: number): Promise<Ticket | null> {
        if (!this.db) throw new Error('Database not initialized');

        const result = this.db.exec(
            'SELECT * FROM tickets WHERE id = ?',
            [id]
        );

        if (result.length === 0 || result[0].values.length === 0) {
            return null;
        }

        return this.rowToTicket(result[0].columns, result[0].values[0]);
    }

    async getTicketByNumber(ticketNumber: string): Promise<Ticket | null> {
        if (!this.db) throw new Error('Database not initialized');

        const result = this.db.exec(
            'SELECT * FROM tickets WHERE ticket_number = ?',
            [ticketNumber]
        );

        if (result.length === 0 || result[0].values.length === 0) {
            return null;
        }

        return this.rowToTicket(result[0].columns, result[0].values[0]);
    }

    async getPendingTickets(date: string): Promise<Ticket[]> {
        if (!this.db) throw new Error('Database not initialized');

        const result = this.db.exec(
            `SELECT * FROM tickets 
       WHERE issue_date = ? 
       AND attended = 0 
       AND abandoned = 0
       ORDER BY id ASC`,
            [date]
        );

        if (result.length === 0) return [];

        return result[0].values.map((row: any[]) =>
            this.rowToTicket(result[0].columns, row)
        );
    }

    async getPendingTicketsByType(date: string, type: string): Promise<Ticket[]> {
        if (!this.db) throw new Error('Database not initialized');

        const result = this.db.exec(
            `SELECT * FROM tickets 
       WHERE issue_date = ? 
       AND ticket_type = ?
       AND attended = 0 
       AND abandoned = 0
       ORDER BY id ASC`,
            [date, type]
        );

        if (result.length === 0) return [];

        return result[0].values.map((row: any[]) =>
            this.rowToTicket(result[0].columns, row)
        );
    }

    async updateTicket(ticket: Ticket): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        this.db.run(
            `UPDATE tickets SET
        attended = ?,
        abandoned = ?,
        counter_number = ?,
        service_start_time = ?,
        service_end_time = ?,
        service_duration = ?
       WHERE id = ?`,
            [
                ticket.attended ? 1 : 0,
                ticket.abandoned ? 1 : 0,
                ticket.counterNumber || null,
                ticket.serviceStartTime || null,
                ticket.serviceEndTime || null,
                ticket.serviceDuration || null,
                ticket.id
            ]
        );
        this.saveToStorage();
    }

    async getNextSequence(type: string, date: string): Promise<number> {
        if (!this.db) throw new Error('Database not initialized');

        const result = this.db.exec(
            `SELECT COUNT(*) as count FROM tickets 
       WHERE ticket_type = ? AND issue_date = ?`,
            [type, date]
        );

        if (result.length === 0) return 1;

        const count = result[0].values[0][0] as number;
        return count + 1;
    }

    async getLastFiveCalledTickets(): Promise<Ticket[]> {
        if (!this.db) throw new Error('Database not initialized');

        const result = this.db.exec(
            `SELECT * FROM tickets 
       WHERE service_start_time IS NOT NULL
       ORDER BY service_start_time DESC
       LIMIT 5`
        );

        if (result.length === 0) return [];

        return result[0].values.map((row: any[]) =>
            this.rowToTicket(result[0].columns, row)
        );
    }

    async getTicketsByDate(date: string): Promise<Ticket[]> {
        if (!this.db) throw new Error('Database not initialized');

        const result = this.db.exec(
            'SELECT * FROM tickets WHERE issue_date = ? ORDER BY id ASC',
            [date]
        );

        if (result.length === 0) return [];

        return result[0].values.map((row: any[]) =>
            this.rowToTicket(result[0].columns, row)
        );
    }

    // ============ STATISTICS ============

    async updateDailyStats(date: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const tickets = await this.getTicketsByDate(date);

        const stats: DailyStats = {
            date,
            totalIssued: tickets.length,
            totalAttended: tickets.filter(t => t.attended).length,
            spIssued: tickets.filter(t => t.ticketType === 'SP').length,
            spAttended: tickets.filter(t => t.ticketType === 'SP' && t.attended).length,
            sgIssued: tickets.filter(t => t.ticketType === 'SG').length,
            sgAttended: tickets.filter(t => t.ticketType === 'SG' && t.attended).length,
            seIssued: tickets.filter(t => t.ticketType === 'SE').length,
            seAttended: tickets.filter(t => t.ticketType === 'SE' && t.attended).length,
            avgServiceTime: this.calculateAvgServiceTime(tickets)
        };

        // Tenta atualizar, se não existir, insere
        const existing = this.db.exec(
            'SELECT id FROM daily_stats WHERE date = ?',
            [date]
        );

        if (existing.length > 0 && existing[0].values.length > 0) {
            this.db.run(
                `UPDATE daily_stats SET
          total_issued = ?,
          total_attended = ?,
          sp_issued = ?,
          sp_attended = ?,
          sg_issued = ?,
          sg_attended = ?,
          se_issued = ?,
          se_attended = ?,
          avg_service_time = ?
         WHERE date = ?`,
                [
                    stats.totalIssued,
                    stats.totalAttended,
                    stats.spIssued,
                    stats.spAttended,
                    stats.sgIssued,
                    stats.sgAttended,
                    stats.seIssued,
                    stats.seAttended,
                    stats.avgServiceTime,
                    date
                ]
            );
        } else {
            this.db.run(
                `INSERT INTO daily_stats (
          date, total_issued, total_attended,
          sp_issued, sp_attended, sg_issued, sg_attended,
          se_issued, se_attended, avg_service_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    stats.date,
                    stats.totalIssued,
                    stats.totalAttended,
                    stats.spIssued,
                    stats.spAttended,
                    stats.sgIssued,
                    stats.sgAttended,
                    stats.seIssued,
                    stats.seAttended,
                    stats.avgServiceTime
                ]
            );
        }
        this.saveToStorage();
    }

    async getDailyStats(date: string): Promise<DailyStats | null> {
        if (!this.db) throw new Error('Database not initialized');

        const result = this.db.exec(
            'SELECT * FROM daily_stats WHERE date = ?',
            [date]
        );

        if (result.length === 0 || result[0].values.length === 0) {
            return null;
        }

        return this.rowToStats(result[0].columns, result[0].values[0]);
    }

    async getMonthlyStats(year: number, month: number): Promise<DailyStats[]> {
        if (!this.db) throw new Error('Database not initialized');

        const datePattern = `${year}-${month.toString().padStart(2, '0')}-%`;

        const result = this.db.exec(
            'SELECT * FROM daily_stats WHERE date LIKE ? ORDER BY date ASC',
            [datePattern]
        );

        if (result.length === 0) return [];

        return result[0].values.map((row: any[]) =>
            this.rowToStats(result[0].columns, row)
        );
    }

    // ============ HELPERS ============

    private rowToTicket(columns: string[], row: any[]): Ticket {
        const obj: any = {};
        columns.forEach((col, idx) => {
            obj[col] = row[idx];
        });

        return {
            id: obj.id,
            ticketNumber: obj.ticket_number,
            ticketType: obj.ticket_type,
            issueDate: obj.issue_date,
            issueTime: obj.issue_time,
            attended: obj.attended === 1,
            abandoned: obj.abandoned === 1,
            counterNumber: obj.counter_number,
            serviceStartTime: obj.service_start_time,
            serviceEndTime: obj.service_end_time,
            serviceDuration: obj.service_duration
        };
    }

    private rowToStats(columns: string[], row: any[]): DailyStats {
        const obj: any = {};
        columns.forEach((col, idx) => {
            obj[col] = row[idx];
        });

        return {
            id: obj.id,
            date: obj.date,
            totalIssued: obj.total_issued,
            totalAttended: obj.total_attended,
            spIssued: obj.sp_issued,
            spAttended: obj.sp_attended,
            sgIssued: obj.sg_issued,
            sgAttended: obj.sg_attended,
            seIssued: obj.se_issued,
            seAttended: obj.se_attended,
            avgServiceTime: obj.avg_service_time
        };
    }

    private calculateAvgServiceTime(tickets: Ticket[]): number {
        const attendedTickets = tickets.filter(t => t.attended && t.serviceDuration);

        if (attendedTickets.length === 0) return 0;

        const total = attendedTickets.reduce((sum, t) => sum + (t.serviceDuration || 0), 0);
        return total / attendedTickets.length;
    }

    async clearAllData(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        this.db.run('DELETE FROM tickets');
        this.db.run('DELETE FROM daily_stats');
        this.saveToStorage();
    }
}

export const databaseService = new DatabaseService();
