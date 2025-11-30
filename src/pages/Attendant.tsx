import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonText,
    IonSpinner,
    IonIcon,
    IonToast,
    IonSelect,
    IonSelectOption,
    IonBadge,
    IonItem,
    IonLabel
} from '@ionic/react';
import { callOutline, checkmarkCircleOutline, timeOutline, personOutline } from 'ionicons/icons';
import { queueService } from '../services/QueueService';
import { databaseService } from '../services/DatabaseService';
import { Ticket, TICKET_TYPES } from '../models/Ticket';
import './Attendant.css';

const Attendant: React.FC = () => {
    const [counterNumber, setCounterNumber] = useState<number>(1);
    const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [serviceStartTime, setServiceStartTime] = useState<Date | null>(null);
    const [elapsedTime, setElapsedTime] = useState<number>(0);

    useEffect(() => {
        initializeDatabase();
        initializeCounter();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (serviceStartTime) {
            interval = setInterval(() => {
                const now = new Date();
                const diff = Math.floor((now.getTime() - serviceStartTime.getTime()) / 1000);
                setElapsedTime(diff);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [serviceStartTime]);

    const initializeDatabase = async () => {
        try {
            await databaseService.initialize();
        } catch (error) {
            console.error('Failed to initialize database:', error);
        }
    };

    const initializeCounter = () => {
        queueService.initializeCounter(counterNumber);
    };

    const handleCounterChange = (value: number) => {
        if (currentTicket) {
            setToastMessage('Finalize o atendimento atual antes de trocar de guichê');
            setShowToast(true);
            return;
        }
        setCounterNumber(value);
        queueService.initializeCounter(value);
    };

    const handleCallNext = async () => {
        setLoading(true);
        try {
            const ticket = await queueService.callNextTicket(counterNumber);

            if (!ticket) {
                setToastMessage('Não há senhas na fila');
                setShowToast(true);
                setLoading(false);
                return;
            }

            setCurrentTicket(ticket);
            setServiceStartTime(new Date());
            setElapsedTime(0);
            setToastMessage(`Senha ${ticket.ticketNumber} chamada!`);
            setShowToast(true);
        } catch (error: any) {
            setToastMessage(error.message || 'Erro ao chamar próxima senha');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const handleFinishService = async () => {
        if (!currentTicket) return;

        setLoading(true);
        try {
            await queueService.finishService(counterNumber);
            setToastMessage('Atendimento finalizado!');
            setShowToast(true);
            setCurrentTicket(null);
            setServiceStartTime(null);
            setElapsedTime(0);
        } catch (error: any) {
            setToastMessage(error.message || 'Erro ao finalizar atendimento');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const formatElapsedTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonTitle>Atendente - Guichê {counterNumber}</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="attendant-content" fullscreen>
                <div className="attendant-container">
                    {/* Seleção de Guichê */}
                    <IonCard>
                        <IonCardHeader>
                            <IonCardTitle>Configuração</IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            <IonItem>
                                <IonLabel>Número do Guichê:</IonLabel>
                                <IonSelect
                                    value={counterNumber}
                                    onIonChange={(e) => handleCounterChange(e.detail.value)}
                                    disabled={currentTicket !== null}
                                >
                                    {[1, 2, 3, 4, 5].map((num) => (
                                        <IonSelectOption key={num} value={num}>
                                            Guichê {num}
                                        </IonSelectOption>
                                    ))}
                                </IonSelect>
                            </IonItem>
                        </IonCardContent>
                    </IonCard>

                    {/* Senha Atual */}
                    {currentTicket ? (
                        <IonCard className="current-ticket-card">
                            <IonCardHeader>
                                <IonCardTitle>Atendimento em Andamento</IonCardTitle>
                            </IonCardHeader>
                            <IonCardContent>
                                <div className="current-ticket-display">
                                    <div
                                        className="ticket-number-large"
                                    >
                                        {currentTicket.ticketNumber}
                                    </div>

                                    <IonBadge
                                        className="ticket-type-badge-large"
                                        style={{ '--background': 'transparent', '--color': 'white' }}
                                    >
                                        {TICKET_TYPES[currentTicket.ticketType].name}
                                    </IonBadge>

                                    <div className="service-info">
                                        <div className="info-row">
                                            <IonIcon icon={timeOutline} />
                                            <IonText>
                                                <p>Tempo decorrido: <strong>{formatElapsedTime(elapsedTime)}</strong></p>
                                            </IonText>
                                        </div>

                                        <div className="info-row">
                                            <IonIcon icon={personOutline} />
                                            <IonText>
                                                <p>Emitida às: {currentTicket.issueTime}</p>
                                            </IonText>
                                        </div>
                                    </div>

                                    <IonButton
                                        expand="block"
                                        size="large"
                                        onClick={handleFinishService}
                                        disabled={loading}
                                        className="finish-button"
                                    >
                                        <IonIcon slot="start" icon={checkmarkCircleOutline} />
                                        Finalizar Atendimento
                                    </IonButton>
                                </div>
                            </IonCardContent>
                        </IonCard>
                    ) : (
                        <IonCard className="call-next-card">
                            <IonCardContent>
                                <div className="call-next-content">
                                    <IonIcon icon={callOutline} className="call-icon" />
                                    <IonText>
                                        <h2>Pronto para atender</h2>
                                        <p>Clique no botão abaixo para chamar a próxima senha</p>
                                    </IonText>

                                    <IonButton
                                        expand="block"
                                        color="primary"
                                        size="large"
                                        onClick={handleCallNext}
                                        disabled={loading}
                                        className="call-button"
                                    >
                                        {loading ? (
                                            <IonSpinner name="crescent" />
                                        ) : (
                                            <>
                                                <IonIcon slot="start" icon={callOutline} />
                                                Chamar Próximo
                                            </>
                                        )}
                                    </IonButton>
                                </div>
                            </IonCardContent>
                        </IonCard>
                    )}

                    {/* Instruções */}
                    <IonCard className="instructions-card">
                        <IonCardHeader>
                            <IonCardTitle>Instruções</IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            <ul className="instructions-list">
                                <li>Selecione o número do seu guichê</li>
                                <li>Clique em "Chamar Próximo" para chamar uma senha</li>
                                <li>O sistema seguirá a ordem de prioridade automaticamente</li>
                                <li>Após o atendimento, clique em "Finalizar Atendimento"</li>
                                <li>A senha será exibida no painel para o cliente</li>
                            </ul>
                        </IonCardContent>
                    </IonCard>
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

export default Attendant;
