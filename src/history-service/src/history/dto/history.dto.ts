export type EventType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'TRANSFER'
  | 'CARD_BLOCK'
  | 'CARD_UNBLOCK'
  | 'CARD_CLOSE'
  | 'VERIFICATION'
  | 'PASSWORD_CHANGE'
  | 'PROFILE_UPDATE'
  | 'ADMIN_ACTION';

export class LogEventDto {
  userId: string | null;
  eventType: EventType;
  meta: any;
} 