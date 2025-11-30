import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonPage,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonText,
    IonSpinner,
    IonIcon,
    IonToast
} from '@ionic/react';
import { ticketOutline, peopleOutline, medkitOutline, timeOutline } from 'ionicons/icons';
import { ticketService } from '../services/TicketService';
import { databaseService } from '../services/DatabaseService';
import { Ticket, TICKET_TYPES, TicketType } from '../models/Ticket';
import { isWithinWorkingHours } from '../utils/ticketGenerator';
import { calculateEstimatedWaitTime, formatWaitTime } from '../utils/timeCalculator';
import './Totem.css';

const Totem: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [generatedTicket, setGeneratedTicket] = useState<Ticket | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [queuePosition, setQueuePosition] = useState<number>(0);
    const [estimatedWait, setEstimatedWait] = useState<string>('');

    useEffect(() => {
        initializeDatabase();
    }, []);

    const initializeDatabase = async () => {
        try {
            await databaseService.initialize();
        } catch (error) {
            console.error('Failed to initialize database:', error);
            setToastMessage('Erro ao inicializar sistema');
            setShowToast(true);
        }
    };

    const handleGenerateTicket = async (type: TicketType) => {
        if (!isWithinWorkingHours()) {
            setToastMessage('Fora do horário de expediente (7h - 17h)');
            setShowToast(true);
            return;
        }

        setLoading(true);
        try {
            const ticket = await ticketService.generateTicket(type);
            setGeneratedTicket(ticket);

            // Calcula posição na fila
            const pending = await ticketService.getPendingCount();
            const position = pending[type];
            setQueuePosition(position);

            // Calcula tempo estimado
            const waitMinutes = calculateEstimatedWaitTime(position);
            setEstimatedWait(formatWaitTime(waitMinutes));

            setToastMessage('Senha gerada com sucesso!');
            setShowToast(true);
        } catch (error: any) {
            setToastMessage(error.message || 'Erro ao gerar senha');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const handleNewTicket = () => {
        setGeneratedTicket(null);
        setQueuePosition(0);
        setEstimatedWait('');
    };

    const getIcon = (type: TicketType) => {
        switch (type) {
            case 'SP':
                return peopleOutline;
            case 'SE':
                return medkitOutline;
            case 'SG':
                return ticketOutline;
        }
    };

    return (
        <IonPage>
            <IonContent className="totem-content" fullscreen>
                <div className="totem-container">
                    <div className="totem-header">
                        <IonText>
                            <h1>Atendimento</h1>
                        </IonText>
                    </div>

                    {!generatedTicket ? (
                        <div className="ticket-buttons">

                            {Object.values(TICKET_TYPES).map((ticketType) => (
                                <IonCard
                                    key={ticketType.code}
                                    className="ticket-card"
                                    button
                                    onClick={() => handleGenerateTicket(ticketType.code)}
                                    disabled={loading}
                                >
                                    <IonCardHeader>
                                        <div className="card-header-content">
                                            <IonIcon
                                                icon={getIcon(ticketType.code)}
                                                className="ticket-icon"
                                                style={{ color: ticketType.color }}
                                            />
                                            <IonCardTitle>{ticketType.name}</IonCardTitle>
                                        </div>
                                    </IonCardHeader>
                                </IonCard>
                            ))}

                            {loading && (
                                <div className="loading-container">
                                    <IonSpinner name="crescent" />
                                    <IonText>Gerando senha...</IonText>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="ticket-display">
                            <IonCard className="generated-ticket-card">
                                <IonCardHeader>
                                    <IonCardTitle className="ticket-title">
                                        Sua Senha
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <div
                                        className="ticket-number"
                                    >
                                        {generatedTicket.ticketNumber}
                                    </div>

                                    <div className="ticket-info">
                                        <div className="info-item">
                                            <IonIcon icon={peopleOutline} />
                                            <IonText>
                                                <p>Posição na fila: <strong>{queuePosition}</strong></p>
                                            </IonText>
                                        </div>

                                        <div className="info-item">
                                            <IonIcon icon={timeOutline} />
                                            <IonText>
                                                <p>Tempo estimado: <strong>{estimatedWait}</strong></p>
                                            </IonText>
                                        </div>

                                        <div className="info-item">
                                            <IonText color="medium">
                                                <p>Emitida em: {generatedTicket.issueTime}</p>
                                            </IonText>
                                        </div>
                                    </div>

                                    <div className="instructions">
                                        <IonText color="medium">
                                            <p>
                                                Aguarde sua senha ser chamada no painel.
                                                Dirija-se ao guichê indicado quando for chamado.
                                            </p>
                                        </IonText>
                                    </div>

                                    <IonButton
                                        expand="block"
                                        onClick={handleNewTicket}
                                        className="new-ticket-button"
                                    >
                                        Emitir Nova Senha
                                    </IonButton>
                                </IonCardContent>
                            </IonCard>
                        </div>
                    )}

                    <div className="totem-footer">
                        <IonText color="medium">
                            <p>Horário de atendimento: 7h às 17h</p>
                        </IonText>
                    </div>
                </div>

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    duration={3000}
                    position="top"
                />
            </IonContent>
        </IonPage>
    );
};

export default Totem;
