import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Search, X, FileText } from 'lucide-react';
import { format } from 'date-fns';

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await api.get(`/requests/search?q=${encodeURIComponent(query)}`);
                setResults(res.data.data.requests);
                setIsOpen(true);
            } catch (err) {
                console.error('Search failed', err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300); 

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = (requestId) => {
        navigate(`/requests/${requestId}`);
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-brand-primary/10 text-brand-primary',
            approved: 'bg-emerald-100 text-emerald-700',
            rejected: 'bg-red-100 text-red-700',
            escalated: 'bg-orange-100 text-orange-700',
            overdue: 'bg-red-50 text-red-600'
        };
        return colors[status] || 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="flex items-center w-full max-w-md relative" ref={searchRef}>
            <Search size={16} className="absolute left-3 text-text-muted z-10" />
            <input
                type="text"
                placeholder="Search requests (ID, Type, User)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setIsOpen(true)}
                className="pl-9 pr-10 py-1.5 w-full bg-[#f4f6f5] border border-transparent focus:bg-white focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10 rounded-md text-sm transition-all outline-none placeholder:text-text-muted/80 text-text-primary"
            />
            {query && (
                <button
                    onClick={() => {
                        setQuery('');
                        setResults([]);
                        setIsOpen(false);
                    }}
                    className="absolute right-3 text-text-muted hover:text-text-primary"
                >
                    <X size={16} />
                </button>
            )}

            {}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-[#eef2f1] z-50 max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-text-muted text-sm">
                            Searching...
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-4 text-center text-text-muted text-sm">
                            No results found for "{query}"
                        </div>
                    ) : (
                        <>
                            <div className="p-3 border-b border-[#eef2f1] bg-[#f8faf9]">
                                <p className="text-xs font-semibold text-text-muted uppercase">
                                    {results.length} Result{results.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            {results.map((request) => (
                                <div
                                    key={request._id}
                                    onClick={() => handleResultClick(request._id)}
                                    className="p-3 border-b border-[#eef2f1] hover:bg-[#f8faf9] cursor-pointer transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="mt-1">
                                                <FileText size={16} className="text-brand-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-sm text-text-primary truncate">
                                                        {request.template?.title || 'Unknown Template'}
                                                    </h4>
                                                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(request.status)}`}>
                                                        {request.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-text-secondary">
                                                    by {request.requester?.name || 'Unknown'} • {format(new Date(request.createdAt), 'MMM d, yyyy')}
                                                </p>
                                                <p className="text-xs text-text-muted font-mono mt-1">
                                                    #{request._id.slice(-6).toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
