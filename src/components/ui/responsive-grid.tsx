import { Children, type ReactNode, useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';

type ResponsiveGridProps = {
  children: ReactNode;
  /**
   * Narrowest a cell may get before the grid adds a column. Only affects wide
   * screens; the phone layout is always two columns.
   */
  minColumnWidth?: number;
  gap?: number;
  maxColumns?: number;
  defaultColumns?: number;
};

/**
 * A wrapping grid whose columns are exact.
 *
 * Two earlier attempts both collapsed to a single column, for the same reason:
 * `gap` on a wrapping row is added *between* items on a line, so two cells plus
 * the gap have to fit the row or the second one wraps. With a 342pt content
 * width and 150pt cells the arithmetic landed within about a point of
 * overflowing — which means "correct" on one device and a single stacked column
 * on another. Percentage bases don't help, because the gap is still counted.
 *
 * So the gap lives in each cell's padding instead, and cells are a flat 1/N of
 * the container. Two columns then fit by definition, at any width, with no
 * measurement and no arithmetic to get wrong. The negative margin on the row
 * cancels the padding on the outer edges so the grid stays flush.
 *
 * Measurement is still used, but only to decide whether a wide screen deserves
 * a third column — if it never fires, the layout is still a correct 2x2.
 */
export function ResponsiveGrid({
  children,
  minColumnWidth = 200,
  gap = 16,
  maxColumns = 3,
  defaultColumns = 2,
}: ResponsiveGridProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setWidth((prev) => (Math.abs(prev - next) < 1 ? prev : next));
  };

  const items = Children.toArray(children);

  const columns =
    width > 0 ? Math.max(defaultColumns, Math.min(maxColumns, Math.floor((width + gap) / (minColumnWidth + gap)))) : defaultColumns;

  const cellWidth = `${100 / columns}%` as const;

  return (
    <View
      onLayout={onLayout}
      style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -gap / 2 }}
    >
      {items.map((child, i) => (
        <View key={i} style={{ width: cellWidth, padding: gap / 2 }}>
          {child}
        </View>
      ))}
    </View>
  );
}
