import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonCard,
    IonCardContent,
    IonText,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon
} from '@ionic/react';
import { volumeHighOutline } from 'ionicons/icons';
import { ticketService } from '../services/TicketService';
import { databaseService } from '../services/DatabaseService';
import { Ticket, TICKET_TYPES } from '../models/Ticket';
import './Display.css';

const Display: React.FC = () => {
    const [lastCalledTickets, setLastCalledTickets] = useState<Ticket[]>([]);
    const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);

    useEffect(() => {
        initializeDatabase();

        // Poll for updates every 2 seconds
        const interval = setInterval(fetchUpdates, 2000);
        return () => clearInterval(interval);
    }, []);

    const initializeDatabase = async () => {
        try {
            await databaseService.initialize();
            fetchUpdates();
        } catch (error) {
            console.error('Failed to initialize database:', error);
        }
    };

    const fetchUpdates = async () => {
        try {
            const tickets = await ticketService.getLastFiveCalled();

            // Check if there is a new ticket to highlight/announce
            if (tickets.length > 0) {
                const latest = tickets[0];
                setLastCalledTickets(tickets);

                // If the latest ticket is different from what we have stored as "current", update it
                // In a real app, we might check timestamps or IDs to trigger sound
                setCurrentTicket(latest);
            } else {
                setLastCalledTickets([]);
                setCurrentTicket(null);
            }
        } catch (error) {
            console.error('Error fetching updates:', error);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="tertiary">
                    <IonTitle>Painel de Chamadas</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="display-content" fullscreen>
                <div className="display-container">

                    {/* Main Display - Current Ticket */}
                    <div className="main-display">
                        {currentTicket ? (
                            <IonCard className="main-ticket-card">
                                <IonCardContent>
                                    <div className="main-ticket-header">
                                        <IonText color="medium">SENHA ATUAL</IonText>
                                        <IonIcon icon={volumeHighOutline} className="sound-icon" />
                                    </div>

                                    <div className="main-ticket-number" style={{ color: TICKET_TYPES[currentTicket.ticketType].color }}>
                                        {currentTicket.ticketNumber}
                                    </div>

                                    <div className="main-ticket-info">
                                        <IonBadge color="dark" className="main-counter-badge">
                                            GUICHÊ {currentTicket.counterNumber}
                                        </IonBadge>
                                        <div className="main-ticket-type">
                                            {TICKET_TYPES[currentTicket.ticketType].name}
                                        </div>
                                    </div>
                                </IonCardContent>
                            </IonCard>
                        ) : (
                            <div className="waiting-message">
                                <IonText>
                                    <h1>Aguardando chamadas...</h1>
                                </IonText>
                            </div>
                        )}
                    </div>

                    {/* History List - Last 4 Tickets */}
                    <div className="history-list">
                        <IonText className="history-title">
                            <h3>Últimas Chamadas</h3>
                        </IonText>

                        <div className="history-cards">
                            {lastCalledTickets.slice(1).map((ticket) => (
                                <IonCard key={ticket.id} className="history-card">
                                    <IonCardContent className="history-card-content">
                                        <div className="history-number" style={{ color: TICKET_TYPES[ticket.ticketType].color }}>
                                            {ticket.ticketNumber}
                                        </div>
                                        <div className="history-counter">
                                            Guichê {ticket.counterNumber}
                                        </div>
                                        <div className="history-type">
                                            {TICKET_TYPES[ticket.ticketType].name}
                                        </div>
                                    </IonCardContent>
                                </IonCard>
                            ))}

                            {lastCalledTickets.length <= 1 && (
                                <div className="empty-history">
                                    <IonText color="medium">
                                        <p>Histórico vazio</p>
                                    </IonText>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </IonContent>
        </IonPage>
    );
};

export default Display;
