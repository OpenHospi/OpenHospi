"use client";

import {MapPin, X} from "lucide-react";
import {useCallback, useEffect, useRef, useState} from "react";

import {Input} from "@/components/ui/input";
import {cn} from "@/lib/utils";

export type AddressResult = {
    streetName: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    latitude: number;
    longitude: number;
};

type Suggestion = {
    id: string;
    weergavenaam: string;
};

type Props = {
    defaultDisplayValue?: string;
    onSelect: (result: AddressResult) => void;
    onClear: () => void;
    placeholder?: string;
};

const PDOK_SUGGEST_URL =
    "https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest";
const PDOK_LOOKUP_URL =
    "https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup";

function parseWktPoint(wkt: string): { latitude: number; longitude: number } | null {
    const match = wkt.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (!match) return null;
    return {longitude: Number.parseFloat(match[1]), latitude: Number.parseFloat(match[2])};
}

export function AddressAutocomplete({
                                        defaultDisplayValue,
                                        onSelect,
                                        onClear,
                                        placeholder,
                                    }: Props) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDisplay, setSelectedDisplay] = useState(defaultDisplayValue ?? "");
    const [isLoading, setIsLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchSuggestions = useCallback(async (q: string) => {
        if (q.length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            const url = `${PDOK_SUGGEST_URL}?q=${encodeURIComponent(q)}&fq=type:adres&rows=6`;
            const res = await fetch(url);
            if (!res.ok) return;
            const data = await res.json();
            const items: Suggestion[] = (data.response?.docs ?? []).map(
                (doc: { id: string; weergavenaam: string }) => ({
                    id: doc.id,
                    weergavenaam: doc.weergavenaam,
                }),
            );
            setSuggestions(items);
            setIsOpen(items.length > 0);
            setHighlightedIndex(-1);
        } finally {
            setIsLoading(false);
        }
    }, []);

    function handleInputChange(value: string) {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
    }

    async function handleSelect(suggestion: Suggestion) {
        setIsOpen(false);
        setSuggestions([]);

        try {
            const url = `${PDOK_LOOKUP_URL}?id=${encodeURIComponent(suggestion.id)}`;
            const res = await fetch(url);
            if (!res.ok) return;
            const data = await res.json();
            const doc = data.response?.docs?.[0];
            if (!doc) return;

            const coords = parseWktPoint(doc.centroide_ll ?? "");
            if (!coords) return;

            const result: AddressResult = {
                streetName: doc.straatnaam ?? "",
                houseNumber: doc.huisnummer ?? "",
                postalCode: doc.postcode ?? "",
                city: doc.woonplaatsnaam ?? "",
                latitude: coords.latitude,
                longitude: coords.longitude,
            };

            setSelectedDisplay(suggestion.weergavenaam);
            setQuery("");
            onSelect(result);
        } catch {
            // silently fail — user can retry
        }
    }

    function handleClear() {
        setSelectedDisplay("");
        setQuery("");
        setSuggestions([]);
        setIsOpen(false);
        onClear();
    }

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    if (selectedDisplay) {
        return (
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                <MapPin className="size-4 shrink-0 text-muted-foreground"/>
                <span className="flex-1 truncate">{selectedDisplay}</span>
                <button
                    type="button"
                    onClick={handleClear}
                    className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                >
                    <X className="size-4"/>
                </button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
                <Input
                    value={query}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
                        } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setHighlightedIndex((prev) => Math.max(prev - 1, 0));
                        } else if (e.key === "Enter" && highlightedIndex >= 0) {
                            e.preventDefault();
                            handleSelect(suggestions[highlightedIndex]);
                        } else if (e.key === "Escape") {
                            setIsOpen(false);
                        }
                    }}
                    placeholder={placeholder}
                    className="pl-9"
                    autoComplete="off"
                />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                    <ul className="max-h-60 overflow-auto p-1">
                        {suggestions.map((s, i) => (
                            <li key={s.id}>
                                <button
                                    type="button"
                                    onClick={() => handleSelect(s)}
                                    className={cn(
                                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                                        i === highlightedIndex
                                            ? "bg-accent text-accent-foreground"
                                            : "hover:bg-accent hover:text-accent-foreground",
                                    )}
                                >
                                    <MapPin className="size-3.5 shrink-0 text-muted-foreground"/>
                                    <span className="truncate">{s.weergavenaam}</span>
                                </button>
                            </li>
                        ))}
                        {isLoading && (
                            <li className="px-2 py-1.5 text-center text-sm text-muted-foreground">...</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
