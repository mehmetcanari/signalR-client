# 🔔 SignalR E-Commerce Notification Client

A modern, real-time notification client for e-commerce applications. This client provides a clean, responsive interface for testing and monitoring SignalR connections and real-time notifications.

## ✨ Features

### 🚀 Core Functionality
- **Real-time SignalR Connection**: Connect to any SignalR hub with custom configurations
- **Live Notifications**: Receive and display real-time notifications from your e-commerce backend
- **JWT Authentication**: Support for token-based authentication
- **User-specific Messaging**: Optional user ID for targeted notifications
- **Auto-reconnection**: Automatic reconnection with intelligent retry logic

### 🎨 User Interface
- **Modern Design**: Clean, responsive UI built with Tailwind CSS
- **Real-time Status**: Live connection status indicator
- **Message History**: View all received notifications with timestamps
- **Connection Logs**: Detailed logging of connection events and errors
- **Statistics Dashboard**: Track message counts and connection uptime
- **Dark Theme**: Professional dark theme for better user experience

### 🔧 Technical Features
- **TypeScript**: Full type safety and modern JavaScript features
- **Vite**: Fast development server and build tool
- **Microsoft SignalR**: Official SignalR client library
- **WebSocket Support**: Optimized for WebSocket transport
- **Error Handling**: Comprehensive error handling and user feedback
- **Audio Notifications**: Optional sound alerts for new messages

## 🛠️ Installation

### Prerequisites
- Node.js 24+ 
- npm or yarn package manager

### Setup
1. Clone the repository:
```bash
git clone https://github.com/mehmetcanari/signalR-client.git
cd signalR-client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## 🚀 Usage

### Basic Connection
1. **Hub URL**: Enter your SignalR hub endpoint (e.g., `http://localhost:5076/notificationHub`)
2. **Hub Method**: Specify the method name to listen for (e.g., `ReceiveNotification`)
3. **User ID** (Optional): Enter a user identifier for targeted notifications
4. **Access Token** (Optional): Provide JWT token for authenticated connections
5. Click **Connect** to establish the connection

### Configuration Examples

#### Basic E-commerce Notifications
```
Hub URL: http://localhost:5076/notificationHub
Hub Method: ReceiveNotification
User ID: Automatically fetched from the Identity 
Access Token: 
```

## 📋 Supported Message Types

The client handles various notification types commonly used in e-commerce:

- **Order Confirmations**: New order notifications
- **Payment Updates**: Payment status changes
- **System Messages**: Maintenance and updates

## 🔧 Development

### Project Structure
```
signalR-client/
├── src/
│   └── main.ts         
├── index.html          
├── package.json        
├── vite.config.js      
├── .gitignore          
└── README.md           
```