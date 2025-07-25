export interface Entry {
  id: string;
  data: string;
  comments?: Entry[];
  createdAt: string;
  metadata: any;
  similarity?: number;
}

export interface FlattenedEntry extends Entry {
  relationshipType: 'root' | 'parent' | 'comment' | 'neighbor' | 'source';
  relationshipSource?: string;
  level: number;
  hasMoreRelations?: boolean;
  isProcessing?: boolean;
  tempImageUrl?: string;
}

export interface ThreadEntryCardProps {
  entry: FlattenedEntry;
  onRelationshipExpand: (
    entryId: string,
    type: 'parent' | 'comments' | 'neighbors',
  ) => void;
  onNavigateToEntry: (entryId: string) => void;
  onAddNewEntry: (newEntry: FlattenedEntry, parentId: string) => void;
  onImageUpload: (result: any, parentId: string) => void;
  onUrlUpload: (result: any, parentId: string) => void;
  expandedRelationships?: Set<string>;
  allEntryIds?: Set<string>;
  loadingRelationships?: Set<string>;
  maxDepth: number;
  onOpenTreeModal: (entry: FlattenedEntry) => void;
  onCardClick?: (entryId: string) => void;
  isCurrentEntry?: boolean;
  triggerAddComment?: boolean;
  onOpenAddCommentModal: (entry: FlattenedEntry) => void;
  onOpenAddURLModal: (entry: FlattenedEntry) => void;
  onOpenAddImageModal: (entry: FlattenedEntry) => void;
  onOpenJoinModal: (entry: FlattenedEntry) => void;
}

export interface TreePathDisplayProps {
  currentEntry: FlattenedEntry;
  allEntries: FlattenedEntry[];
}

export interface QuickLookProps {
  currentEntry: FlattenedEntry;
  allEntries: FlattenedEntry[];
}
