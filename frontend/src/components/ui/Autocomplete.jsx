import { useState, useEffect, useRef } from "react";

export default function Autocomplete({
  options,
  selectedValue,
  onSelect,
  placeholder,
  maxResults = 4,
  renderOption,
  getOptionLabel,
  isOptionDisabled,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const selected = options.find((o) => o.id === selectedValue);
    setQuery(selected ? getOptionLabel(selected) : "");
  }, [selectedValue, options]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options
    .filter((o) => getOptionLabel(o).toLowerCase().includes(query.toLowerCase()))
    .slice(0, maxResults);

  function handleSelect(option) {
    onSelect(option.id);
    setQuery(getOptionLabel(option));
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onSelect(null);
        }}
        onFocus={() => setOpen(true)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
      />
      {open && query && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white text-gray-700 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
          {filtered.map((option) => {
            const disabled = isOptionDisabled?.(option);
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(option)}
                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-200 dark:hover:bg-white/5"
              >
                {renderOption ? renderOption(option) : getOptionLabel(option)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}