import * as signalR from "@microsoft/signalr";

// TypeScript interfaces and types
interface NotificationMessage {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: Date;
    userId?: string;
}

interface ConnectionStats {
    totalMessages: number;
    receivedMessages: number;
    connectionStartTime: Date | null;
}

interface MessageData {
    content: string;
    type: 'received';
    timestamp: Date;
    method?: string;
    messageType?: string;
}

type ConnectionState = 'Disconnected' | 'Connecting' | 'Connected' | 'Disconnecting' | 'Reconnecting';

type LogType = 'info' | 'success' | 'warning' | 'error';

class SignalRTestClient {
    private connection: any = null;
    private connectionState: ConnectionState = 'Disconnected';
    private stats: ConnectionStats = {
        totalMessages: 0,
        receivedMessages: 0,
        connectionStartTime: null
    };
    private connectionTimer: NodeJS.Timeout | null = null;

    constructor() {
        this.init();
    }

    private init(): void {
        this.bindEvents();
        this.updateUI();
    }

    private bindEvents(): void {
        const connectBtn = document.getElementById('connect-btn');
        const clearMessagesBtn = document.getElementById('clear-messages');
        const clearLogsBtn = document.getElementById('clear-logs');

        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                if (this.connectionState === 'Disconnected') {
                    this.connect();
                } else {
                    this.disconnect();
                }
            });
        }

        if (clearMessagesBtn) {
            clearMessagesBtn.addEventListener('click', () => {
                this.clearMessages();
            });
        }

        if (clearLogsBtn) {
            clearLogsBtn.addEventListener('click', () => {
                this.clearLogs();
            });
        }
    }

    private async connect(): Promise<void> {
        try {
            const hubUrlInput = document.getElementById('hub-url') as HTMLInputElement;
            const hubMethodInput = document.getElementById('hub-method') as HTMLInputElement;
            const userIdInput = document.getElementById('user-id') as HTMLInputElement;
            const accessTokenInput = document.getElementById('access-token') as HTMLInputElement;

            if (!hubUrlInput || !hubMethodInput) {
                this.addLog('Hub URL and Method inputs not found', 'error');
                return;
            }

            const hubUrl = hubUrlInput.value;
            const hubMethod = hubMethodInput.value;
            const userId = userIdInput?.value || '';
            const accessToken = accessTokenInput?.value || '';

            if (!hubUrl || !hubMethod) {
                this.addLog('Hub URL and Method are required', 'error');
                return;
            }

            this.updateConnectionState('Connecting');
            this.addLog('Connecting to SignalR hub...', 'info');

            // Create connection with options
            const connectionBuilder = new signalR.HubConnectionBuilder()
                .withUrl(hubUrl, {
                    accessTokenFactory: () => accessToken,
                    skipNegotiation: false,
                    transport: signalR.HttpTransportType.WebSockets
                })
                .withAutomaticReconnect({
                    nextRetryDelayInMilliseconds: (retryContext: any) => {
                        if (retryContext.elapsedMilliseconds < 60000) {
                            return Math.random() * 10000;
                        } else {
                            return null;
                        }
                    }
                })
                .configureLogging(signalR.LogLevel.Information);

            this.connection = connectionBuilder.build();

            // Event handlers
            this.connection.onclose((error: any) => {
                this.updateConnectionState('Disconnected');
                this.addLog(error ? `Connection closed with error: ${error}` : 'Connection closed', 'error');
                this.stopConnectionTimer();
            });

            this.connection.onreconnecting((error: any) => {
                this.updateConnectionState('Reconnecting');
                this.addLog(error ? `Reconnecting due to error: ${error}` : 'Reconnecting...', 'warning');
            });

            this.connection.onreconnected((connectionId: string) => {
                this.updateConnectionState('Connected');
                this.addLog(`Reconnected with connection ID: ${connectionId}`, 'success');
            });

            // Listen to hub method
            this.connection.on(hubMethod, (data: any) => {
                this.handleReceivedMessage(data, hubMethod);
            });

            // Additional common methods
            this.connection.on('UserConnected', (connectionId: string, userId: string) => {
                this.addLog(`User connected: ${userId} (${connectionId})`, 'info');
            });

            this.connection.on('UserDisconnected', (connectionId: string, userId: string) => {
                this.addLog(`User disconnected: ${userId} (${connectionId})`, 'info');
            });

            // Start connection
            await this.connection.start();
            
            this.updateConnectionState('Connected');
            this.addLog(`Connected successfully! Connection ID: ${this.connection.connectionId}`, 'success');
            
            // Join user to group if userId provided
            if (userId) {
                try {
                    await this.connection.invoke('JoinUserGroup', userId);
                    this.addLog(`Joined user group: ${userId}`, 'success');
                } catch (error: any) {
                    this.addLog(`Failed to join user group: ${error}`, 'warning');
                }
            }

            this.stats.connectionStartTime = new Date();
            this.startConnectionTimer();

        } catch (error: any) {
            this.updateConnectionState('Disconnected');
            this.addLog(`Connection failed: ${error.message}`, 'error');
            console.error('SignalR Connection Error:', error);
        }
    }

    private async disconnect(): Promise<void> {
        if (this.connection) {
            this.updateConnectionState('Disconnecting');
            this.addLog('Disconnecting...', 'info');
            
            try {
                await this.connection.stop();
                this.addLog('Disconnected successfully', 'info');
            } catch (error: any) {
                this.addLog(`Error during disconnect: ${error.message}`, 'error');
            }
            
            this.connection = null;
            this.updateConnectionState('Disconnected');
            this.stopConnectionTimer();
        }
    }

    private handleReceivedMessage(data: any, method: string): void {
        let content: string;
        let messageType = 'info';

        // Handle different data types
        if (typeof data === 'string') {
            content = data;
        } else if (typeof data === 'object') {
            content = JSON.stringify(data, null, 2);
            // Try to determine message type from object
            if (data.type) {
                messageType = data.type;
            }
        } else {
            content = String(data);
        }

        this.addMessage({
            content: content,
            type: 'received',
            timestamp: new Date(),
            method: method,
            messageType: messageType
        });

        this.stats.receivedMessages++;
        this.stats.totalMessages++;
        this.addLog(`Message received via ${method}`, 'success');
        this.updateStats();

        // Play notification sound (optional)
        this.playNotificationSound();
    }

    private addMessage(messageData: MessageData): void {
        const container = document.getElementById('messages-container');
        if (!container) return;
        
        // Clear empty state if it exists
        if (container.children.length === 1 && container.children[0].classList.contains('text-center')) {
            container.innerHTML = '';
        }

        const messageElement = document.createElement('div');
        messageElement.className = 'bg-green-100 border-l-4 border-green-500 mr-8 p-3 rounded-lg';

        const timestamp = messageData.timestamp.toLocaleTimeString();
        const typeIcon = 'fa-arrow-down';
        const typeColor = 'text-green-600';

        messageElement.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div class="flex items-center space-x-2">
                    <i class="fas ${typeIcon} ${typeColor}"></i>
                    <span class="text-xs font-medium ${typeColor}">
                        RECEIVED
                    </span>
                    ${messageData.method ? `<span class="text-xs text-gray-500">(${messageData.method})</span>` : ''}
                </div>
                <span class="text-xs text-gray-500">${timestamp}</span>
            </div>
            <pre class="text-sm text-gray-800 whitespace-pre-wrap font-mono">${messageData.content}</pre>
        `;

        container.appendChild(messageElement);
        container.scrollTop = container.scrollHeight;

        // Update message count
        const messageCountElement = document.getElementById('message-count');
        if (messageCountElement) {
            messageCountElement.textContent = container.children.length.toString();
        }
    }

    private addLog(message: string, type: LogType = 'info'): void {
        const container = document.getElementById('logs-container');
        if (!container) return;
        
        // Clear empty state if it exists
        if (container.children.length === 1 && container.children[0].classList.contains('text-center')) {
            container.innerHTML = '';
        }

        const logElement = document.createElement('div');
        const timestamp = new Date().toLocaleTimeString();
        
        const typeConfig: Record<LogType, { class: string; icon: string }> = {
            'info': { class: 'bg-gray-100 text-gray-800', icon: 'fa-info-circle' },
            'success': { class: 'bg-green-100 text-green-800', icon: 'fa-check-circle' },
            'warning': { class: 'bg-yellow-100 text-yellow-800', icon: 'fa-exclamation-triangle' },
            'error': { class: 'bg-red-100 text-red-800', icon: 'fa-times-circle' }
        };

        const config = typeConfig[type];
        
        logElement.className = `p-2 rounded text-sm ${config.class}`;
        logElement.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-2">
                    <i class="fas ${config.icon}"></i>
                    <span class="font-mono">${message}</span>
                </div>
                <span class="text-xs opacity-75">${timestamp}</span>
            </div>
        `;

        container.appendChild(logElement);
        container.scrollTop = container.scrollHeight;
    }

    private updateConnectionState(newState: ConnectionState): void {
        this.connectionState = newState;
        this.updateUI();
    }

    private updateUI(): void {
        const statusElement = document.getElementById('connection-status');
        const connectBtn = document.getElementById('connect-btn');
        const inputs = ['hub-url', 'hub-method', 'user-id', 'access-token'];

        // Update connection status
        const stateConfig: Record<ConnectionState, { class: string; icon: string; text: string }> = {
            'Connected': { class: 'text-green-500', icon: 'fa-wifi', text: 'Connected' },
            'Connecting': { class: 'text-yellow-500', icon: 'fa-spinner fa-spin', text: 'Connecting...' },
            'Reconnecting': { class: 'text-yellow-500', icon: 'fa-spinner fa-spin', text: 'Reconnecting...' },
            'Disconnecting': { class: 'text-orange-500', icon: 'fa-spinner fa-spin', text: 'Disconnecting...' },
            'Disconnected': { class: 'text-red-500', icon: 'fa-wifi-slash', text: 'Disconnected' }
        };

        const config = stateConfig[this.connectionState];
        if (statusElement) {
            statusElement.className = `flex items-center space-x-2 ${config.class}`;
            statusElement.innerHTML = `<i class="fas ${config.icon}"></i><span class="font-semibold">${config.text}</span>`;
        }

        // Update connect button
        if (connectBtn) {
            if (this.connectionState === 'Disconnected') {
                connectBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Connect';
                connectBtn.className = 'w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200';
            } else {
                connectBtn.innerHTML = '<i class="fas fa-stop mr-2"></i>Disconnect';
                connectBtn.className = 'w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-200';
            }
        }

        // Enable/disable inputs
        const isDisconnected = this.connectionState === 'Disconnected';
        inputs.forEach(id => {
            const element = document.getElementById(id) as HTMLInputElement;
            if (element) {
                element.disabled = !isDisconnected;
            }
        });
    }

    private startConnectionTimer(): void {
        this.connectionTimer = setInterval(() => {
            if (this.stats.connectionStartTime) {
                const elapsed = new Date().getTime() - this.stats.connectionStartTime.getTime();
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                const timeElement = document.getElementById('connection-time');
                if (timeElement) {
                    timeElement.textContent = 
                        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
            }
        }, 1000);
    }

    private stopConnectionTimer(): void {
        if (this.connectionTimer) {
            clearInterval(this.connectionTimer);
            this.connectionTimer = null;
        }
        const timeElement = document.getElementById('connection-time');
        if (timeElement) {
            timeElement.textContent = '00:00';
        }
        this.stats.connectionStartTime = null;
    }

    private updateStats(): void {
        const totalElement = document.getElementById('total-messages');
        const receivedElement = document.getElementById('received-messages');

        if (totalElement) totalElement.textContent = this.stats.totalMessages.toString();
        if (receivedElement) receivedElement.textContent = this.stats.receivedMessages.toString();
    }

    private clearMessages(): void {
        const container = document.getElementById('messages-container');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center text-gray-500 mt-20">
                <i class="fas fa-bell text-4xl mb-3 opacity-50"></i>
                <p>No messages yet. Connect to start receiving notifications.</p>
            </div>
        `;
        
        const messageCountElement = document.getElementById('message-count');
        if (messageCountElement) {
            messageCountElement.textContent = '0';
        }
        this.addLog('Messages cleared', 'info');
    }

    private clearLogs(): void {
        const container = document.getElementById('logs-container');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center text-gray-500 mt-20">
                <i class="fas fa-cogs text-4xl mb-3 opacity-50"></i>
                <p>No logs yet. Connection events will appear here.</p>
            </div>
        `;
    }

    private playNotificationSound(): void {
        // Create a simple beep sound
        if (typeof(Audio) !== "undefined") {
            try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch (error) {
                // Audio not supported or blocked
            }
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new SignalRTestClient();
}); 