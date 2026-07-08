import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private activeClients = new Map<string, string[]>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const socketIds = this.activeClients.get(userId) || [];
      socketIds.push(client.id);
      this.activeClients.set(userId, socketIds);
      this.logger.log(
        `Client connected: ${client.id} associated with User: ${userId}`,
      );
    } else {
      this.logger.log(
        `Client connected without user association: ${client.id}`,
      );
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const socketIds = this.activeClients.get(userId) || [];
      const updated = socketIds.filter((id) => id !== client.id);
      if (updated.length > 0) {
        this.activeClients.set(userId, updated);
      } else {
        this.activeClients.delete(userId);
      }
      this.logger.log(`Client disconnected: ${client.id} for User: ${userId}`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('register')
  handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (data && data.userId) {
      const socketIds = this.activeClients.get(data.userId) || [];
      if (!socketIds.includes(client.id)) {
        socketIds.push(client.id);
        this.activeClients.set(data.userId, socketIds);
      }
      this.logger.log(`Registered client ${client.id} for user ${data.userId}`);
      return { status: 'success', message: 'Registered successfully' };
    }
    return { status: 'error', message: 'Invalid payload' };
  }

  sendToUser(userId: string, eventName: string, payload: any) {
    const socketIds = this.activeClients.get(userId);
    if (socketIds && socketIds.length > 0) {
      for (const socketId of socketIds) {
        this.server.to(socketId).emit(eventName, payload);
      }
      this.logger.log(`Sent notification '${eventName}' to User: ${userId}`);
    } else {
      this.logger.warn(
        `User ${userId} is offline. Notification '${eventName}' was not delivered via WebSocket.`,
      );
    }
  }

  sendToAll(eventName: string, payload: any) {
    this.server.emit(eventName, payload);
    this.logger.log(`Sent global broadcast notification '${eventName}'`);
  }
}
