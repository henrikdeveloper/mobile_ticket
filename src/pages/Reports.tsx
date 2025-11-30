import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonDatetime,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonList,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonToast
} from '@ionic/react';
import { downloadOutline, statsChartOutline, documentTextOutline } from 'ionicons/icons';
import { reportService } from '../services/ReportService';
import { databaseService } from '../services/DatabaseService';
import { DailyStats, ServiceRecord } from '../models/ServiceRecord';
import { formatDate } from '../utils/ticketGenerator';
import './Reports.css';

const Reports: React.FC = () => {
    const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');
    const [selectedDate, setSelectedDate] = useState<string>(formatDate());
    const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
    const [tickets, setTickets] = useState<ServiceRecord[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<any>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        initializeDatabase();
    }, []);

    useEffect(() => {
        if (reportType === 'daily') {
            loadDailyReport();
        } else {
            loadMonthlyReport();
        }
    }, [selectedDate, reportType]);

    const initializeDatabase = async () => {
        try {
            await databaseService.initialize();
            loadDailyReport();
        } catch (error) {
            console.error('Failed to initialize database:', error);
        }
    };

    const loadDailyReport = async () => {
        try {
            // Extract YYYY-MM-DD from ISO string if needed
            const dateStr = selectedDate.split('T')[0];
            const { stats, tickets } = await reportService.generateDailyReport(dateStr);
            setDailyStats(stats);
            setTickets(tickets);
        } catch (error) {
            console.error('Error loading daily report:', error);
        }
    };

    const loadMonthlyReport = async () => {
        try {
            const date = new Date(selectedDate);
            const { summary, allTickets } = await reportService.generateMonthlyReport(
                date.getFullYear(),
                date.getMonth() + 1
            );
            setMonthlyStats(summary);
            setTickets(allTickets);
        } catch (error) {
            console.error('Error loading monthly report:', error);
        }
    };

    const handleExportCSV = () => {
        if (tickets.length === 0) {
            setToastMessage('Sem dados para exportar');
            setShowToast(true);
            return;
        }

        const csv = reportService.exportToCSV(tickets);
        const filename = `relatorio-${reportType}-${selectedDate.split('T')[0]}.csv`;
        reportService.downloadReport(csv, filename, 'csv');

        setToastMessage('Relatório exportado com sucesso!');
        setShowToast(true);
    };

    const handleExportJSON = () => {
        const data = reportType === 'daily' ? dailyStats : monthlyStats;

        if (!data) {
            setToastMessage('Sem dados para exportar');
            setShowToast(true);
            return;
        }

        const json = reportService.exportStatsToJSON(data);
        const filename = `estatisticas-${reportType}-${selectedDate.split('T')[0]}.json`;
        reportService.downloadReport(json, filename, 'json');

        setToastMessage('Estatísticas exportadas com sucesso!');
        setShowToast(true);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="secondary">
                    <IonTitle>Relatórios e Estatísticas</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="reports-content" fullscreen>
                <div className="reports-container">

                    {/* Controls */}
                    <IonCard>
                        <IonCardContent>
                            <IonSegment value={reportType} onIonChange={e => setReportType(e.detail.value as any)}>
                                <IonSegmentButton value="daily">
                                    <IonLabel>Diário</IonLabel>
                                </IonSegmentButton>
                                <IonSegmentButton value="monthly">
                                    <IonLabel>Mensal</IonLabel>
                                </IonSegmentButton>
                            </IonSegment>

                            <div className="date-picker-container">
                                <IonItem lines="none">
                                    <IonLabel>Data de Referência:</IonLabel>
                                    <IonDatetime
                                        presentation={reportType === 'daily' ? 'date' : 'month-year'}
                                        value={selectedDate}
                                        onIonChange={e => setSelectedDate(e.detail.value as string)}
                                    />
                                </IonItem>
                            </div>

                            <div className="export-buttons">
                                <IonButton onClick={handleExportCSV} color="success">
                                    <IonIcon slot="start" icon={documentTextOutline} />
                                    Exportar CSV
                                </IonButton>
                                <IonButton onClick={handleExportJSON} color="tertiary">
                                    <IonIcon slot="start" icon={statsChartOutline} />
                                    Exportar JSON
                                </IonButton>
                            </div>
                        </IonCardContent>
                    </IonCard>

                    {/* Statistics Cards */}
                    <IonGrid>
                        <IonRow>
                            <IonCol size="12" sizeMd="6" sizeLg="3">
                                <IonCard className="stat-card">
                                    <IonCardContent>
                                        <div className="stat-label">Total Emitido</div>
                                        <div className="stat-value">
                                            {reportType === 'daily' ? dailyStats?.totalIssued || 0 : monthlyStats?.totalIssued || 0}
                                        </div>
                                    </IonCardContent>
                                </IonCard>
                            </IonCol>
                            <IonCol size="12" sizeMd="6" sizeLg="3">
                                <IonCard className="stat-card">
                                    <IonCardContent>
                                        <div className="stat-label">Total Atendido</div>
                                        <div className="stat-value">
                                            {reportType === 'daily' ? dailyStats?.totalAttended || 0 : monthlyStats?.totalAttended || 0}
                                        </div>
                                    </IonCardContent>
                                </IonCard>
                            </IonCol>
                            <IonCol size="12" sizeMd="6" sizeLg="3">
                                <IonCard className="stat-card">
                                    <IonCardContent>
                                        <div className="stat-label">Tempo Médio</div>
                                        <div className="stat-value">
                                            {Math.round(reportType === 'daily' ? dailyStats?.avgServiceTime || 0 : monthlyStats?.avgServiceTime || 0)} min
                                        </div>
                                    </IonCardContent>
                                </IonCard>
                            </IonCol>
                            <IonCol size="12" sizeMd="6" sizeLg="3">
                                <IonCard className="stat-card">
                                    <IonCardContent>
                                        <div className="stat-label">Taxa de Abandono</div>
                                        <div className="stat-value">
                                            {(() => {
                                                const issued = reportType === 'daily' ? dailyStats?.totalIssued || 0 : monthlyStats?.totalIssued || 0;
                                                const attended = reportType === 'daily' ? dailyStats?.totalAttended || 0 : monthlyStats?.totalAttended || 0;
                                                if (issued === 0) return '0%';
                                                return `${Math.round(((issued - attended) / issued) * 100)}%`;
                                            })()}
                                        </div>
                                    </IonCardContent>
                                </IonCard>
                            </IonCol>
                        </IonRow>
                    </IonGrid>

                    {/* Detailed Breakdown */}
                    <IonCard>
                        <IonCardHeader>
                            <IonCardTitle>Detalhamento por Tipo</IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            <IonGrid>
                                <IonRow className="header-row">
                                    <IonCol>Tipo</IonCol>
                                    <IonCol>Emitidas</IonCol>
                                    <IonCol>Atendidas</IonCol>
                                </IonRow>
                                <IonRow>
                                    <IonCol>Prioritária (SP)</IonCol>
                                    <IonCol>{reportType === 'daily' ? dailyStats?.spIssued || 0 : monthlyStats?.spIssued || 0}</IonCol>
                                    <IonCol>{reportType === 'daily' ? dailyStats?.spAttended || 0 : monthlyStats?.spAttended || 0}</IonCol>
                                </IonRow>
                                <IonRow>
                                    <IonCol>Geral (SG)</IonCol>
                                    <IonCol>{reportType === 'daily' ? dailyStats?.sgIssued || 0 : monthlyStats?.sgIssued || 0}</IonCol>
                                    <IonCol>{reportType === 'daily' ? dailyStats?.sgAttended || 0 : monthlyStats?.sgAttended || 0}</IonCol>
                                </IonRow>
                                <IonRow>
                                    <IonCol>Exames (SE)</IonCol>
                                    <IonCol>{reportType === 'daily' ? dailyStats?.seIssued || 0 : monthlyStats?.seIssued || 0}</IonCol>
                                    <IonCol>{reportType === 'daily' ? dailyStats?.seAttended || 0 : monthlyStats?.seAttended || 0}</IonCol>
                                </IonRow>
                            </IonGrid>
                        </IonCardContent>
                    </IonCard>

                    {/* Ticket Log */}
                    {tickets.length > 0 && (
                        <IonCard>
                            <IonCardHeader>
                                <IonCardTitle>Registro de Senhas</IonCardTitle>
                            </IonCardHeader>
                            <IonCardContent>
                                <div className="table-responsive">
                                    <table className="tickets-table">
                                        <thead>
                                            <tr>
                                                <th>Senha</th>
                                                <th>Tipo</th>
                                                <th>Hora Emissão</th>
                                                <th>Guichê</th>
                                                <th>Início</th>
                                                <th>Fim</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tickets.map((ticket, index) => (
                                                <tr key={index}>
                                                    <td>{ticket.ticketNumber}</td>
                                                    <td>{ticket.ticketType}</td>
                                                    <td>{ticket.issueTime}</td>
                                                    <td>{ticket.counterNumber || '-'}</td>
                                                    <td>{ticket.serviceStartTime || '-'}</td>
                                                    <td>{ticket.serviceEndTime || '-'}</td>
                                                    <td>
                                                        <span className={`status-badge ${ticket.attended ? 'attended' : 'pending'}`}>
                                                            {ticket.attended ? 'Atendido' : 'Pendente/Abandono'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </IonCardContent>
                        </IonCard>
                    )}

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

export default Reports;
