import { AirbyteRecord } from 'faros-airbyte-cdk';
import {
  Converter,
  DestinationRecord,
  StreamContext,
} from 'airbyte-faros-destination';
import { FLUSH } from 'airbyte-faros-destination/lib/common/types';
import {
  GerritEvent,
  GerritAccount,
  GerritChange,
  GerritPatchSet,
  GerritApproval,
  PatchSetCreatedEvent,
  ReviewerAddedEvent,
  ReviewerDeletedEvent,
  CommentAddedEvent,
  VoteDeletedEvent,
  ChangeAbandonedEvent,
  ChangeMergedEvent,
} from './types';

type RepoKey = {
  name: string;
  organization: {uid: string, source: string};
};

type CategoryDetail = {
  category: string;
  detail: string;
};

export class GerritEvents extends Converter {
  source = 'Gerrit';
  private users = new Map<string, GerritAccount>();
  private organizations = new Set<string>();
  private repositories = new Map<string, {project: string, org: string}>();

  destinationModels = [
    'vcs_User',
    'vcs_Organization',
    'vcs_Repository',
    'vcs_Branch',
    'vcs_PullRequest',
    'vcs_Commit',
    'vcs_PullRequestCommit',
    'vcs_PullRequestReviewRequest',
    'vcs_PullRequestReview',
    'vcs_PullRequestComment',
  ];

  id(record: AirbyteRecord): string {
    const event = record.record.data as GerritEvent;
    return `${event.type}_${event.eventCreatedOn}`;
  }

  async convert(
    record: AirbyteRecord,
    ctx: StreamContext
  ): Promise<ReadonlyArray<DestinationRecord>> {
    const event = record.record.data as GerritEvent;
    const results: DestinationRecord[] = [];

    switch (event.type) {
      case 'patchset-created':
        results.push(...this.convertPatchSetCreated(event as PatchSetCreatedEvent));
        break;
      case 'reviewer-added':
        results.push(...this.convertReviewerAdded(event as ReviewerAddedEvent));
        break;
      case 'reviewer-deleted':
        results.push(...this.convertReviewerDeleted(event as ReviewerDeletedEvent));
        break;
      case 'comment-added':
        results.push(...this.convertCommentAdded(event as CommentAddedEvent));
        break;
      case 'vote-deleted':
        results.push(...this.convertVoteDeleted(event as VoteDeletedEvent));
        break;
      case 'change-abandoned':
        results.push(...this.convertChangeAbandoned(event as ChangeAbandonedEvent));
        break;
      case 'change-merged':
        results.push(...this.convertChangeMerged(event as ChangeMergedEvent));
        break;
    }

    return results;
  }

  private createCommonRecords(change?: GerritChange, patchSet?: GerritPatchSet, eventCreatedOn?: number): {
    records: DestinationRecord[],
    prKey: {number: number, repository: RepoKey} | null
  } {
    const results: DestinationRecord[] = [];
    let prKey: {number: number, repository: RepoKey} | null = null;

    // Collect organization and get key
    const orgKey = this.collectOrganization(this.source);

    // Collect repository and get key
    const repoKey = this.collectRepository(change?.project, orgKey);

    // Create branch record
    let branchKey: any = null;
    if (change?.branch && repoKey) {
      branchKey = {
        name: change.branch,
        repository: repoKey,
      };
      const branchRecord: DestinationRecord = {
        model: 'vcs_Branch',
        record: branchKey,
      };
      results.push(branchRecord);
    }

    // Create pull request (Gerrit change)
    if (change && repoKey) {
      prKey = {
        number: change.number,
        repository: repoKey,
      };

      const closedAt = (change.status === 'ABANDONED' || change.status === 'MERGED') ? this.secondsToDate(eventCreatedOn) : null;
      const mergeCommit = (change.status === 'MERGED' && patchSet) ? {
        sha: patchSet.revision,
        repository: repoKey,
      } : undefined;

      const prRecord: DestinationRecord = {
        model: 'vcs_PullRequest',
        record: {
          ...prKey,
          title: change.subject,
          description: change.commitMessage,
          state: this.getChangeState(change.status),
          htmlUrl: change.url,
          targetBranch: branchKey,
          targetBranchName: change.branch,
          author: this.collectUser(change.owner),
          createdAt: this.secondsToDate(change.createdOn),
          updatedAt: this.secondsToDate(change.lastUpdated ?? change.createdOn),
          closedAt,
          ...(change.status === 'MERGED' && { mergedAt: closedAt }),
          ...(mergeCommit && { mergeCommit }),
        },
      };
      results.push(prRecord);

      // Create commit (patchset) record
      if (patchSet) {
        const commitKey = {
          sha: patchSet.revision,
          repository: repoKey,
        };

        const commitRecord: DestinationRecord = {
          model: 'vcs_Commit',
          record: {
            ...commitKey,
            message: change.commitMessage,
            author: this.collectUser(patchSet.author),
            createdAt: this.secondsToDate(patchSet.createdOn),
            diffStats: {
              linesAdded: patchSet.sizeInsertions,
              linesDeleted: patchSet.sizeDeletions,
            },
          },
        };
        results.push(commitRecord);

        // Link commit to pull request
        const prCommitRecord: DestinationRecord = {
          model: 'vcs_PullRequestCommit',
          record: {
            commit: commitKey,
            pullRequest: prKey,
          },
        };
        results.push(prCommitRecord);
      }
    }
    
    return { records: results, prKey };
  }

  private convertPatchSetCreated(event: PatchSetCreatedEvent): DestinationRecord[] {
    const { records } = this.createCommonRecords(event.change, event.patchSet);
    return records;
  }

  private secondsToDate(epochSeconds?: number): Date | null {
    return epochSeconds ? new Date(epochSeconds * 1000) : null;
  }

  private collectUser(account?: GerritAccount): {uid: string, source: string} | null {
    const uid = account?.username || account?.email;
    if (!uid) {
      return null;
    }

    // Always store/update the user
    this.users.set(uid, account);

    return {uid, source: this.source};
  }


  private collectOrganization(org: string): {uid: string, source: string} {
    const uid = org.toLowerCase();
    this.organizations.add(uid);
    return {uid, source: this.source};
  }

  private collectRepository(project?: string, orgKey?: {uid: string, source: string}): RepoKey | null {
    if (!project || !orgKey) {
      return null;
    }
    
    const name = project.toLowerCase();
    this.repositories.set(name, {
      project: name,
      org: orgKey.uid,
    });

    return {
      name,
      organization: orgKey,
    };
  }

  private getChangeState(status?: string): CategoryDetail {
    if (!status) {
      return {category: 'Custom', detail: 'Unknown'};
    }

    const detail = status;
    switch (status.toUpperCase()) {
      case 'MERGED':
        return {category: 'Merged', detail};
      case 'ABANDONED':
        return {category: 'Closed', detail};
      case 'NEW':
      case 'DRAFT':
        return {category: 'Open', detail};
      default:
        return {category: 'Custom', detail};
    }
  }

  private convertReviewerAdded(event: ReviewerAddedEvent): DestinationRecord[] {
    const { records, prKey } = this.createCommonRecords(event.change, event.patchSet);
    
    // Collect reviewer-specific users
    this.collectUser(event.reviewer);
    this.collectUser(event.adder);

    // Add reviewer request record
    if (event.reviewer && prKey) {
      const reviewRequestRecord: DestinationRecord = {
        model: 'vcs_PullRequestReviewRequest',
        record: {
          pullRequest: prKey,
          requestedReviewer: this.collectUser(event.reviewer),
        },
      };
      records.push(reviewRequestRecord);
    }
    
    return records;
  }

  private convertReviewerDeleted(event: ReviewerDeletedEvent): DestinationRecord[] {
    const { records, prKey } = this.createCommonRecords(event.change, event.patchSet);
    if (!prKey) return records;

    // Delete the reviewer request association
    if (event.reviewer) {
      const deleteRecord: DestinationRecord = {
        model: 'vcs_PullRequestReviewRequest__Deletion',
        record: {
          flushRequired: false,
          where: {
            pullRequest: prKey,
            requestedReviewer: this.collectUser(event.reviewer),
          },
        },
      };
      records.push(deleteRecord);
      records.push(FLUSH);
    }
    
    return records;
  }

  private convertCommentAdded(event: CommentAddedEvent): DestinationRecord[] {
    const { records, prKey } = this.createCommonRecords(event.change, event.patchSet);
    if (!prKey) return records;

    // Check for Code-Review approval with non-zero value
    const codeReview = event.approvals?.find(a => a.type === 'Code-Review' && a.value !== '0');
    if (codeReview) {
      const reviewRecord: DestinationRecord = {
        model: 'vcs_PullRequestReview',
        record: {
          number: event.eventCreatedOn,
          pullRequest: prKey,
          reviewer: this.collectUser(event.author),
          state: this.getCodeReviewState(codeReview),
          submittedAt: this.secondsToDate(event.eventCreatedOn),
        },
      };
      records.push(reviewRecord);
    }

    // Add comment record if there's actual comment text
    if (event.comment) {
      const commentRecord: DestinationRecord = {
        model: 'vcs_PullRequestComment',
        record: {
          number: event.eventCreatedOn,
          comment: event.comment,
          pullRequest: prKey,
          author: this.collectUser(event.author),
          createdAt: this.secondsToDate(event.eventCreatedOn),
        },
      };
      records.push(commentRecord);
    }
    
    return records;
  }

  private getCodeReviewState(approval: GerritApproval): CategoryDetail {
    const detail = approval.value;
    
    switch (approval.value) {
      case '2': return { category: 'Approved', detail };
      case '-2': return { category: 'ChangesRequested', detail };
      default: return { category: 'Commented', detail };
    }
  }

  private convertVoteDeleted(event: VoteDeletedEvent): DestinationRecord[] {
    const { records, prKey } = this.createCommonRecords(event.change, event.patchSet);
    if (!prKey) return records;

    // Check if Code-Review vote was deleted
    const codeReviewDeleted = event.approvals?.find(a => a.type === 'Code-Review');
    if (codeReviewDeleted) {
      const deleteRecord: DestinationRecord = {
        model: 'vcs_PullRequestReview__Deletion',
        record: {
          flushRequired: false,
          where: {
            pullRequest: prKey,
            reviewer: this.collectUser(event.reviewer),
          },
        },
      };
      records.push(deleteRecord);
      records.push(FLUSH);
    }
    
    return records;
  }

  private convertChangeAbandoned(event: ChangeAbandonedEvent): DestinationRecord[] {
    const { records } = this.createCommonRecords(event.change, event.patchSet, event.eventCreatedOn);
    return records;
  }

  private convertChangeMerged(event: ChangeMergedEvent): DestinationRecord[] {
    const { records } = this.createCommonRecords(event.change, event.patchSet, event.eventCreatedOn);
    return records;
  }
}