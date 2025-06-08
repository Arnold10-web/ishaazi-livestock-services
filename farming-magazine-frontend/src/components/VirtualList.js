import React, { useState, useEffect, useRef, useMemo } from 'react';

const VirtualList = ({ 
  items, 
  itemHeight = 200, 
  containerHeight = 600, 
  renderItem, 
  overscan = 5,
  className = '',
  loading = false,
  emptyMessage = 'No items to display'
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef();

  const totalHeight = items.length * itemHeight;
  const viewportHeight = containerHeight;
  
  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(viewportHeight / itemHeight),
      items.length - 1
    );
    
    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan)
    };
  }, [scrollTop, itemHeight, viewportHeight, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      result.push({
        index: i,
        item: items[i],
        style: {
          position: 'absolute',
          top: i * itemHeight,
          height: itemHeight,
          width: '100%'
        }
      });
    }
    return result;
  }, [visibleRange, items, itemHeight]);

  const handleScroll = (e) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Scroll to top when items change
  useEffect(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center`} style={{ height: containerHeight }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center`} style={{ height: containerHeight }}>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollElementRef}
      className={`${className} overflow-auto`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ index, item, style }) => (
          <div key={index} style={style}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualList;
