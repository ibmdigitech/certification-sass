import { logConflict, getConflicts, resolveConflict, ConflictEntry } from './indexeddb';

export type ConflictStrategy = 'server-wins' | 'client-wins' | 'merge' | 'manual' | 'timestamp' | 'custom';

export interface ConflictResolverOptions {
  strategy: ConflictStrategy;
  customResolver?: (serverData: unknown, clientData: unknown) => unknown;
  timestampField?: string;
}

export interface ResolvedConflict {
  resolution: ConflictStrategy;
  resolvedData: unknown;
  requiresManualReview: boolean;
}

export class ConflictResolver {
  private defaultStrategy: ConflictStrategy = 'server-wins';
  private entityStrategies: Map<string, ConflictStrategy> = new Map();
  private customResolvers: Map<string, (serverData: unknown, clientData: unknown) => unknown> = new Map();
  private timestampFields: Map<string, string> = new Map();

  setDefaultStrategy(strategy: ConflictStrategy): void {
    this.defaultStrategy = strategy;
  }

  setEntityStrategy(entity: string, strategy: ConflictStrategy): void {
    this.entityStrategies.set(entity, strategy);
  }

  setCustomResolver(entity: string, resolver: (serverData: unknown, clientData: unknown) => unknown): void {
    this.customResolvers.set(entity, resolver);
  }

  setTimestampField(entity: string, field: string): void {
    this.timestampFields.set(entity, field);
  }

  getStrategy(entity: string): ConflictStrategy {
    return this.entityStrategies.get(entity) || this.defaultStrategy;
  }

  async resolveConflict(
    entity: string,
    entityId: string | number,
    serverData: unknown,
    clientData: unknown,
    options?: ConflictResolverOptions
  ): Promise<ResolvedConflict> {
    const strategy = options?.strategy || this.getStrategy(entity);
    const customResolver = options?.customResolver || this.customResolvers.get(entity);
    const timestampField = options?.timestampField || this.timestampFields.get(entity);

    let resolvedData: unknown;
    let requiresManualReview = false;

    switch (strategy) {
      case 'server-wins':
        resolvedData = serverData;
        break;

      case 'client-wins':
        resolvedData = clientData;
        break;

      case 'merge':
        resolvedData = this.mergeData(serverData, clientData);
        break;

      case 'timestamp':
        resolvedData = this.resolveByTimestamp(serverData, clientData, timestampField);
        break;

      case 'custom':
        if (customResolver) {
          resolvedData = customResolver(serverData, clientData);
        } else {
          resolvedData = this.mergeData(serverData, clientData);
        }
        break;

      case 'manual':
      default:
        resolvedData = serverData;
        requiresManualReview = true;
        break;
    }

    if (requiresManualReview) {
      await this.logConflictForManualReview(entity, entityId, serverData, clientData);
    }

    return { resolution: strategy as ConflictStrategy, resolvedData, requiresManualReview };
  }

  private mergeData(serverData: unknown, clientData: unknown): unknown {
    if (typeof serverData !== 'object' || serverData === null ||
        typeof clientData !== 'object' || clientData === null) {
      return clientData;
    }

    const server = serverData as Record<string, unknown>;
    const client = clientData as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...server };

    for (const [key, value] of Object.entries(client)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt' || key === 'version') continue;
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          merged[key] = this.mergeData(server[key], value);
        } else {
          merged[key] = value;
        }
      }
    }

    return merged;
  }

  private resolveByTimestamp(serverData: unknown, clientData: unknown, timestampField?: string): unknown {
    if (!timestampField) return serverData;

    const server = serverData as Record<string, unknown>;
    const client = clientData as Record<string, unknown>;

    const serverTime = server[timestampField] ? new Date(server[timestampField] as string).getTime() : 0;
    const clientTime = client[timestampField] ? new Date(client[timestampField] as string).getTime() : 0;

    return clientTime > serverTime ? clientData : serverData;
  }

  private async logConflictForManualReview(
    entity: string,
    entityId: string | number,
    serverData: unknown,
    clientData: unknown
  ): Promise<void> {
    await logConflict({
      entity,
      entityId,
      serverData,
      clientData,
      resolution: 'manual',
    });
  }

  async getPendingConflicts(entity?: string): Promise<ConflictEntry[]> {
    const conflicts = await getConflicts(false);
    if (entity) {
      return conflicts.filter(c => c.entity === entity);
    }
    return conflicts;
  }

  async resolvePendingConflict(
    conflictId: number,
    resolution: 'server-wins' | 'client-wins' | 'merge',
    resolvedData?: unknown
  ): Promise<void> {
    await resolveConflict(conflictId, resolution, resolvedData);
  }

  createEntityResolver(entity: string): EntityConflictResolver {
    return new EntityConflictResolver(this, entity);
  }
}

export class EntityConflictResolver {
  constructor(
    private resolver: ConflictResolver,
    private entity: string
  ) {}

  async resolve(
    entityId: string | number,
    serverData: unknown,
    clientData: unknown,
    options?: ConflictResolverOptions
  ): Promise<ResolvedConflict> {
    return this.resolver.resolveConflict(this.entity, entityId, serverData, clientData, options);
  }

  setStrategy(strategy: ConflictStrategy): void {
    this.resolver.setEntityStrategy(this.entity, strategy);
  }

  setCustomResolver(fn: (serverData: unknown, clientData: unknown) => unknown): void {
    this.resolver.setCustomResolver(this.entity, fn);
  }

  setTimestampField(field: string): void {
    this.resolver.setTimestampField(this.entity, field);
  }
}

export const conflictResolver = new ConflictResolver();

conflictResolver.setEntityStrategy('certificates', 'merge');
conflictResolver.setEntityStrategy('jobs', 'timestamp');
conflictResolver.setEntityStrategy('trainees', 'merge');
conflictResolver.setEntityStrategy('inspections', 'server-wins');
conflictResolver.setEntityStrategy('trainingSessions', 'merge');
conflictResolver.setEntityStrategy('timesheets', 'client-wins');

conflictResolver.setTimestampField('jobs', 'updatedAt');
conflictResolver.setTimestampField('certificates', 'updatedAt');
conflictResolver.setTimestampField('trainees', 'updatedAt');