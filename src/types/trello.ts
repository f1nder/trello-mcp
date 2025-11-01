export interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  url: string;
  shortUrl: string;
  closed: boolean;
  starred: boolean;
  memberships: TrelloMembership[];
  lists?: TrelloList[];
  cards?: TrelloCard[];
  labels?: TrelloLabel[];
  organization?: TrelloOrganization;
  prefs: TrelloBoardPrefs;
  dateLastActivity: string;
  dateLastView?: string;
}

export interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
  idBoard: string;
  subscribed?: boolean;
  cards?: TrelloCard[];
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  idList: string;
  idBoard: string;
  idMembers: string[];
  idLabels: string[];
  idChecklists: string[];
  pos: number;
  url: string;
  shortUrl: string;
  due?: string;
  dueComplete: boolean;
  dateLastActivity: string;
  badges: TrelloCardBadges;
  attachments?: TrelloAttachment[];
  checklists?: TrelloChecklist[];
  labels?: TrelloLabel[];
  members?: TrelloMember[];
}

export interface TrelloMember {
  id: string;
  username: string;
  fullName: string;
  initials: string;
  avatarUrl?: string;
  email?: string;
}

export interface TrelloMembership {
  id: string;
  idMember: string;
  memberType: 'admin' | 'normal' | 'observer';
  unconfirmed: boolean;
  deactivated: boolean;
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
  idBoard: string;
  uses: number;
}

export interface TrelloChecklist {
  id: string;
  name: string;
  idCard: string;
  idBoard: string;
  pos: number;
  checkItems: TrelloChecklistItem[];
}

export interface TrelloChecklistItem {
  id: string;
  name: string;
  state: 'complete' | 'incomplete';
  pos: number;
  idChecklist: string;
  due?: string;
  idMember?: string;
}

export interface TrelloAttachment {
  id: string;
  name: string;
  url: string;
  bytes?: number;
  date: string;
  previews?: TrelloAttachmentPreview[];
}

export interface TrelloAttachmentPreview {
  id: string;
  url: string;
  bytes: number;
  height: number;
  width: number;
  scaled: boolean;
}

export interface TrelloOrganization {
  id: string;
  name: string;
  displayName: string;
  desc: string;
  url: string;
  website?: string;
}

export interface TrelloBoardPrefs {
  permissionLevel: 'private' | 'org' | 'public';
  voting: 'disabled' | 'members' | 'observers' | 'org' | 'public';
  comments: 'disabled' | 'members' | 'observers' | 'org' | 'public';
  invitations: 'members' | 'admins';
  selfJoin: boolean;
  cardCovers: boolean;
  cardAging: 'pirate' | 'regular';
  calendarFeedEnabled: boolean;
  background: string;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundTile: boolean;
  backgroundBrightness: 'dark' | 'light';
}

export interface TrelloCardBadges {
  votes: number;
  viewingMemberVoted: boolean;
  subscribed: boolean;
  fogbugz: string;
  checkItems: number;
  checkItemsChecked: number;
  comments: number;
  attachments: number;
  description: boolean;
  due?: string;
  dueComplete: boolean;
}

export interface TrelloApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface TrelloApiError {
  message: string;
  error: string;
  status: number;
}

export interface TrelloApiCredentials {
  apiKey: string;
  token: string;
}

export interface TrelloApiConfig {
  baseUrl: string;
  timeout: number;
  credentials: TrelloApiCredentials;
}

export interface TrelloReactionEmoji {
  unified?: string;
  native?: string;
  name?: string;
  shortName?: string;
  shortNames?: string[];
  skinVariation?: string;
  text?: string;
}

export interface TrelloReaction {
  id: string;
  idMember: string;
  idModel: string;
  idEmoji: string;
  date: string;
  modelType?: string;
  type?: string;
  emoji?: TrelloReactionEmoji;
  memberCreator?: TrelloMember;
}

export interface TrelloCreateReactionInput {
  shortName?: string;
  unified?: string;
  native?: string;
  skinVariation?: string;
}
