export interface GerritEvent {
  type: string;
  eventCreatedOn: number;
}

export interface GerritAccount {
  name?: string;
  email?: string;
  username?: string;
}

export interface GerritChange {
  project: string;
  branch: string;
  id: string;
  number: number;
  subject: string;
  owner: GerritAccount;
  url: string;
  commitMessage?: string;
  createdOn?: number;
  lastUpdated?: number;
  status?: string;
  wip?: boolean;
}

export interface GerritPatchSet {
  number: number;
  revision: string;
  ref: string;
  uploader: GerritAccount;
  createdOn: number;
  author: GerritAccount;
  isDraft?: boolean;
  kind?: string;
  sizeInsertions?: number;
  sizeDeletions?: number;
}

export interface PatchSetCreatedEvent extends GerritEvent {
  type: 'patchset-created';
  change: GerritChange;
  patchSet: GerritPatchSet;
  uploader: GerritAccount;
}

export interface ChangeMergedEvent extends GerritEvent {
  type: 'change-merged';
  change: GerritChange;
  patchSet: GerritPatchSet;
  submitter: GerritAccount;
  newRev?: string;
}

export interface GerritApproval {
  type: string;
  description: string;
  value: string;
  oldValue?: string;
}

export interface CommentAddedEvent extends GerritEvent {
  type: 'comment-added';
  change: GerritChange;
  patchSet: GerritPatchSet;
  author: GerritAccount;
  approvals?: GerritApproval[];
  comment?: string;
}

export interface ReviewerAddedEvent extends GerritEvent {
  type: 'reviewer-added';
  change: GerritChange;
  patchSet: GerritPatchSet;
  reviewer: GerritAccount;
  adder?: GerritAccount;
}

export interface ReviewerDeletedEvent extends GerritEvent {
  type: 'reviewer-deleted';
  change: GerritChange;
  patchSet: GerritPatchSet;
  reviewer: GerritAccount;
  remover?: GerritAccount;
  approvals?: GerritApproval[];
  comment?: string;
}

export interface VoteDeletedEvent extends GerritEvent {
  type: 'vote-deleted';
  change: GerritChange;
  patchSet: GerritPatchSet;
  reviewer: GerritAccount;
  remover?: GerritAccount;
  approvals?: GerritApproval[];
  comment?: string;
}

export interface ChangeAbandonedEvent extends GerritEvent {
  type: 'change-abandoned';
  change: GerritChange;
  patchSet: GerritPatchSet;
  reason?: string;
}