import { useEffect, useRef, useState } from 'react';
import { geocode } from '../api';
import { FlagIcon, PinIcon } from './icons';

/** Text input with place suggestions. Suggestions come from the backend
 * (ORS geocoding when configured, curated CBD places otherwise). */
export function PlaceField({ id, label, value, onSelect, onUseCurrentLocation, tag }) {
  const [text, setText] = useState(value ? value.label : '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    setText(value ? value.label : '');
  }, [value]);

  function handleChange(e) {
    const next = e.target.value;
    setText(next);
    onSelect(null); // typed text invalidates the previous selection
    clearTimeout(debounceRef.current);
    if (next.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const { results } = await geocode(next);
        setSuggestions(results);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }

  function choose(place) {
    onSelect(place);
    setText(place.label);
    setOpen(false);
  }

  const LabelIcon = id === 'to' ? FlagIcon : PinIcon;

  return (
    <div className="place-field">
      <div className="place-field__head">
        <label htmlFor={id}>
          <LabelIcon size={17} />
          {label}
        </label>
        {tag ? <span className="tag">{tag}</span> : null}
      </div>
      <input
        id={id}
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="Type a place or street"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {onUseCurrentLocation ? (
        <button type="button" className="link-button" onClick={onUseCurrentLocation}>
          Use my current location
        </button>
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul className="suggestions" role="listbox">
          {suggestions.map((s) => (
            <li key={`${s.label}-${s.lat}`}>
              <button type="button" onClick={() => choose(s)}>
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && suggestions.length === 0 && text.trim().length >= 2 ? (
        <p className="field-note">
          No matches. Try a station, park or street name in central Melbourne.
        </p>
      ) : null}
    </div>
  );
}
