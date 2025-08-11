
import React, { useRef, useEffect, useMemo } from 'react';

const pad = (num: number) => num.toString().padStart(2, '0');

const TimePickerColumn: React.FC<{
  values: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  itemHeight: number;
  ariaLabel: string;
}> = ({ values, selectedValue, onSelect, itemHeight, ariaLabel }) => {
  const columnRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);

  useEffect(() => {
    const columnIndex = values.indexOf(selectedValue);
    if (columnIndex !== -1 && columnRef.current && !isDragging.current) {
      columnRef.current.scrollTo({ top: columnIndex * itemHeight, behavior: 'smooth' });
    }
  }, [selectedValue, values, itemHeight]);
  
  const handleScroll = () => {
    if (isScrolling.current) {
      clearTimeout(isScrolling.current);
    }
    isScrolling.current = setTimeout(() => {
        if (columnRef.current && !isDragging.current) {
            const { scrollTop } = columnRef.current;
            const index = Math.round(scrollTop / itemHeight);
            const snappedScrollTop = index * itemHeight;
            const targetValue = values[index];

            if (scrollTop !== snappedScrollTop) {
               columnRef.current.scrollTo({ top: snappedScrollTop, behavior: 'smooth' });
            }
            if (targetValue && selectedValue !== targetValue) {
                onSelect(values[index]);
            }
        }
    }, 150);
  };

  useEffect(() => {
    const col = columnRef.current;
    if (!col) return;

    const onMouseDown = (e: MouseEvent) => {
        isDragging.current = true;
        startY.current = e.pageY;
        startScrollTop.current = col.scrollTop;
        col.style.cursor = 'grabbing';
        col.style.userSelect = 'none';
        e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const y = e.pageY;
        const walk = y - startY.current;
        col.scrollTop = startScrollTop.current - walk;
    };

    const onMouseUp = () => {
        if (!isDragging.current) return;
        isDragging.current = false;
        col.style.cursor = 'grab';
        col.style.userSelect = 'auto';

        // Manually trigger snap logic after drag ends
        if (isScrolling.current) clearTimeout(isScrolling.current);
        const { scrollTop } = col;
        const index = Math.round(scrollTop / itemHeight);
        const snappedScrollTop = index * itemHeight;
        const targetValue = values[index];

        col.scrollTo({ top: snappedScrollTop, behavior: 'smooth' });
        if (targetValue && selectedValue !== targetValue) {
            onSelect(targetValue);
        }
    };

    col.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    col.addEventListener('mouseleave', onMouseUp);

    return () => {
        col.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        col.removeEventListener('mouseleave', onMouseUp);
    };
  }, [values, itemHeight, onSelect, selectedValue]);
  
  return (
    <div
      ref={columnRef}
      onScroll={handleScroll}
      className="no-scrollbar h-40 overflow-y-scroll snap-y snap-mandatory cursor-grab"
      style={{ scrollPaddingTop: `${itemHeight*1.5}px`}}
      aria-label={ariaLabel}
      role="listbox"
    >
      <div style={{ height: `${itemHeight * 1.5}px` }} />
      {values.map((val) => (
        <div
          key={val}
          className={`flex items-center justify-center snap-start transition-all duration-200 [font-variant-numeric:tabular-nums]
            ${val === selectedValue 
                ? 'text-slate-800 dark:text-white font-bold text-2xl' 
                : 'text-slate-400 dark:text-slate-500 text-xl'
            }`}
          style={{ height: `${itemHeight}px` }}
          aria-selected={val === selectedValue}
          role="option"
        >
          {val}
        </div>
      ))}
      <div style={{ height: `${itemHeight * 1.5}px` }} />
    </div>
  );
};

export const TimePicker: React.FC<{
  value: string; // HH:mm
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  const parts = (typeof value === 'string' && value) ? value.split(':') : [];
  const hour = parts[0] || '00';
  const minute = parts[1] || '00';
  
  const ITEM_HEIGHT = 40;

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => pad(i)), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => pad(i)), []);

  const handleHourChange = (newHour: string) => onChange(`${newHour}:${minute}`);
  const handleMinuteChange = (newMinute: string) => onChange(`${hour}:${newMinute}`);

  return (
    <div className="relative bg-slate-100 dark:bg-slate-700/50 rounded-xl py-2">
       <div 
        className="absolute top-1/2 left-0 right-0 h-10 bg-white/50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-600 rounded-lg pointer-events-none"
        style={{ transform: 'translateY(calc(-50% + 2px))' }}
        aria-hidden="true"
       />
       <div className="grid grid-cols-2 items-center text-center">
            <TimePickerColumn
                values={hours}
                selectedValue={pad(parseInt(hour, 10) || 0)}
                onSelect={handleHourChange}
                itemHeight={ITEM_HEIGHT}
                ariaLabel="Hours"
            />
             <TimePickerColumn
                values={minutes}
                selectedValue={pad(parseInt(minute, 10) || 0)}
                onSelect={handleMinuteChange}
                itemHeight={ITEM_HEIGHT}
                ariaLabel="Minutes"
            />
       </div>
    </div>
  );
};
