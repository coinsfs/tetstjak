import { useState, useEffect, useCallback } from 'react';
import { importService, ImportTaskStatus } from '@/services/import';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface UseImportPollingProps {
  storageKey: string;
  onSuccess?: (result: any) => void;
  onError?: (errors: string[]) => void;
}

export const useImportPolling = ({ storageKey, onSuccess, onError }: UseImportPollingProps) => {
  const { token } = useAuth();
  const [isPolling, setIsPolling] = useState(false);
  const [taskStatus, setTaskStatus] = useState<ImportTaskStatus | null>(null);

  const startPolling = useCallback((taskId: string) => {
    localStorage.setItem(storageKey, taskId);
    setIsPolling(true);
  }, [storageKey]);

  const stopPolling = useCallback(() => {
    localStorage.removeItem(storageKey);
    setIsPolling(false);
    setTaskStatus(null);
  }, [storageKey]);

  const pollTaskStatus = useCallback(async (taskId: string) => {
    if (!token) return;

    try {
      const status = await importService.getTaskStatus(token, taskId);
      setTaskStatus(status);

      if (status.status === 'SUCCESS') {
        const result = status.result;
        if (result) {
          if (result.failed_count > 0) {
            toast.error(`Import selesai dengan ${result.failed_count} data gagal`);
            onError?.(result.errors);
          } else {
            toast.success(`Import berhasil! ${result.success_count} data berhasil diimpor`);
          }
          onSuccess?.(result);
        }
        stopPolling();
      } else if (status.status === 'FAILED') {
        toast.error('Import gagal. Silakan coba lagi.');
        onError?.(status.result?.errors || ['Import failed']);
        stopPolling();
      }
    } catch (error) {
      console.error('Error polling task status:', error);
      toast.error('Gagal memeriksa status import');
      stopPolling();
    }
  }, [token, onSuccess, onError, stopPolling]);

  useEffect(() => {
    const savedTaskId = localStorage.getItem(storageKey);
    if (savedTaskId && token) {
      setIsPolling(true);
      pollTaskStatus(savedTaskId);
    }
  }, [storageKey, token, pollTaskStatus]);

  useEffect(() => {
    if (!isPolling || !taskStatus?.task_id) return;

    const interval = setInterval(() => {
      if (taskStatus.status === 'PENDING' || taskStatus.status === 'PROCESSING') {
        pollTaskStatus(taskStatus.task_id);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [isPolling, taskStatus, pollTaskStatus]);

  return {
    isPolling,
    taskStatus,
    startPolling,
    stopPolling
  };
};