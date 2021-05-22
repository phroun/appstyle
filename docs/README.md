# appstyle

## Documentation Index

 * [Getting Started](/README.md)
 * [Window Management](windows.md)
 * [Callbacks](callbacks.md)
 * [Grid System](grid-system.md)
 * [Keyboard Events](keyboard-events.md)
 * [Mouse Events](mouse-events.md)
 * [Focus](focus.md)
 * [Widgets](widgets/README.md)
 * [Auxiliary Function](auxiliary-functions.md)
 * [Helper Functions](helper-functions.md)

## Custom Painting

If you add a [Paint Handler](docs/callbacks.md#paint-handler) to your Window Class, you'll be passed the window object and a 2D canvas drawing context. The standard library has some functions that you can call manually which are normally part of the default paint handler:

  * [appstyle.drawBackground](docs/drawing.md#draw-background) - This paints the background of the window. If you don't call this, or paint the background area yourself, the window will be see-through.
  * [appstyle.drawWidgets](docs/drawing.md#draw-widgets) - This paints all of the widgets on the window.
  * [appstyle.drawText](docs/drawing.md#draw-text) - This paints text onto the canvas in the same way the default widgets do.
  * [appstyle.drawFlatOutline](docs/drawing.md#draw-flat-outline) - This draws a flat colored outline surrounding a rectangular area.
  * [appstyle.drawBevel](docs/drawing.md#draw-bevel) - This draws a beveled outline surrounding a rectangular area.

## Window Classes in the standard library:

  * `appstyle.debugger` - An inspector/debugger tool window.

## Mouse Cursor Numbers

  0. pointer (arrow)
  1. crosshair
  2. horizontal sizer
  3. vertical sizer
  4. diagonal sizer
