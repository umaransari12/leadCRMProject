import { useCallback, useEffect, useRef, useState } from 'react';
import api from './api';

// Components that mount together (e.g. the header and the page) share a single in-flight request.
let inFlight = null;
const fetchLeads = (force) => {
    // force: used after a change (add/update/delete) so a request that started before the change is never reused.
    if (force || !inFlight) {
        const request = api.get('/api/leads');
        inFlight = request;
        request.finally(() => {
            if (inFlight === request) inFlight = null;
        }).catch(() => {});
        return request;
    }
    return inFlight;
};

// Loads the signed-in user's leads from the API (never a hardcoded list).
const useLeads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const loadedOnce = useRef(false);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const load = useCallback(async (force) => {
        // Only the first load shows the loading state; later refreshes update the list in place without flicker.
        if (!loadedOnce.current) setLoading(true);
        setError('');
        try {
            const response = await fetchLeads(force);
            if (!mounted.current) return;
            setLeads(response.data && Array.isArray(response.data.data) ? response.data.data : []);
            loadedOnce.current = true;
        } catch (err) {
            if (!mounted.current) return;
            if (!loadedOnce.current) setLeads([]);
            setError(
                err.response
                    ? err.response.data?.message || 'Could not load your leads.'
                    : 'Could not reach the server. Check your connection and try again.'
            );
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(false);
    }, [load]);

    const reload = useCallback(() => load(true), [load]);

    return { leads, loading, error, reload };
};

export default useLeads;
