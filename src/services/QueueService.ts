import { Ticket, TicketType } from '../models/Ticket';
import { ticketService } from './TicketService';
import { calculateServiceTime, willClientAttend } from '../utils/timeCalculator';

interface CounterState {
    number: number;
    busy: boolean;
    currentTicket: Ticket | null;
    lastCalledType: TicketType | null;
}

class QueueService {
    private counters: Map<number, CounterState> = new Map();
    private lastGlobalType: TicketType | null = null;

    /**
     * Inicializa um guichê
     */
    initializeCounter(counterNumber: number): void {
        this.counters.set(counterNumber, {
            number: counterNumber,
            busy: false,
            currentTicket: null,
            lastCalledType: null
        });
    }

    /**
     * Chama a próxima senha seguindo o padrão de priorização
     * Padrão: SP -> (SE ou SG) -> SP -> (SE ou SG)
     */
    async callNextTicket(counterNumber: number): Promise<Ticket | null> {
        const counter = this.counters.get(counterNumber);
        if (!counter) {
            throw new Error(`Counter ${counterNumber} not initialized`);
        }

        if (counter.busy) {
            throw new Error(`Counter ${counterNumber} is busy`);
        }

        // Determina qual tipo deve ser chamado baseado no último tipo chamado globalmente
        const nextTicket = await this.getNextTicketByPriority();

        if (!nextTicket) {
            return null; // Não há senhas na fila
        }

        // Simula se o cliente vai comparecer (5% de abandono)
        if (!willClientAttend()) {
            // Cliente não compareceu, marca como abandonado
            if (nextTicket.id) {
                await ticketService.markAsAbandoned(nextTicket.id);
            }
            // Tenta chamar o próximo
            return await this.callNextTicket(counterNumber);
        }

        // Cliente compareceu, inicia atendimento
        if (nextTicket.id) {
            await ticketService.startService(nextTicket.id, counterNumber);
        }

        // Atualiza estado do guichê
        counter.busy = true;
        counter.currentTicket = nextTicket;
        counter.lastCalledType = nextTicket.ticketType;
        this.lastGlobalType = nextTicket.ticketType;

        return nextTicket;
    }

    /**
     * Determina a próxima senha baseada no padrão de priorização
     */
    private async getNextTicketByPriority(): Promise<Ticket | null> {
        const spTickets = await ticketService.getPendingTicketsByType('SP');
        const seTickets = await ticketService.getPendingTicketsByType('SE');
        const sgTickets = await ticketService.getPendingTicketsByType('SG');

        // Se não há senhas, retorna null
        if (spTickets.length === 0 && seTickets.length === 0 && sgTickets.length === 0) {
            return null;
        }

        // Padrão: SP -> (SE ou SG) -> SP -> (SE ou SG)
        if (this.lastGlobalType === 'SP') {
            // Último foi SP, próximo deve ser SE (se existir) ou SG
            if (seTickets.length > 0) {
                return seTickets[0];
            }
            if (sgTickets.length > 0) {
                return sgTickets[0];
            }
            // Se não há SE nem SG, chama SP
            if (spTickets.length > 0) {
                return spTickets[0];
            }
        } else {
            // Último foi SE ou SG (ou é o primeiro), próximo deve ser SP (se existir)
            if (spTickets.length > 0) {
                return spTickets[0];
            }
            // Se não há SP, chama SE ou SG
            if (seTickets.length > 0) {
                return seTickets[0];
            }
            if (sgTickets.length > 0) {
                return sgTickets[0];
            }
        }

        return null;
    }

    /**
     * Finaliza o atendimento no guichê
     */
    async finishService(counterNumber: number): Promise<void> {
        const counter = this.counters.get(counterNumber);
        if (!counter) {
            throw new Error(`Counter ${counterNumber} not initialized`);
        }

        if (!counter.busy || !counter.currentTicket) {
            throw new Error(`Counter ${counterNumber} has no active service`);
        }

        // Finaliza o atendimento
        if (counter.currentTicket.id) {
            await ticketService.finishService(counter.currentTicket.id);
        }

        // Libera o guichê
        counter.busy = false;
        counter.currentTicket = null;
    }

    /**
     * Obtém o estado de um guichê
     */
    getCounterState(counterNumber: number): CounterState | undefined {
        return this.counters.get(counterNumber);
    }

    /**
     * Obtém todos os guichês
     */
    getAllCounters(): CounterState[] {
        return Array.from(this.counters.values());
    }

    /**
     * Calcula tempo estimado de atendimento para um tipo de senha
     */
    getEstimatedServiceTime(ticketType: TicketType): number {
        return calculateServiceTime(ticketType);
    }

    /**
     * Obtém estatísticas da fila
     */
    async getQueueStats(): Promise<{
        pending: { SP: number; SG: number; SE: number; total: number };
        lastCalled: Ticket[];
        activeCounters: number;
        busyCounters: number;
    }> {
        const pending = await ticketService.getPendingCount();
        const lastCalled = await ticketService.getLastFiveCalled();
        const allCounters = this.getAllCounters();

        return {
            pending,
            lastCalled,
            activeCounters: allCounters.length,
            busyCounters: allCounters.filter(c => c.busy).length
        };
    }

    /**
     * Reseta o estado de todos os guichês
     */
    resetAllCounters(): void {
        this.counters.clear();
        this.lastGlobalType = null;
    }

    /**
     * Simula o tempo de atendimento (para testes)
     */
    simulateServiceTime(ticketType: TicketType): number {
        return calculateServiceTime(ticketType);
    }
}

export const queueService = new QueueService();
