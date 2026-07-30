import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { CalenderIcon } from "../../icons";

export default function DatePicker({ id, value, onChange, placeholder }) {
  const instanceRef = useRef(null);

  useEffect(() => {
    instanceRef.current = flatpickr(`#${id}`, {
      mode: "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate: value,
      onChange: (selectedDates, dateStr) => onChange(dateStr),
    });

    return () => {
      instanceRef.current?.destroy();
    };
  }, [id]);

  useEffect(() => {
    if (instanceRef.current && value) {
      instanceRef.current.setDate(value, false);
    }
  }, [value]);

  return (
    <div className="relative">
      <input
        id={id}
        placeholder={placeholder}
        readOnly
        className="h-10 w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 pr-9 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
        <CalenderIcon className="w-4 h-4" />
      </span>
    </div>
  );
}