import { useLiveQuery } from '@electric-sql/pglite-react';
import { incidentsCollection } from '../../lib/database';
import { Incident } from '../../types';

export const useIncidentData = () => {
  const res = useLiveQuery(`SELECT * FROM incidents WHERE is_deleted = false ORDER BY date DESC;`);

  const incidents = res?.rows || [];

  return {
    data: incidents,
    incidents,
    logs: incidents,
    isLoading: res === undefined,
    error: res?.error || null,
    addIncident: async (incident: Partial<Incident>) => {
      await incidentsCollection.insert({ ...incident, id: incident.id || crypto.randomUUID(), isDeleted: false } as Incident);
    },
    updateIncident: async (id: string, updates: Partial<Incident>) => {
      await incidentsCollection.update(id, updates);
    },
    deleteIncident: async (id: string) => {
      await incidentsCollection.delete(id);
    }
  };
};
