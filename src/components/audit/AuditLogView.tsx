import React, { useState, useEffect } from 'react';
import { History, Shield, Calendar, Filter } from 'lucide-react';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { formatDate } from '../../utils/formatters';
import type { AuditLog } from '../../types';

export const AuditLogView: React.FC = () => {
  const { currentSite, currentSiteId } = useAppStore();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterAction, setFilterAction] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentSiteId) {
      loadLogs();
    }
  }, [currentSiteId]);

  const loadLogs = async () => {
    if (!currentSiteId) return;
    setIsLoading(true);
    try {
      const list = await db.auditLogs
        .where({ siteId: currentSiteId })
        .reverse()
        .sortBy('timestamp');
      setLogs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = logs.filter(l => filterAction === 'all' || l.action === filterAction);

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <History className="w-6 h-6 text-construction-400" />
            <span>Audit Trail & Tamper Log</span>
          </h2>
          <p className="text-xs text-charcoal-400 mt-0.5">
            Site: {currentSite?.name} • Immutable log of creates, payments, purchases, and stock movements
          </p>
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-charcoal-900 border border-charcoal-800 rounded-xl px-3 py-2 text-xs text-white"
        >
          <option value="all">All Actions</option>
          <option value="purchase">Purchases</option>
          <option value="payment">Payments</option>
          <option value="usage">Material Usage</option>
          <option value="return">Material Return</option>
          <option value="create">Creates</option>
          <option value="update">Updates</option>
        </select>
      </div>

      {/* Logs List */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-charcoal-400">Loading audit trail...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-charcoal-400">
            No audit logs found for this site.
          </div>
        ) : (
          <div className="divide-y divide-charcoal-800">
            {filtered.map((log) => (
              <div key={log.id} className="p-4 text-xs space-y-1 hover:bg-charcoal-800/40 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-white uppercase text-[11px]">
                      {log.entity}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        log.action === 'payment'
                          ? 'bg-emerald-950 text-emerald-400'
                          : log.action === 'purchase'
                          ? 'bg-amber-950 text-amber-400'
                          : log.action === 'usage'
                          ? 'bg-sky-950 text-sky-400'
                          : 'bg-charcoal-800 text-charcoal-300'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-charcoal-500 font-mono text-[10px]">#{log.entityId}</span>
                  </div>

                  <span className="text-[11px] text-charcoal-400">
                    {new Date(log.timestamp).toLocaleString('en-IN')}
                  </span>
                </div>

                {log.newValue && (
                  <div className="text-[11px] text-charcoal-300 font-mono bg-charcoal-950/60 p-2 rounded-lg mt-1 overflow-x-auto">
                    {log.newValue}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
